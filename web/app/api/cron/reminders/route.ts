import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendBookingEmail } from "@/lib/email"
import { addDays, startOfDay, endOfDay, subHours } from "date-fns"

export async function GET(req: Request) {
  // Check authorization header for Vercel Cron
  // Vercel automatically adds this header when running cron jobs
  // For local testing, you can bypass this or manually add the header
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Logic: Find bookings that start tomorrow (between 24h from now start of day and end of day)
    // Actually, simpler logic for a daily job: Find all bookings for "Tomorrow"
    
    const now = new Date()
    const tomorrow = addDays(now, 1)
    const startOfTomorrow = startOfDay(tomorrow)
    const endOfTomorrow = endOfDay(tomorrow)

    // Find confirmed bookings for tomorrow that haven't had a reminder sent
    const bookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: startOfTomorrow,
          lte: endOfTomorrow,
        },
        status: "confirmed",
        reminderSent: false,
      },
      include: {
        eventType: true,
        host: {
            select: {
                name: true,
                email: true,
            }
        }
      },
    })

    console.log(`[Cron] Found ${bookings.length} bookings to remind for ${startOfTomorrow.toISOString()}`)

    const results = await Promise.all(
      bookings.map(async (booking) => {
        try {
          // Send email
          await sendBookingEmail({
            type: "reminder",
            booking: {
              ...booking,
              startTime: booking.startTime,
              endTime: booking.endTime,
            },
            eventType: booking.eventType,
            host: booking.host,
          })

          // Mark as sent
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminderSent: true },
          })

          return { id: booking.id, status: "sent" }
        } catch (error) {
          console.error(`[Cron] Failed to send reminder for booking ${booking.id}:`, error)
          return { id: booking.id, status: "failed", error }
        }
      })
    )

    return NextResponse.json({ 
      success: true, 
      processed: results.length, 
      details: results 
    })
  } catch (error) {
    console.error("[Cron] Error processing reminders:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

