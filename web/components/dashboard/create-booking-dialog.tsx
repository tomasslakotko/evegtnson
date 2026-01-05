"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { format, addMinutes } from "date-fns"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Member {
  id: string
  name: string | null
  image: string | null
  email: string | null
}

interface CreateBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: Date
  members: Member[]
  onSuccess: () => void
}

export function CreateBookingDialog({
  open,
  onOpenChange,
  initialDate,
  members,
  onSuccess
}: CreateBookingDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [hostId, setHostId] = useState("")
  const [isBlocked, setIsBlocked] = useState(false)
  
  // Form state
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [attendeeName, setAttendeeName] = useState("")
  const [attendeeEmail, setAttendeeEmail] = useState("")
  const [attendeePhone, setAttendeePhone] = useState("")
  const [attendeeNotes, setAttendeeNotes] = useState("")

  // Initialize form when opening
  useEffect(() => {
    if (open && initialDate) {
      setDate(format(initialDate, "yyyy-MM-dd"))
      setTime(format(initialDate, "HH:mm"))
      // Default end time (1 hour later)
      setEndTime(format(addMinutes(initialDate, 60), "HH:mm"))
    }
  }, [open, initialDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (isBlocked && (!date || !time || !endTime || !hostId)) {
        alert("Please select a host, date, and time range")
        return
    }

    if (!isBlocked && (!title || !date || !time || !hostId)) {
        alert("Please fill in all required fields")
        return
    }

    if (!isBlocked && (!attendeeName || !attendeeEmail)) {
        alert("Please provide attendee name and email")
        return
    }

    setIsLoading(true)
    
    try {
      const startTime = new Date(`${date}T${time}`)
      let endTimeDate: Date | undefined
      
      // If blocked or custom end time provided
      if (isBlocked || endTime) {
          endTimeDate = new Date(`${date}T${endTime}`)
      } else {
          // Default 1 hour if not blocked and no end time
          endTimeDate = addMinutes(startTime, 60)
      }
      
      const payload = {
        title: isBlocked ? "Blocked Time" : title,
        hostId: hostId,
        startTime: startTime.toISOString(),
        endTime: endTimeDate.toISOString(),
        attendeeName: isBlocked ? "Blocked Time" : attendeeName,
        attendeeEmail: isBlocked ? "blocked@internal.com" : attendeeEmail,
        attendeePhone: isBlocked ? "" : attendeePhone,
        attendeeNotes: isBlocked ? "Manual Block" : attendeeNotes,
        status: "confirmed"
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        onSuccess()
        onOpenChange(false)
        resetForm()
      } else {
        const data = await res.json().catch(() => ({ message: "Failed to create booking" }))
        alert(data.message)
      }
    } catch (error) {
      console.error(error)
      alert("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setAttendeeName("")
    setAttendeeEmail("")
    setAttendeePhone("")
    setAttendeeNotes("")
    setIsBlocked(false)
    setHostId("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isBlocked ? "Block Time" : "Create Schedule"}</DialogTitle>
          <DialogDescription>
            {isBlocked ? "Mark a time slot as unavailable." : "Manually add a booking to the calendar."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          
          <div className="flex items-center justify-between space-x-2 bg-slate-50 p-3 rounded-lg">
            <Label htmlFor="block-mode" className="flex-1 cursor-pointer">Block Time Mode</Label>
            <Switch id="block-mode" checked={isBlocked} onCheckedChange={setIsBlocked} />
          </div>

          <div className="grid gap-2">
            <Label>Assign to Host</Label>
            <Select value={hostId} onValueChange={setHostId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {members.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isBlocked && (
            <div className="grid gap-2">
              <Label>Meeting Title</Label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Enter meeting title" 
                required
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label>Date</Label>
            <Input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start Time</Label>
              <Input 
                type="time" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>End Time</Label>
              <Input 
                type="time" 
                value={endTime} 
                onChange={e => setEndTime(e.target.value)} 
                required
              />
            </div>
          </div>

          {!isBlocked && (
            <>
              <div className="grid gap-2">
                <Label>Attendee Name</Label>
                <Input 
                  value={attendeeName} 
                  onChange={e => setAttendeeName(e.target.value)} 
                  placeholder="John Doe" 
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Attendee Email</Label>
                <Input 
                  type="email" 
                  value={attendeeEmail} 
                  onChange={e => setAttendeeEmail(e.target.value)} 
                  placeholder="john@example.com" 
                  required
                />
              </div>
              
               <div className="grid gap-2">
                <Label>Attendee Phone (Optional)</Label>
                <Input 
                  type="tel" 
                  value={attendeePhone} 
                  onChange={e => setAttendeePhone(e.target.value)} 
                  placeholder="+1 234 567 890" 
                />
              </div>

              <div className="grid gap-2">
                <Label>Notes (Optional)</Label>
                <Textarea 
                  value={attendeeNotes} 
                  onChange={e => setAttendeeNotes(e.target.value)} 
                  placeholder="Any additional notes..."
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isBlocked ? "Block Time" : "Create Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
