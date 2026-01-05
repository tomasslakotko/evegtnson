import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const eventTypeId = searchParams.get("eventTypeId")
  const monthParam = searchParams.get("month") // Format: "2026-01"

  if (!eventTypeId || !monthParam) {
    return new NextResponse("Missing eventTypeId or month", { status: 400 })
  }

  try {
    const [year, month] = monthParam.split("-").map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0) // Last day of the month

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

    // Get all schedules for the user
    const schedules = await prisma.schedule.findMany({
      where: { userId: eventType.userId },
    })

    // Get all bookings for this event type in this month
    const bookings = await prisma.booking.findMany({
      where: {
        eventTypeId,
        status: "confirmed",
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })

    // Create a map of available days
    const availableDays: number[] = []

    // Check each day of the month
    for (let day = 1; day <= endDate.getDate(); day++) {
      const checkDate = new Date(year, month - 1, day)
      const dayOfWeek = checkDate.getDay()
      
      // Check if user has schedule for this day
      const daySchedule = schedules.find(s => s.day === dayOfWeek)
      if (!daySchedule) {
        continue // No schedule for this day
      }

      // Parse schedule times
      const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number)
      const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number)
      
      const scheduleStart = new Date(checkDate)
      scheduleStart.setHours(startHour, startMinute, 0, 0)
      
      const scheduleEnd = new Date(checkDate)
      scheduleEnd.setHours(endHour, endMinute, 0, 0)

      // Check if there's at least one available slot
      let hasAvailableSlot = false
      
      // Generate potential slots in 30-minute intervals
      let currentHour = startHour
      let currentMinute = startMinute
      
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const slotStart = new Date(checkDate)
        slotStart.setHours(currentHour, currentMinute, 0, 0)
        
        // Skip if slot is in the past
        if (slotStart < new Date()) {
          currentMinute += 30
          if (currentMinute >= 60) {
            currentMinute = 0
            currentHour += 1
          }
          continue
        }
        
        const slotEnd = new Date(slotStart.getTime() + eventType.duration * 60000)
        
        // Check if slot fits within schedule end time
        if (slotEnd > scheduleEnd) {
          break
        }
        
        // Check if slot conflicts with any booking
        const hasConflict = bookings.some(booking => {
          const bookingStart = new Date(booking.startTime)
          const bookingEnd = new Date(booking.endTime)
          
          // Check if dates match
          if (
            bookingStart.getDate() !== checkDate.getDate() ||
            bookingStart.getMonth() !== checkDate.getMonth() ||
            bookingStart.getFullYear() !== checkDate.getFullYear()
          ) {
            return false
          }
          
          // Check if slot overlaps with booking
          return (slotStart < bookingEnd && slotEnd > bookingStart)
        })
        
        if (!hasConflict) {
          hasAvailableSlot = true
          break
        }
        
        // Move to next slot
        currentMinute += 30
        if (currentMinute >= 60) {
          currentMinute = 0
          currentHour += 1
        }
      }
      
      if (hasAvailableSlot) {
        availableDays.push(day)
      }
    }

    return NextResponse.json({ availableDays })
  } catch (error) {
    console.error("Error fetching month availability:", error)
    return new NextResponse("Error fetching month availability", { status: 500 })
  }
}

