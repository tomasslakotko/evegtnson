import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateICalFile } from "@/lib/ical"

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    const locationText = booking.eventType.locationType === "mirotalk" 
      ? "MiroTalk Video" 
      : booking.eventType.locationType?.replace("_", " ") || "Online"

    const icalContent = generateICalFile({
      title: booking.eventType.title,
      description: booking.attendeeNotes || undefined,
      startTime: booking.startTime,
      endTime: booking.endTime,
      location: locationText,
      meetingUrl: booking.meetingUrl,
      attendeeName: booking.attendeeName,
      attendeeEmail: booking.attendeeEmail,
      hostName: booking.host.name || booking.host.email || "Host",
      hostEmail: booking.host.email || undefined,
    })

    return new NextResponse(icalContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="meeting-${booking.id}.ics"`,
      },
    })
  } catch (error) {
    console.error("Error generating iCal file:", error)
    return new NextResponse("Error generating calendar file", { status: 500 })
  }
}

