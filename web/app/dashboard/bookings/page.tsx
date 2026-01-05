import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarIcon, Clock, Video, Phone, Link as LinkIcon } from "lucide-react"
import Link from "next/link"
import { BookingActions } from "@/components/dashboard/booking-actions"

export default async function BookingsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const bookings = await prisma.booking.findMany({
    where: { hostId: session.user.id },
    orderBy: { startTime: 'desc' },
    include: { 
      eventType: true,
      host: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
      <div className="space-y-4">
        {bookings.map((booking) => {
          if (!booking.eventType) {
            return null
          }
          return (
          <Card key={booking.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                {booking.eventType?.title || "Untitled Event"} with {booking.attendeeName || "Guest"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(new Date(booking.startTime), "EEEE, MMMM d, yyyy")}
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
                </div>
                <div className="flex items-center">
                  <Video className="mr-2 h-4 w-4" />
                  {booking.eventType?.locationType || "Online"}
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
              <BookingActions booking={booking} />
            </CardContent>
          </Card>
          )
        })}
        {bookings.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">No bookings yet.</div>
        )}
      </div>
    </div>
  )
}

