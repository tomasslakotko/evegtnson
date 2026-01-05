import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendBookingUpdateEmail, sendMeetingLinkEmail } from "@/lib/email"
import { updateGoogleCalendarEvent, deleteGoogleCalendarEvent, checkGoogleCalendarBusy } from "@/lib/google-calendar"
import { checkFeatureAccess } from "@/lib/subscription"

const updateBookingSchema = z.object({
  startTime: z.string().datetime().optional(),
  attendeeName: z.string().optional(),
  attendeeEmail: z.string().email().optional(),
  attendeePhone: z.string().optional(),
  attendeeNotes: z.string().optional(),
  meetingUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  status: z.enum(["confirmed", "cancelled", "rejected"]).optional(),
})

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { id } = await context.params
    const body = await req.json()
    const data = updateBookingSchema.parse(body)

    // Get booking to check ownership
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { 
        eventType: true,
        host: {
          select: {
            name: true,
            email: true
          }
        }
      },
    })

    if (!booking) {
      return new NextResponse("Booking not found", { status: 404 })
    }

    // Check if user is the host or admin/owner of the organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true }
    })

    const isHost = booking.hostId === session.user.id
    const isOrgAdmin = user?.role === "owner" || user?.role === "admin"
    
    // If not host, check if user is admin/owner and booking host is in same org
    if (!isHost && isOrgAdmin && user?.organizationId) {
      const hostUser = await prisma.user.findUnique({
        where: { id: booking.hostId },
        select: { organizationId: true }
      })
      if (hostUser?.organizationId !== user.organizationId) {
        return new NextResponse("Forbidden", { status: 403 })
      }
    } else if (!isHost) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // If rescheduling, check for conflicts
    if (data.startTime) {
      const newStart = new Date(data.startTime)
      const newEnd = new Date(newStart.getTime() + booking.eventType.duration * 60000)

      const conflict = await prisma.booking.findFirst({
        where: {
          hostId: booking.hostId, // Check conflicts only for the assigned host
          id: { not: id }, // Exclude current booking
          startTime: {
            lt: newEnd,
          },
          endTime: {
            gt: newStart,
          },
          status: "confirmed",
        },
      })

      if (conflict) {
        return new NextResponse("Time slot already booked", { status: 409 })
      }

      // Check Google Calendar if integration is enabled
      const hostUser = await prisma.user.findUnique({
        where: { id: booking.hostId },
        select: {
          subscriptionPlan: true,
          organizationId: true,
          organization: {
            select: {
              subscriptionPlan: true
            }
          }
        }
      })

      const planId = (hostUser?.organizationId && hostUser.organization?.subscriptionPlan) 
        ? hostUser.organization.subscriptionPlan 
        : (hostUser?.subscriptionPlan || "free")

      if (checkFeatureAccess(planId, "calendarIntegrations")) {
        try {
          const isBusy = await checkGoogleCalendarBusy(booking.hostId, newStart, newEnd)
          if (isBusy) {
            return new NextResponse("Selected time slot conflicts with Google Calendar events", { status: 409 })
          }
        } catch (error) {
          console.error("Error checking Google Calendar:", error)
        }
      }

      data.endTime = newEnd.toISOString()
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        ...(data.startTime && {
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime!),
        }),
        ...(data.attendeeName && { attendeeName: data.attendeeName }),
        ...(data.attendeeEmail && { attendeeEmail: data.attendeeEmail }),
        ...(data.attendeePhone !== undefined && { attendeePhone: data.attendeePhone || null }),
        ...(data.attendeeNotes !== undefined && { attendeeNotes: data.attendeeNotes }),
        ...(data.meetingUrl !== undefined && { meetingUrl: data.meetingUrl === "" ? null : data.meetingUrl }),
        ...(data.status && { status: data.status }),
      },
      include: {
        eventType: true,
        host: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Send email notifications
    const attendeeEmail = updatedBooking.attendeeEmail
    const isBlocked = attendeeEmail === "blocked@internal.com" || updatedBooking.eventType.title === "Blocked Time"
    
    if (!isBlocked && attendeeEmail) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : "http://localhost:3000"
      const icalUrl = `${baseUrl}/api/bookings/${id}/ical`
      
      // Determine update type
      if (data.status === "cancelled") {
        sendBookingUpdateEmail({
          attendeeName: updatedBooking.attendeeName,
          attendeeEmail,
          eventTitle: updatedBooking.eventType.title,
          startTime: updatedBooking.startTime,
          endTime: updatedBooking.endTime,
          hostName: updatedBooking.host.name || updatedBooking.host.email || "Host",
          meetingUrl: updatedBooking.meetingUrl,
          locationType: updatedBooking.eventType.locationType,
          notes: updatedBooking.attendeeNotes || undefined,
          icalUrl,
        }, "cancelled").catch(err => console.error("Failed to send cancellation email:", err))
      } else if (data.startTime) {
        // Rescheduled
        sendBookingUpdateEmail({
          attendeeName: updatedBooking.attendeeName,
          attendeeEmail,
          eventTitle: updatedBooking.eventType.title,
          startTime: updatedBooking.startTime,
          endTime: updatedBooking.endTime,
          hostName: updatedBooking.host.name || updatedBooking.host.email || "Host",
          meetingUrl: updatedBooking.meetingUrl,
          locationType: updatedBooking.eventType.locationType,
          notes: updatedBooking.attendeeNotes || undefined,
          icalUrl,
        }, "rescheduled").catch(err => console.error("Failed to send reschedule email:", err))
      } else if (data.meetingUrl !== undefined && updatedBooking.meetingUrl) {
        // Meeting link assigned
        sendMeetingLinkEmail({
          attendeeName: updatedBooking.attendeeName,
          attendeeEmail,
          eventTitle: updatedBooking.eventType.title,
          startTime: updatedBooking.startTime,
          endTime: updatedBooking.endTime,
          hostName: updatedBooking.host.name || updatedBooking.host.email || "Host",
          meetingUrl: updatedBooking.meetingUrl,
          locationType: updatedBooking.eventType.locationType,
          icalUrl,
        }).catch(err => console.error("Failed to send meeting link email:", err))
      } else if (data.attendeeName || data.attendeeEmail || data.attendeeNotes !== undefined) {
        // General update
        sendBookingUpdateEmail({
          attendeeName: updatedBooking.attendeeName,
          attendeeEmail,
          eventTitle: updatedBooking.eventType.title,
          startTime: updatedBooking.startTime,
          endTime: updatedBooking.endTime,
          hostName: updatedBooking.host.name || updatedBooking.host.email || "Host",
          meetingUrl: updatedBooking.meetingUrl,
          locationType: updatedBooking.eventType.locationType,
          notes: updatedBooking.attendeeNotes || undefined,
          icalUrl,
        }, "updated").catch(err => console.error("Failed to send update email:", err))
      }
    }

    return NextResponse.json(updatedBooking)
  } catch (error: any) {
    console.error("Error updating booking:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: "Invalid request data", 
        errors: error.issues 
      }, { status: 400 })
    }
    return NextResponse.json({ 
      message: error.message || "Invalid request" 
    }, { status: 400 })
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { id } = await context.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        eventType: true,
        host: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!booking) {
      return new NextResponse("Booking not found", { status: 404 })
    }

    // Check if user is the host
    if (booking.hostId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Delete from Google Calendar if event exists
    if (booking.googleCalendarEventId) {
      try {
        const hostUser = await prisma.user.findUnique({
          where: { id: booking.hostId },
          select: {
            subscriptionPlan: true,
            organizationId: true,
            organization: {
              select: {
                subscriptionPlan: true
              }
            }
          }
        })

        const planId = (hostUser?.organizationId && hostUser.organization?.subscriptionPlan) 
          ? hostUser.organization.subscriptionPlan 
          : (hostUser?.subscriptionPlan || "free")

        if (checkFeatureAccess(planId, "calendarIntegrations")) {
          await deleteGoogleCalendarEvent(booking.hostId, booking.googleCalendarEventId)
        }
      } catch (error) {
        console.error("Error deleting Google Calendar event:", error)
      }
    }

    // Send cancellation email before deleting
    const isBlocked = booking.attendeeEmail === "blocked@internal.com" || booking.eventType.title === "Blocked Time"
    if (!isBlocked && booking.attendeeEmail) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : "http://localhost:3000"
      const { sendBookingUpdateEmail } = await import("@/lib/email")
      sendBookingUpdateEmail({
        attendeeName: booking.attendeeName,
        attendeeEmail: booking.attendeeEmail,
        eventTitle: booking.eventType.title,
        startTime: booking.startTime,
        endTime: booking.endTime,
        hostName: booking.host.name || booking.host.email || "Host",
        meetingUrl: booking.meetingUrl,
        locationType: booking.eventType.locationType,
        notes: booking.attendeeNotes || undefined,
        icalUrl: `${baseUrl}/api/bookings/${id}/ical`,
      }, "cancelled").catch(err => console.error("Failed to send cancellation email:", err))
    }

    await prisma.booking.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting booking:", error)
    return new NextResponse("Invalid request", { status: 400 })
  }
}
