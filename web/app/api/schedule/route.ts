import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId") || session.user.id

  // Check if user can access this schedule
  if (userId !== session.user.id) {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true },
    })

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    })

    // Only owner/admin can view other users' schedules in the same organization
    if (
      currentUser?.role !== "owner" &&
      currentUser?.role !== "admin" ||
      currentUser?.organizationId !== targetUser?.organizationId
    ) {
      return new NextResponse("Forbidden", { status: 403 })
    }
  }

  try {
    const schedules = await prisma.schedule.findMany({
      where: { userId },
      orderBy: { day: "asc" },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching schedule:", error)
    return new NextResponse("Error fetching schedule", { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const { userId, schedules } = body

    const targetUserId = userId || session.user.id

    // Check if user can modify this schedule
    if (targetUserId !== session.user.id) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, organizationId: true },
      })

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { organizationId: true },
      })

      // Only owner/admin can modify other users' schedules in the same organization
      if (
        currentUser?.role !== "owner" &&
        currentUser?.role !== "admin" ||
        currentUser?.organizationId !== targetUser?.organizationId
      ) {
        return new NextResponse("Forbidden", { status: 403 })
      }
    }

    // Delete existing schedules for this user
    await prisma.schedule.deleteMany({
      where: { userId: targetUserId },
    })

    // Create new schedules
    if (Array.isArray(schedules) && schedules.length > 0) {
      await prisma.schedule.createMany({
        data: schedules.map((schedule: { day: number; startTime: string; endTime: string }) => ({
          userId: targetUserId,
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        })),
      })
    }

    // Fetch and return updated schedules
    const updatedSchedules = await prisma.schedule.findMany({
      where: { userId: targetUserId },
      orderBy: { day: "asc" },
    })

    return NextResponse.json(updatedSchedules)
  } catch (error) {
    console.error("Error saving schedule:", error)
    return new NextResponse("Error saving schedule", { status: 500 })
  }
}

