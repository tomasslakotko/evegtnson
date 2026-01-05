import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const eventTypeId = searchParams.get("eventTypeId")
  const dateParam = searchParams.get("date")

  if (!eventTypeId || !dateParam) {
    return new NextResponse("Missing eventTypeId or date", { status: 400 })
  }

  try {
    const selectedDate = new Date(dateParam)
    const dayOfWeek = selectedDate.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    const startOfDay = new Date(selectedDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 59, 59, 999)
  
    // Get event type with user info
  const eventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
      include: {
        user: true,
      },
  })

  if (!eventType) {
      return new NextResponse("Event type not found", { status: 404 })
  }

    // Get user's schedule for this day of week
    const schedule = await prisma.schedule.findFirst({
      where: {
        userId: eventType.userId,
        day: dayOfWeek,
      },
    })

    // Get all confirmed bookings for this event type on the selected date
  const bookings = await prisma.booking.findMany({
      where: {
        eventTypeId,
        status: "confirmed",
          startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })
      
    // Return busy slots and schedule
    const busySlots = bookings.map(booking => ({
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
    }))

    return NextResponse.json({
      busySlots,
      schedule: schedule ? {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      } : null,
    })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return new NextResponse("Error fetching availability", { status: 500 })
  }
}
