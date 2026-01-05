import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const startParam = searchParams.get("start")
  const endParam = searchParams.get("end")

  if (!startParam || !endParam) {
    return new NextResponse("Missing start or end date", { status: 400 })
  }

  try {
    const start = new Date(startParam)
    const end = new Date(endParam)

    // Get current user to check role and organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true }
    })

    let whereClause: any = {
      startTime: {
        gte: start,
        lte: end,
      },
      status: "confirmed" // Show only confirmed bookings in calendar
    }

    // If admin/owner AND has organization -> fetch all org bookings
    if (user?.organizationId && (user.role === "owner" || user.role === "admin")) {
      whereClause.host = {
        organizationId: user.organizationId
      }
    } else {
      // Otherwise -> fetch only own bookings
      whereClause.hostId = session.user.id
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        eventType: {
          select: {
            title: true,
            locationType: true,
            duration: true,
          },
        },
        host: {
          select: {
            name: true,
            image: true,
            email: true,
            id: true,
          }
        }
      },
      orderBy: {
        startTime: "asc",
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Error fetching calendar bookings:", error)
    return new NextResponse("Error fetching calendar bookings", { status: 500 })
  }
}
