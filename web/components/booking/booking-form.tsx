"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { format, isBefore, startOfDay } from "date-fns"
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz"
import { Loader2, Globe, Calendar as CalendarIcon, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { TimezoneSelect } from "./timezone-select"

export function BookingForm({ eventType }: { eventType: any }) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookingStep, setBookingStep] = useState<"date" | "form">("date")
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", notes: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [bookingData, setBookingData] = useState<any>(null)
  const [timezone, setTimezone] = useState("Europe/Riga")
  const [busySlots, setBusySlots] = useState<{ startTime: string, endTime: string }[]>([])
  const [schedule, setSchedule] = useState<{ startTime: string, endTime: string } | null>(null)
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [availableDays, setAvailableDays] = useState<number[]>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // Fetch month availability when month changes
  useEffect(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth() + 1
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`
    
    const fetchMonthAvailability = async () => {
      try {
        const res = await fetch(`/api/availability/month?eventTypeId=${eventType.id}&month=${monthStr}`)
        if (res.ok) {
          const data = await res.json()
          setAvailableDays(data.availableDays || [])
        }
      } catch (error) {
        console.error("Failed to fetch month availability", error)
      }
    }
    fetchMonthAvailability()
  }, [currentMonth, eventType.id])

  // Fetch availability when date changes
  useEffect(() => {
    if (date) {
      setIsLoadingAvailability(true)
      const fetchAvailability = async () => {
        try {
          const res = await fetch(`/api/availability?eventTypeId=${eventType.id}&date=${date.toISOString()}`)
          if (res.ok) {
            const data = await res.json()
            setBusySlots(data.busySlots || [])
            setSchedule(data.schedule || null)
          }
        } catch (error) {
          console.error("Failed to fetch availability", error)
        } finally {
          setIsLoadingAvailability(false)
        }
      }
      fetchAvailability()
    }
  }, [date, eventType.id, isSuccess])

  // Generate time slots based on user's schedule
  // Slots are generated in the schedule's timezone, then converted for display
  const timeSlots: Date[] = []
  if (date) {
    // If user has a schedule for this day, use it; otherwise use default 9am-5pm
    const startHour = schedule ? parseInt(schedule.startTime.split(':')[0]) : 9
    const startMinute = schedule ? parseInt(schedule.startTime.split(':')[1]) : 0
    const endHour = schedule ? parseInt(schedule.endTime.split(':')[0]) : 17
    const endMinute = schedule ? parseInt(schedule.endTime.split(':')[1]) : 0

    // Generate slots in 30-minute intervals in the schedule's local time
    let currentHour = startHour
    let currentMinute = startMinute

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      // Create date in local time (schedule timezone)
      const time = new Date(date)
      time.setHours(currentHour, currentMinute, 0, 0)
      timeSlots.push(new Date(time))

      // Move to next 30-minute slot
      currentMinute += 30
      if (currentMinute >= 60) {
        currentMinute = 0
        currentHour += 1
      }
    }
  }

  // Filter out busy slots and past times (using original timeSlots)
  const filteredSlots = timeSlots.filter(slot => {
    // Ensure the slot is not in the past
    if (isBefore(slot, new Date())) {
      return false
    }

    // Check if slot fits within the duration
    const slotStart = slot.getTime()
    const slotEnd = slotStart + eventType.duration * 60000

    // Check if slot would go beyond the end time
    if (schedule) {
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
      const endTime = new Date(date!)
      endTime.setHours(endHour, endMinute, 0, 0)
      if (slotEnd > endTime.getTime()) {
        return false
      }
    }

    // Check if slot overlaps with busy time
    const isBusy = busySlots.some(busy => {
      const busyStart = new Date(busy.startTime).getTime()
      const busyEnd = new Date(busy.endTime).getTime()
      
      // Check if slot overlaps with busy time
      return (slotStart < busyEnd && slotEnd > busyStart)
    })

    return !isBusy
  })

  // Convert filtered slots to selected timezone for display
  const availableSlots = filteredSlots.map(slot => {
    // Convert the slot time to the selected timezone for display
    return toZonedTime(slot, timezone)
  })

  const handleTimeSelect = (time: Date) => {
    // Convert selected time from timezone back to UTC for storage
    // time is in the owner's local timezone, convert to UTC
    setSelectedTime(time.toISOString())
    setBookingStep("form")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTime) return

    setIsSubmitting(true)
    
    try {
        const res = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                eventTypeId: eventType.id,
                startTime: selectedTime,
                attendeeName: formData.name,
                attendeeEmail: formData.email,
                attendeePhone: eventType.locationType === "phone" ? formData.phone : undefined,
                attendeeNotes: formData.notes
            })
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: "Failed to book" }))
          throw new Error(errorData.message || "Failed to book")
        }
        
        const booking = await res.json()
        setBookingData(booking)
        
        // Refresh availability after successful booking
        if (date) {
          const res = await fetch(`/api/availability?eventTypeId=${eventType.id}&date=${date.toISOString()}`)
          if (res.ok) {
            const data = await res.json()
            setBusySlots(data.busySlots || [])
            setSchedule(data.schedule || null)
          }
        }
        
        setIsSuccess(true)
    } catch (err) {
        alert("Booking failed. Please try again.")
    } finally {
        setIsSubmitting(false)
    }
  }

  // Send resize message to parent if in iframe
  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      const height = document.documentElement.scrollHeight
      window.parent.postMessage({ type: 'widget-resize', height }, '*')
    }
  }, [bookingStep, isSuccess, date, selectedTime, formData])

  if (isSuccess && bookingData) {
      const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date
        return new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(d)
      }

      const formatTime = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date
        return new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(d)
      }

      const locationText = eventType.locationType === "mirotalk" 
        ? "MiroTalk Video" 
        : eventType.locationType?.replace("_", " ") || "Online"

      const icalUrl = `/api/bookings/${bookingData.id}/ical`

      return (
          <div className="space-y-6 py-6">
              <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Meeting Booked!</h3>
                  <p className="text-muted-foreground mb-2">Your meeting is awaiting confirmation. You will receive an email with details.</p>
                  {bookingData.status && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      Status: {bookingData.status === "confirmed" ? "Confirmed" : "Pending Confirmation"}
                    </div>
                  )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
                  <div>
                      <h4 className="font-semibold text-lg mb-4">{eventType.title}</h4>
                      
                      <div className="space-y-3">
                          <div className="flex items-start gap-3">
                              <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                  <p className="font-medium">{formatDate(bookingData.startTime)}</p>
                                  <p className="text-sm text-muted-foreground">
                                      {formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}
                                  </p>
                              </div>
                          </div>

                          <div className="flex items-center gap-3">
                              <Globe className="h-5 w-5 text-muted-foreground" />
                              <span className="capitalize">{locationText}</span>
                          </div>

                          {bookingData.meetingUrl && (
                              <div className="pt-2">
                                  <a 
                                      href={bookingData.meetingUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
                                  >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      Join Meeting
                                  </a>
                              </div>
                          )}

                          <div className="pt-2">
                              <a 
                                  href={icalUrl}
                                  download
                                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
                              >
                                  <CalendarIcon className="w-4 h-4" />
                                  Add to Calendar
                              </a>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="text-center">
                  <Button variant="outline" onClick={() => window.location.reload()}>
                      Book Another Meeting
                  </Button>
              </div>
          </div>
      )
  }

  return (
    <div className="h-full flex flex-col">
       {bookingStep === "date" ? (
         <>
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b">
               <div className="flex items-center gap-2">
                 <Globe className="h-4 w-4 text-muted-foreground" />
                 <TimezoneSelect value={timezone} onValueChange={setTimezone} />
               </div>
               
               <div className="flex items-center gap-4">
                 <div className="flex items-center space-x-2">
                    <Label htmlFor="mutual-availability" className="text-sm font-medium">Show mutual availability</Label>
                    <Switch id="mutual-availability" />
                 </div>
                 
                 <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-white dark:bg-slate-700 shadow-sm rounded-md">
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <List className="h-4 w-4" />
                    </Button>
                 </div>
               </div>
             </div>

             <div className="grid md:grid-cols-2 gap-6 h-full">
                <div className="border-r pr-6">
                    <h3 className="font-semibold mb-4">Select Date</h3>
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border w-fit"
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        disabled={(date) => {
                          // Disable past dates
                          if (date < startOfDay(new Date())) {
                            return true
                          }
                          
                          // Disable dates that don't have available slots
                          const day = date.getDate()
                          const month = date.getMonth()
                          const year = date.getFullYear()
                          
                          // Check if this date is in the current month being viewed
                          if (
                            month !== currentMonth.getMonth() ||
                            year !== currentMonth.getFullYear()
                          ) {
                            return false // Let the calendar handle outside dates
                          }
                          
                          // Check if this day has available slots
                          return !availableDays.includes(day)
                        }}
                        modifiers={{
                          available: (date) => {
                            const day = date.getDate()
                            const month = date.getMonth()
                            const year = date.getFullYear()
                            
                            if (
                              month === currentMonth.getMonth() &&
                              year === currentMonth.getFullYear()
                            ) {
                              return availableDays.includes(day)
                            }
                            return false
                          }
                        }}
                        modifiersClassNames={{
                          available: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                        }}
                    />
                </div>
                <div className="pl-2 overflow-y-auto max-h-[400px]">
                     <h3 className="font-semibold mb-4">Select Time</h3>
                     <div className="grid grid-cols-2 gap-2">
                         {isLoadingAvailability ? (
                           <div className="col-span-2 flex justify-center py-8">
                             <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                           </div>
                         ) : (
                           <>
                             {date && availableSlots.map((displayTime, i) => {
                               // Get the original slot (before timezone conversion) for saving
                               const originalSlot = filteredSlots[i]
                               
                               return (
                                 <Button 
                                    key={i} 
                                    variant="outline" 
                                    className="w-full justify-center"
                                    onClick={() => handleTimeSelect(originalSlot)}
                                 >
                                    {formatInTimeZone(displayTime, timezone, "HH:mm")}
                                 </Button>
                               )
                             })}
                             {date && availableSlots.length === 0 && (
                                <p className="col-span-2 text-center text-muted-foreground py-4">
                                  No available slots for this day.
                                </p>
                             )}
                           </>
                         )}
                         {!date && <p className="text-muted-foreground">Pick a date first.</p>}
                     </div>
                </div>
             </div>
         </>
       ) : (
         <div>
             <Button variant="ghost" onClick={() => setBookingStep("date")} className="mb-4 pl-0 hover:bg-transparent hover:underline">&larr; Back</Button>
             <h3 className="text-xl font-bold mb-2">Enter Details</h3>
             <p className="text-muted-foreground mb-6">
                 {selectedTime && formatInTimeZone(new Date(selectedTime), timezone, "EEEE, MMMM d, HH:mm")}
             </p>
             
             <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                 <div className="space-y-2">
                     <Label>Name</Label>
                     <Input 
                        required 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                     />
                 </div>
                 <div className="space-y-2">
                     <Label>Email</Label>
                     <Input 
                        type="email" 
                        required 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                     />
                 </div>
                 {eventType.locationType === "phone" && (
                   <div className="space-y-2">
                     <Label>Phone Number <span className="text-red-500">*</span></Label>
                     <Input 
                        type="tel" 
                        required 
                        placeholder="+1234567890"
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                     />
                   </div>
                 )}
                 <div className="space-y-2">
                     <Label>Notes</Label>
                     <Textarea 
                        value={formData.notes} 
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                     />
                 </div>
                 <Button type="submit" className="w-full" disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Confirm Booking
                 </Button>
             </form>
         </div>
       )}
    </div>
  )
}
