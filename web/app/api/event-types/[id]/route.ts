import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateEventTypeSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  duration: z.number().min(1).optional(),
  description: z.string().optional(),
  locationType: z.string().optional(),
  hostIds: z.array(z.string()).min(1).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const { title, slug, duration, description, locationType, hostIds } = updateEventTypeSchema.parse(body)

    // Check if event type exists and user has permission
    const existingEventType = await prisma.eventType.findUnique({
      where: { id },
    })

    if (!existingEventType) {
      return NextResponse.json({ message: "Event type not found" }, { status: 404 })
    }

    // Permission check: Owner or Org Admin
    if (existingEventType.userId !== session.user.id) {
       // Check org admin
       const user = await prisma.user.findUnique({
         where: { id: session.user.id },
         select: { role: true, organizationId: true }
       })
       
       // Simplistic check for now, ideally check if event type owner is in same org
       if (user?.role !== "owner" && user?.role !== "admin") {
          return NextResponse.json({ message: "Forbidden" }, { status: 403 })
       }
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingEventType.slug) {
      const slugExists = await prisma.eventType.findUnique({
        where: {
          userId_slug: {
            userId: existingEventType.userId, // Slug is unique per user
            slug,
          },
        },
      })

      if (slugExists) {
        return NextResponse.json({ message: "Slug already exists" }, { status: 409 })
      }
    }

    // Update
    const updatedEventType = await prisma.eventType.update({
      where: { id },
      data: {
        title,
        slug,
        duration,
        description,
        locationType,
        // Update hosts if provided
        ...(hostIds ? {
          hosts: {
            deleteMany: {}, // Remove all existing hosts
            create: hostIds.map(userId => ({ userId })) // Add new hosts
          }
        } : {})
      },
    })

    return NextResponse.json(updatedEventType)
  } catch (error: any) {
    console.error("Error updating event type:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid request data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const existingEventType = await prisma.eventType.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            organizationId: true
          }
        }
      }
    })

    if (!existingEventType) {
      return NextResponse.json({ message: "Event type not found" }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        role: true,
        organizationId: true
      }
    })

    const isOwner = existingEventType.userId === session.user.id
    const isOrgAdmin = user?.role === "owner" || user?.role === "admin"
    const isSameOrg = user?.organizationId && existingEventType.user.organizationId === user.organizationId

    // Check permissions: owner of event type OR org admin of same organization
    if (!isOwner && !(isOrgAdmin && isSameOrg)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Delete all bookings associated with this event type first
    await prisma.booking.deleteMany({
      where: { eventTypeId: id }
    })

    // Delete the event type (EventTypeHost will be deleted automatically due to cascade)
    await prisma.eventType.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Event type deleted" })
  } catch (error: any) {
    console.error("Error deleting event type:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

