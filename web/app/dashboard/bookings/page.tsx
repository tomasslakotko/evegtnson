import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarIcon, Clock, Video, Phone, Link as LinkIcon } from "lucide-react"
import Link from "next/link"
import { BookingActions } from "@/components/dashboard/booking-actions"

export default async function BookingsPage() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <div className="text-center py-10 text-muted-foreground">Please sign in to view your bookings.</div>
        </div>
      )
    }

    const bookings = await prisma.booking.findMany({
      where: { 
        hostId: session.user.id,
        eventType: {
          isNot: null
        }
      },
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        attendeeName: true,
        attendeeEmail: true,
        attendeePhone: true,
        attendeeNotes: true,
        meetingUrl: true,
        eventType: {
          select: {
            id: true,
            title: true,
            locationType: true,
            duration: true
          }
        },
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Serialize all data to plain objects before rendering
    const serializedBookings = bookings
      .filter(booking => booking.eventType && booking.startTime && booking.endTime)
      .map(booking => {
        try {
          const startTime = new Date(booking.startTime)
          const endTime = new Date(booking.endTime)
          
          // Skip invalid dates
          if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            return null
          }
          
          return {
            id: booking.id,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            status: booking.status || "confirmed",
            attendeeName: booking.attendeeName || "",
            attendeeEmail: booking.attendeeEmail || "",
            attendeePhone: booking.attendeePhone || null,
            attendeeNotes: booking.attendeeNotes || null,
            meetingUrl: booking.meetingUrl || null,
            eventType: {
              title: booking.eventType?.title || "Untitled Event",
              locationType: booking.eventType?.locationType || "Online",
              duration: booking.eventType?.duration || 60
            }
          }
        } catch (error) {
          console.error("Error serializing booking:", error)
          return null
        }
      })
      .filter((booking): booking is NonNullable<typeof booking> => booking !== null)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
      <div className="space-y-4">
        {serializedBookings.map((booking) => {
          const startTime = new Date(booking.startTime)
          const endTime = new Date(booking.endTime)
          
          return (
            <Card key={booking.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  {booking.eventType.title} with {booking.attendeeName || "Guest"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startTime, "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                  </div>
                  <div className="flex items-center">
                    <Video className="mr-2 h-4 w-4" />
                    {booking.eventType.locationType}
                  </div>
                  {booking.attendeePhone && (
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4" />
                      {booking.attendeePhone}
                    </div>
                  )}
                  {booking.meetingUrl && (
                    <div className="flex items-center">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      <Link 
                        href={booking.meetingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Join Meeting
                      </Link>
                    </div>
                  )}
                  <div className="mt-2 text-foreground">
                      Notes: {booking.attendeeNotes || "None"}
                  </div>
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                      booking.status === "confirmed" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : booking.status === "cancelled"
                        ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
                <BookingActions booking={{
                  id: booking.id,
                  startTime: booking.startTime,
                  endTime: booking.endTime,
                  status: booking.status,
                  attendeeName: booking.attendeeName,
                  attendeeEmail: booking.attendeeEmail,
                  attendeePhone: booking.attendeePhone,
                  attendeeNotes: booking.attendeeNotes,
                  meetingUrl: booking.meetingUrl,
                  eventType: {
                    duration: booking.eventType.duration
                  }
                }} />
              </CardContent>
            </Card>
          )
        })}
        {serializedBookings.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">No bookings yet.</div>
        )}
      </div>
    </div>
    )
  } catch (error) {
    console.error("Error loading bookings page:", error)
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <div className="text-center py-10 text-muted-foreground">
          An error occurred while loading bookings. Please try again later.
        </div>
      </div>
    )
  }
}

