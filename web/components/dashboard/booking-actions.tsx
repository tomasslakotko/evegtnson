"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, Edit, X, Check, XCircle, RefreshCw, Link as LinkIcon, Edit2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface BookingActionsProps {
  booking: {
    id: string
    startTime: Date | string
    endTime: Date | string
    status: string
    attendeeName: string
    attendeeEmail: string
    attendeePhone?: string | null
    attendeeNotes?: string | null
    meetingUrl?: string | null
    eventType: {
      duration: number
    }
  }
  compact?: boolean // New prop for compact view in calendar
  variant?: "default" | "icon" // New prop to render just the edit icon
}

export function BookingActions({ booking, compact = false, variant = "default" }: BookingActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [assignLinkOpen, setAssignLinkOpen] = useState(false)
  const startTime = typeof booking.startTime === 'string' 
    ? new Date(booking.startTime) 
    : booking.startTime
    
  const [newDate, setNewDate] = useState<Date | undefined>(startTime)
  const [newTime, setNewTime] = useState<string>(
    format(startTime, "HH:mm")
  )
  const [editData, setEditData] = useState({
    attendeeName: booking.attendeeName,
    attendeeEmail: booking.attendeeEmail,
    attendeePhone: booking.attendeePhone || "",
    attendeeNotes: booking.attendeeNotes || "",
  })
  const [meetingUrl, setMeetingUrl] = useState(booking.meetingUrl || "")

  const handleReschedule = async () => {
    if (!newDate || !newTime) return

    setIsLoading(true)
    try {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newStartTime = new Date(newDate)
      newStartTime.setHours(hours, minutes, 0, 0)

      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime: newStartTime.toISOString() }),
      })

      if (res.ok) {
        setRescheduleOpen(false)
        router.refresh()
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to reschedule" }))
        alert(`Failed to reschedule: ${errorData.message || res.statusText}`)
      }
    } catch (error) {
      alert("Failed to reschedule booking")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })

      if (res.ok) {
        setEditOpen(false)
        router.refresh()
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to update booking" }))
        alert(`Failed to update booking: ${errorData.message}`)
      }
    } catch (error) {
      alert("Failed to update booking")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignLink = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingUrl: meetingUrl || "" }),
      })

      if (res.ok) {
        setAssignLinkOpen(false)
        router.refresh()
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to assign meeting link" }))
        alert(`Failed to assign meeting link: ${errorData.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error assigning link:", error)
      alert("Failed to assign meeting link")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (status: "confirmed" | "cancelled" | "rejected") => {
    if (!confirm(`Are you sure you want to ${status === "confirmed" ? "approve" : status} this booking?`)) {
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        const errorData = await res.json().catch(() => ({ message: `Failed to ${status} booking` }))
        alert(errorData.message)
      }
    } catch (error) {
      alert(`Failed to ${status} booking`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.refresh()
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to cancel booking" }))
        alert(errorData.message)
      }
    } catch (error) {
      alert("Failed to cancel booking")
    } finally {
      setIsLoading(false)
    }
  }

  // If variant is icon, return only the edit button (for header)
  if (variant === "icon") {
    return (
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Edit2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>Update booking details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Attendee Name</Label>
              <Input
                value={editData.attendeeName}
                onChange={(e) => setEditData({ ...editData, attendeeName: e.target.value })}
              />
            </div>
            <div>
              <Label>Attendee Email</Label>
              <Input
                type="email"
                value={editData.attendeeEmail}
                onChange={(e) => setEditData({ ...editData, attendeeEmail: e.target.value })}
              />
            </div>
            <div>
              <Label>Attendee Phone</Label>
              <Input
                type="tel"
                value={editData.attendeePhone}
                onChange={(e) => setEditData({ ...editData, attendeePhone: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={editData.attendeeNotes}
                onChange={(e) => setEditData({ ...editData, attendeeNotes: e.target.value })}
              />
            </div>
            <Button onClick={handleEdit} disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={compact ? "flex items-center gap-2 w-full" : "flex items-center gap-2 mt-4"}>
      {booking.status === "confirmed" && (
        <>
          <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reschedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reschedule Booking</DialogTitle>
                <DialogDescription>
                  Select a new date and time for this booking
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>New Date</Label>
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    className="rounded-md border w-fit"
                    disabled={(date) => date < new Date()}
                  />
                </div>
                <div>
                  <Label>New Time</Label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
                <Button onClick={handleReschedule} disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Reschedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {!compact && (
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Edit Booking</DialogTitle>
                    <DialogDescription>
                      Update booking details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Attendee Name</Label>
                      <Input
                        value={editData.attendeeName}
                        onChange={(e) =>
                          setEditData({ ...editData, attendeeName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Attendee Email</Label>
                      <Input
                        type="email"
                        value={editData.attendeeEmail}
                        onChange={(e) =>
                          setEditData({ ...editData, attendeeEmail: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Attendee Phone</Label>
                      <Input
                        type="tel"
                        value={editData.attendeePhone}
                        onChange={(e) =>
                          setEditData({ ...editData, attendeePhone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={editData.attendeeNotes}
                        onChange={(e) =>
                          setEditData({ ...editData, attendeeNotes: e.target.value })
                        }
                      />
                    </div>
                    <Button onClick={handleEdit} disabled={isLoading} className="w-full">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={assignLinkOpen} onOpenChange={setAssignLinkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading} className={compact ? "flex-1" : ""}>
                <LinkIcon className="h-4 w-4 mr-2" />
                {compact ? "Link" : "Assign Link"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Meeting Link</DialogTitle>
                <DialogDescription>
                  Add or update the meeting link for this booking
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Meeting URL</Label>
                  <Input
                    type="url"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a meeting link (Google Meet, Teams, Zoom, MiroTalk, etc.)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAssignLink} 
                    disabled={isLoading} 
                    className="flex-1"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Link
                  </Button>
                  {meetingUrl && (
                    <Button
                      variant="outline"
                      onClick={() => setMeetingUrl("")}
                      disabled={isLoading}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {booking.status !== "confirmed" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange("confirmed")}
          disabled={isLoading}
          className={compact ? "flex-1" : ""}
        >
          <Check className="h-4 w-4 mr-2" />
          Approve
        </Button>
      )}

      {booking.status === "confirmed" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange("rejected")}
          disabled={isLoading}
          className={compact ? "hidden" : ""}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Decline
        </Button>
      )}

      <Button
        variant="destructive"
        size={compact ? "icon" : "sm"}
        onClick={handleCancel}
        disabled={isLoading}
        title="Cancel Booking"
      >
        <X className="h-4 w-4" />
        {!compact && <span className="ml-2">Cancel</span>}
      </Button>
    </div>
  )
}
