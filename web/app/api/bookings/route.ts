import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"
import { sendBookingConfirmationEmail } from "@/lib/email"
import { getPlanById, checkLimit, checkFeatureAccess } from "@/lib/subscription"
import { checkGoogleCalendarBusy, createGoogleCalendarEvent } from "@/lib/google-calendar"

const publicBookingSchema = z.object({
  eventTypeId: z.string(),
  startTime: z.string().datetime(),
  attendeeName: z.string().min(1),
  attendeeEmail: z.string().email(),
  attendeePhone: z.string().optional(),
  attendeeNotes: z.string().optional(),
})

const manualBookingSchema = z.object({
  title: z.string().min(1),
  hostId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  attendeeName: z.string().min(1),
  attendeeEmail: z.string().email(),
  attendeePhone: z.string().optional(),
  attendeeNotes: z.string().optional(),
  status: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  
  try {
    const body = await req.json()
    
    // Check if this is a public booking (has eventTypeId) or manual booking
    if (body.eventTypeId) {
      // Public booking from booking form
      const { eventTypeId, startTime, attendeeName, attendeeEmail, attendeePhone, attendeeNotes } = publicBookingSchema.parse(body)
      
      const eventType = await prisma.eventType.findUnique({
        where: { id: eventTypeId },
      })

      if (!eventType) {
        return new NextResponse("Event type not found", { status: 404 })
      }

      // Get hosts for this event type using the relation
      const hostsRelation = await (prisma as any).eventTypeHost.findMany({
        where: { eventTypeId: eventType.id },
        include: {
          user: {
            select: {
              id: true
            }
          }
        }
      })

      const start = new Date(startTime)
      const end = new Date(start.getTime() + eventType.duration * 60000)

      // Get available hosts
      let availableHostIds: string[] = hostsRelation.map((h: any) => h.user.id)
      if (availableHostIds.length === 0) {
        availableHostIds.push(eventType.userId)
      }

      // Find hosts who are available
      const conflicts = await prisma.booking.findMany({
        where: {
          hostId: { in: availableHostIds },
          status: { not: "cancelled" },
          startTime: { lt: end },
          endTime: { gt: start }
        },
        select: { hostId: true }
      })

      const busyHostIds = new Set(conflicts.map((c: any) => c.hostId))
      const freeHostIds = availableHostIds.filter((id: string) => !busyHostIds.has(id))

      if (freeHostIds.length === 0) {
        return new NextResponse("No available hosts for this time slot", { status: 409 })
      }

      // Randomly select from available hosts
      const randomIndex = Math.floor(Math.random() * freeHostIds.length)
      const selectedHostId = freeHostIds[randomIndex]

      // Get user plan for checks
      const hostUser = await prisma.user.findUnique({
        where: { id: selectedHostId },
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

      // Check Google Calendar busy slots if user has calendar integration
      if (checkFeatureAccess(planId, "calendarIntegrations")) {
        try {
          const isBusy = await checkGoogleCalendarBusy(selectedHostId, start, end)
          if (isBusy) {
            return new NextResponse("Selected time slot conflicts with Google Calendar events", { status: 409 })
          }
        } catch (error) {
          // If calendar check fails, log but don't block booking
          console.error("Error checking Google Calendar:", error)
        }
      }

      // Count bookings for current month (excluding cancelled)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      const monthlyBookingsCount = await prisma.booking.count({
        where: {
          hostId: selectedHostId,
          status: { not: "cancelled" },
          attendeeEmail: { not: "blocked@internal.com" }, // Exclude blocked time
          startTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      })

      // Check if user can create more bookings this month
      if (!checkLimit(planId, "bookingsPerMonth", monthlyBookingsCount)) {
        const plan = getPlanById(planId)
        const limit = plan.limits.bookingsPerMonth
        return new NextResponse(
          `You've reached the monthly limit of ${limit} booking${limit === 1 ? '' : 's'} for your current plan (${plan.name}). Please upgrade to create more bookings.`,
          { status: 403 }
        )
      }

      // Generate meeting URL based on location type
      let meetingUrl = null;
      if (eventType.locationType === 'mirotalk') {
        const roomId = crypto.randomBytes(8).toString('hex');
        const baseUrl = process.env.MIROTALK_URL || "https://p2p.mirotalk.com";
        meetingUrl = `${baseUrl}/join/${roomId}`;
      }

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          eventTypeId: eventType.id,
          hostId: selectedHostId,
          startTime: start,
          endTime: end,
          attendeeName,
          attendeeEmail,
          attendeePhone: attendeePhone || null,
          attendeeNotes,
          status: "confirmed",
          meetingUrl: meetingUrl,
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

      // Create event in Google Calendar if integration is enabled
      if (checkFeatureAccess(planId, "calendarIntegrations")) {
        try {
          const googleEventId = await createGoogleCalendarEvent(selectedHostId, {
            title: eventType.title,
            description: attendeeNotes || eventType.description || undefined,
            startTime: start,
            endTime: end,
            location: meetingUrl || eventType.locationType,
            attendeeEmail: attendeeEmail,
            attendeeName: attendeeName,
          })

          if (googleEventId) {
            // Update booking with Google Calendar event ID
            await prisma.booking.update({
              where: { id: booking.id },
              data: { googleCalendarEventId: googleEventId },
            })
          }
        } catch (error) {
          // Log error but don't fail the booking
          console.error("Error creating Google Calendar event:", error)
        }
      }

      // Send confirmation email
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : "http://localhost:3000"
      sendBookingConfirmationEmail({
        attendeeName,
        attendeeEmail,
        eventTitle: booking.eventType.title,
        startTime: booking.startTime,
        endTime: booking.endTime,
        hostName: booking.host.name || booking.host.email || "Host",
        meetingUrl: booking.meetingUrl,
        locationType: booking.eventType.locationType,
        notes: booking.attendeeNotes || undefined,
        icalUrl: `${baseUrl}/api/bookings/${booking.id}/ical`,
        bookingId: booking.id,
      }).catch(err => console.error("Failed to send confirmation email:", err))

      return NextResponse.json(booking)
    } else {
      // Manual booking from dashboard - requires auth
      if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
      }

      const { title, hostId, startTime, endTime, attendeeName, attendeeEmail, attendeePhone, attendeeNotes, status } = manualBookingSchema.parse(body)

      const start = new Date(startTime)
      const end = new Date(endTime)

      // Check if host is available
      const conflict = await prisma.booking.findFirst({
        where: {
          hostId: hostId,
          status: { not: "cancelled" },
          startTime: { lt: end },
          endTime: { gt: start }
        }
      })

      if (conflict) {
        return new NextResponse("Selected host is already booked for this time slot", { status: 409 })
      }

      // Get user plan for checks
      const hostUser = await prisma.user.findUnique({
            where: { id: hostId },
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

          // Count bookings for current month (excluding cancelled and blocked time)
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

          const monthlyBookingsCount = await prisma.booking.count({
            where: {
              hostId: hostId,
              status: { not: "cancelled" },
              attendeeEmail: { not: "blocked@internal.com" }, // Exclude blocked time
              startTime: {
                gte: startOfMonth,
                lte: endOfMonth
              }
            }
          })

          // Check if user can create more bookings this month
          if (!checkLimit(planId, "bookingsPerMonth", monthlyBookingsCount)) {
            const plan = getPlanById(planId)
            const limit = plan.limits.bookingsPerMonth
            return new NextResponse(
              `You've reached the monthly limit of ${limit} booking${limit === 1 ? '' : 's'} for your current plan (${plan.name}). Please upgrade to create more bookings.`,
              { status: 403 }
            )
          }
        }

          // Get or create a default event type for this host
          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50) || 'manual-booking'
          
          let eventType = await prisma.eventType.findFirst({
            where: {
              userId: hostId,
              slug: slug
            }
          })

          if (!eventType) {
            const duration = Math.round((end.getTime() - start.getTime()) / 60000)
            
            eventType = await prisma.eventType.create({
              data: {
                title: title,
                slug: `${slug}-${Date.now()}`,
                duration: duration > 0 ? duration : 60,
                locationType: "google_meet",
                userId: hostId,
              }
            })
          }

      // Generate meeting URL based on location type
      let meetingUrl = null;
      if (eventType.locationType === 'mirotalk') {
        const roomId = crypto.randomBytes(8).toString('hex');
        const baseUrl = process.env.MIROTALK_URL || "https://p2p.mirotalk.com";
        meetingUrl = `${baseUrl}/join/${roomId}`;
      }

          // Create booking
          const booking = await prisma.booking.create({
            data: {
              eventTypeId: eventType.id,
              hostId: hostId,
              startTime: start,
              endTime: end,
              attendeeName,
              attendeeEmail,
              attendeePhone: attendeePhone || null,
              attendeeNotes,
              status: status || "confirmed",
              meetingUrl: meetingUrl,
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

          // Create event in Google Calendar if integration is enabled (skip for blocked time)
          if (status !== "blocked" && attendeeEmail !== "blocked@internal.com" && checkFeatureAccess(planId, "calendarIntegrations")) {
            try {
              const googleEventId = await createGoogleCalendarEvent(hostId, {
                title: title,
                description: attendeeNotes || undefined,
                startTime: start,
                endTime: end,
                location: meetingUrl || eventType.locationType,
                attendeeEmail: attendeeEmail,
                attendeeName: attendeeName,
              })

              if (googleEventId) {
                // Update booking with Google Calendar event ID
                await prisma.booking.update({
                  where: { id: booking.id },
                  data: { googleCalendarEventId: googleEventId },
                })
              }
            } catch (error) {
              // Log error but don't fail the booking
              console.error("Error creating Google Calendar event:", error)
            }
          }

          // Send confirmation email (skip for blocked time)
      if (status !== "blocked" && attendeeEmail !== "blocked@internal.com") {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : "http://localhost:3000"
        sendBookingConfirmationEmail({
          attendeeName,
          attendeeEmail,
          eventTitle: booking.eventType.title,
          startTime: booking.startTime,
          endTime: booking.endTime,
          hostName: booking.host.name || booking.host.email || "Host",
          meetingUrl: booking.meetingUrl,
          locationType: booking.eventType.locationType,
          notes: booking.attendeeNotes || undefined,
          icalUrl: `${baseUrl}/api/bookings/${booking.id}/ical`,
          bookingId: booking.id,
        }).catch(err => console.error("Failed to send confirmation email:", err))
      }

      return NextResponse.json(booking)
    }
  } catch (error: any) {
    console.error("Error creating booking:", error)
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
