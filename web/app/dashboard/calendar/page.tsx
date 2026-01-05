"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addWeeks, 
  subWeeks, 
  startOfDay, 
  isToday,
  getHours,
  getMinutes,
  setHours,
  setMinutes
} from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Search, Clock, User, Mail, Phone, Link as LinkIcon, FileText, X, Video, Edit2, MoreHorizontal, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { BookingActions } from "@/components/dashboard/booking-actions"
import { CreateBookingDialog } from "@/components/dashboard/create-booking-dialog"
import Link from "next/link"

interface Member {
  id: string
  name: string | null
  image: string | null
  email: string | null
}

interface EventType {
  id: string
  title: string
  duration: number
  locationType: string
}

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: string
  attendeeName: string
  attendeeEmail: string
  attendeePhone?: string | null
  attendeeNotes?: string | null
  meetingUrl?: string | null
  eventType: {
    title: string
    duration: number
    locationType: string
  }
  host: {
    id: string
    name: string | null
    image: string | null
    email: string | null
  }
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8 AM to 8 PM

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<"week" | "day">("week")
  
  // State for current time indicator
  const [now, setNow] = useState(new Date())
  
  // Filter state
  const [selectedHosts, setSelectedHosts] = useState<string[]>([])
  
  // Create Booking Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Date | undefined>(undefined)
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Update "now" every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, eventTypesRes] = await Promise.all([
          fetch("/api/organization/members"),
          fetch("/api/event-types")
        ])

        if (membersRes.ok) {
          const data = await membersRes.json()
          setMembers(data)
          setSelectedHosts(prev => {
             if (prev.length === 0) return data.map((m: Member) => m.id)
             return prev
          })
        }
        
        if (eventTypesRes.ok) {
          const data = await eventTypesRes.json()
          setEventTypes(data)
        }
      } catch (error) {
        console.error("Failed to fetch data", error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [currentDate])

  const fetchBookings = async () => {
    setIsLoading(true)
    try {
      const start = startDate.toISOString()
      const end = endDate.toISOString()
      
      const res = await fetch(`/api/bookings/calendar?start=${start}&end=${end}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data)
      }
    } catch (error) {
      console.error("Failed to fetch bookings", error)
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
    setNow(new Date()) // Update time immediately on click
  }
  const navigatePrevious = () => setCurrentDate(prev => subWeeks(prev, 1))
  const navigateNext = () => setCurrentDate(prev => addWeeks(prev, 1))

  const toggleHost = (hostId: string) => {
    setSelectedHosts(prev => 
      prev.includes(hostId) 
        ? prev.filter(id => id !== hostId) 
        : [...prev, hostId]
    )
  }

  const toggleAllHosts = () => {
    if (selectedHosts.length === members.length) {
      setSelectedHosts([])
    } else {
      setSelectedHosts(members.map(m => m.id))
    }
  }

  const handleSlotClick = (day: Date, hour: number) => {
    const slotDate = setMinutes(setHours(day, hour), 0)
    setSelectedSlot(slotDate)
    setCreateDialogOpen(true)
  }

  // Filter bookings based on selected hosts
  const filteredBookings = bookings.filter(b => selectedHosts.includes(b.host.id));

  const getEventStyle = (booking: Booking) => {
    const start = new Date(booking.startTime)
    const startHour = getHours(start)
    const startMin = getMinutes(start)
    
    const hourHeight = 80
    const minutesOffset = (startMin / 60) * hourHeight
    const hoursOffset = (startHour - 8) * hourHeight
    const top = Math.max(0, hoursOffset + minutesOffset)
    
    const duration = booking.eventType.duration
    const height = (duration / 60) * hourHeight

    return {
      top: `${top}px`,
      height: `${height}px`,
    }
  }
  
  // Calculate top position for current time line
  const getCurrentTimeTop = () => {
    const currentHour = getHours(now)
    const currentMin = getMinutes(now)
    
    // Check if time is within calendar bounds (8 AM - 8 PM)
    if (currentHour < 8 || currentHour > 20) return null
    
    const hourHeight = 80
    const minutesOffset = (currentMin / 60) * hourHeight
    const hoursOffset = (currentHour - 8) * hourHeight
    
    return hoursOffset + minutesOffset
  }

  const getDayBookings = (day: Date) => {
    return filteredBookings.filter(b => isSameDay(new Date(b.startTime), day))
  }

  const getEventColor = (hostId: string) => {
    const colors = [
      "bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200",
      "bg-green-100 border-green-200 text-green-700 hover:bg-green-200",
      "bg-purple-100 border-purple-200 text-purple-700 hover:bg-purple-200",
      "bg-orange-100 border-orange-200 text-orange-700 hover:bg-orange-200",
      "bg-pink-100 border-pink-200 text-pink-700 hover:bg-pink-200",
      "bg-indigo-100 border-indigo-200 text-indigo-700 hover:bg-indigo-200",
    ]
    const index = hostId.charCodeAt(0) % colors.length
    return colors[index]
  }
  
  const currentTimeTop = getCurrentTimeTop()

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-6">
      <CreateBookingDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        initialDate={selectedSlot}
        members={members}
        onSuccess={fetchBookings}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xl font-medium text-muted-foreground">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <div className="flex items-center rounded-md border bg-white dark:bg-slate-900 shadow-sm ml-4">
              <Button variant="ghost" size="icon" onClick={navigatePrevious} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={navigateToday} className="h-8 px-3 font-normal">
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={navigateNext} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Button onClick={() => setCreateDialogOpen(true)}>
             <Plus className="h-4 w-4 mr-2" />
             New Booking
           </Button>
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search event..." className="pl-8" />
          </div>
          <Select value={view} onValueChange={(v: any) => setView(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[300px_1fr] gap-6 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-4 overflow-y-auto pr-2">
          {/* Members Filter */}
          <Card className="border-none shadow-none bg-transparent">
             <div className="font-semibold mb-4 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <User className="h-4 w-4" />
                 Team Members
               </div>
                <Button variant="ghost" size="sm" onClick={toggleAllHosts} className="h-6 text-xs text-muted-foreground">
                 {selectedHosts.length === members.length ? "Hide All" : "Select All"}
               </Button>
             </div>
             <div className="space-y-2">
               {members.map(member => (
                 <div 
                   key={member.id} 
                   className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                   onClick={() => toggleHost(member.id)}
                 >
                   <Checkbox 
                     checked={selectedHosts.includes(member.id)}
                     onCheckedChange={() => toggleHost(member.id)}
                     className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                   />
                   <div className="flex items-center gap-2 flex-1 min-w-0">
                     <Avatar className="h-6 w-6">
                       <AvatarImage src={member.image || ""} />
                       <AvatarFallback className="text-[10px]">{member.name?.charAt(0)}</AvatarFallback>
                     </Avatar>
                     <span className="text-sm truncate flex-1">{member.name || member.email}</span>
                   </div>
                   {/* Color indicator */}
                   <div className={`w-2 h-2 rounded-full ${getEventColor(member.id).split(' ')[0].replace('bg-', 'bg-').replace('100', '500')}`} />
                 </div>
               ))}
               {members.length === 0 && (
                 <div className="text-sm text-muted-foreground italic px-2">No members found</div>
               )}
             </div>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-none shadow-none bg-transparent mt-4 pt-4 border-t border-dashed">
             <div className="font-semibold mb-4 flex items-center gap-2">
               <CalendarIcon className="h-4 w-4" />
               Upcoming Events
             </div>
             <div className="space-y-3">
               {filteredBookings.slice(0, 5).map(booking => (
                 <div 
                    key={booking.id} 
                    className="p-3 bg-white dark:bg-slate-900 border rounded-lg shadow-sm"
                 >
                    <div className="flex items-center gap-2 mb-2">
                       <div className={`w-1 h-8 rounded-full ${getEventColor(booking.host.id).split(' ')[0].replace('bg-', 'bg-')}`} />
                       <div>
                         <div className="font-medium text-sm line-clamp-1">{booking.eventType.title}</div>
                         <div className="text-xs text-muted-foreground">
                           {format(new Date(booking.startTime), "MMM d, HH:mm")}
                         </div>
                       </div>
                    </div>
                 </div>
               ))}
               {filteredBookings.length === 0 && (
                 <div className="text-center text-muted-foreground text-sm py-4">
                   No upcoming events
                 </div>
               )}
             </div>
          </Card>
        </div>

        {/* Calendar Grid */}
        <Card className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-slate-900 shadow-sm border rounded-xl">
           <div className="grid grid-cols-[60px_1fr] border-b">
             <div className="p-4 border-r bg-slate-50/50"></div>
             <div className={`grid ${view === 'week' ? 'grid-cols-7' : 'grid-cols-1'} divide-x`}>
               {(view === 'week' ? days : [currentDate]).map((day) => (
                 <div key={day.toString()} className={cn("p-3 text-center", isToday(day) && "bg-blue-50/50 dark:bg-blue-900/10")}>
                    <div className={cn("text-xs font-medium uppercase mb-1", isToday(day) ? "text-blue-600" : "text-muted-foreground")}>
                      {format(day, "EEE")}
                    </div>
                    <div className={cn("text-xl font-bold h-8 w-8 flex items-center justify-center mx-auto rounded-full", 
                      isToday(day) ? "bg-blue-600 text-white" : "text-foreground")}>
                      {format(day, "d")}
                    </div>
                 </div>
               ))}
             </div>
           </div>

           <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
             <div className="grid grid-cols-[60px_1fr] relative min-w-[600px]">
               {/* Time Column */}
               <div className="border-r bg-slate-50/30 relative">
                 {HOURS.map((hour) => (
                   <div key={hour} className="h-[80px] border-b text-xs text-muted-foreground text-right pr-3 pt-2 relative">
                     {hour}:00
                   </div>
                 ))}
                 
                 {/* Current Time Marker */}
                 {currentTimeTop !== null && (
                   <div 
                      className="absolute right-0 w-full flex items-center justify-end pr-1 z-30 pointer-events-none"
                      style={{ top: `${currentTimeTop}px`, transform: 'translateY(-50%)' }}
                   >
                     <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-l-md shadow-sm">
                        {format(now, "HH:mm")}
                     </div>
                   </div>
                 )}
               </div>

               {/* Days Columns */}
               <div className={`grid ${view === 'week' ? 'grid-cols-7' : 'grid-cols-1'} divide-x relative`}>
                 {(view === 'week' ? days : [currentDate]).map((day) => {
                   const dayBookings = getDayBookings(day)
                   const isTodayColumn = isToday(day)
                   
                   return (
                     <div key={day.toString()} className="relative group/day">
                       {HOURS.map((hour) => (
                         <div 
                           key={hour} 
                           className="h-[80px] border-b border-dashed border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                           onClick={() => handleSlotClick(day, hour)}
                           title={`Click to add event at ${hour}:00`}
                         />
                       ))}
                       
                       {/* Current Time Line (Only for Today) */}
                       {isTodayColumn && currentTimeTop !== null && (
                          <div 
                            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                            style={{ top: `${currentTimeTop}px` }}
                          >
                             {/* Dot at the start of the line */}
                             <div className="absolute -left-1.5 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                             {/* The line itself */}
                             <div className="h-[2px] w-full bg-red-500 opacity-50" />
                          </div>
                       )}

                       {dayBookings.map((booking) => {
                         const style = getEventStyle(booking)
                         const colorClass = getEventColor(booking.host.id)
                         
                         return (
                           <Popover key={booking.id} modal={false}>
                             <PopoverTrigger asChild>
                               <div
                                 className={cn(
                                   "absolute left-1 right-1 rounded-md p-2 text-xs border overflow-hidden hover:z-10 transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between z-10",
                                   colorClass
                                 )}
                                 style={style}
                                 onClick={(e) => e.stopPropagation()} // Prevent triggering slot click
                               >
                                 <div>
                                   <div className="font-semibold leading-tight mb-1">{booking.eventType.title}</div>
                                   <div className="flex items-center gap-1 opacity-80">
                                     <Clock className="h-3 w-3" />
                                     {format(new Date(booking.startTime), "HH:mm")}
                                   </div>
                                 </div>
                                 
                                 <div className="mt-1 flex items-center gap-1.5 pt-1 border-t border-black/5 dark:border-white/10">
                                   <Avatar className="h-4 w-4 border border-black/10 dark:border-white/10">
                                     <AvatarImage src={booking.host.image || ""} />
                                     <AvatarFallback className="text-[7px] bg-black/5 dark:bg-white/10">{booking.host.name?.charAt(0)}</AvatarFallback>
                                   </Avatar>
                                   <span className="truncate opacity-75 font-medium">{booking.host.name?.split(' ')[0]}</span>
                                 </div>
                               </div>
                             </PopoverTrigger>
                             <PopoverContent 
                                className="w-80 p-0 overflow-hidden shadow-xl border-slate-200 z-50" 
                                align="start" 
                                side="right" 
                                sideOffset={10}
                                collisionBoundary={scrollContainerRef.current}
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                onClick={(e) => e.stopPropagation()} // Prevent triggering slot click inside popover
                             >
                               <div className="bg-white dark:bg-slate-900">
                                 {/* Header */}
                                 <div className="p-4 border-b flex justify-between items-start bg-slate-50/50">
                                   <div className="flex-1">
                                     <h3 className="font-semibold text-lg">{booking.eventType.title}</h3>
                                     <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                       <Clock className="h-3.5 w-3.5" />
                                       {format(new Date(booking.startTime), "HH:mm")} - {format(new Date(booking.endTime), "HH:mm")}
                                     </div>
                                   </div>
                                   <BookingActions booking={booking} variant="icon" /> 
                                 </div>

                                 {/* Body */}
                                 <div className="p-4 space-y-4">
                                   {booking.meetingUrl && (
                                     <div className="mb-2">
                                       <a 
                                         href={booking.meetingUrl} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="flex items-center justify-center w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-colors"
                                       >
                                         <Video className="h-4 w-4" />
                                         Join the Meeting
                                       </a>
                                     </div>
                                   )}

                                   <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                      <div className="flex items-center gap-2 text-sm">
                                         <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                         <span className="font-medium">{format(new Date(booking.startTime), "MMMM d, yyyy")}</span>
                                      </div>
                                   </div>

                                   <div className="space-y-3">
                                      <div className="flex items-center gap-3 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="font-medium">{booking.attendeeName}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <a href={`mailto:${booking.attendeeEmail}`} className="text-blue-600 hover:underline truncate">
                                          {booking.attendeeEmail}
                                        </a>
                                      </div>
                                      {booking.attendeePhone && (
                                        <div className="flex items-center gap-3 text-sm">
                                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                          <span>{booking.attendeePhone}</span>
                                        </div>
                                      )}
                                   </div>

                                   {/* Tags/Status */}
                                   <div className="flex flex-wrap gap-2">
                                     <span className={`px-2 py-0.5 rounded text-xs font-medium border
                                        ${booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' : 
                                          booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                       {booking.status}
                                     </span>
                                     <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                       {booking.eventType.locationType}
                                     </span>
                                   </div>

                                   {/* Assigned Host Info inside Popover */}
                                   <div className="flex items-center gap-2 pt-2 border-t mt-2">
                                     <Avatar className="h-6 w-6 border-2 border-white dark:border-slate-900">
                                       <AvatarImage src={booking.host.image || ""} />
                                       <AvatarFallback className="text-[10px]">{booking.host.name?.charAt(0)}</AvatarFallback>
                                     </Avatar>
                                     <span className="text-xs text-muted-foreground">
                                       Assigned to <span className="font-medium text-foreground">{booking.host.name}</span>
                                     </span>
                                   </div>
                                 </div>

                                 {/* Footer Actions - Compact */}
                                 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t flex justify-end">
                                    <BookingActions booking={booking} compact />
                                 </div>
                               </div>
                             </PopoverContent>
                           </Popover>
                         )
                       })}
                     </div>
                   )
                 })}
               </div>
             </div>
           </div>
        </Card>
      </div>
    </div>
  )
}
