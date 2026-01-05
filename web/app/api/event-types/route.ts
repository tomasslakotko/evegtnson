import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getPlanById, checkLimit } from "@/lib/subscription"

const createEventTypeSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  duration: z.number().min(1),
  description: z.string().optional(),
  locationType: z.string(), // changed from enum to string to match schema default
  hostIds: z.array(z.string()).min(1), // Array of user IDs who can host
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, organizationId: true }
  })

  let whereClause: any = { userId: session.user.id }

  // If owner/admin, fetch all event types for the organization to allow assigning/booking for others
  if ((user?.role === "owner" || user?.role === "admin") && user.organizationId) {
    const orgMembers = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true }
    })
    const memberIds = orgMembers.map(m => m.id)
    whereClause = { userId: { in: memberIds } }
  }

  const eventTypes = await prisma.eventType.findMany({
    where: whereClause,
    include: {
      hosts: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      }
    }
  })

  // Transform result to include flat host objects
  // Filter out "Blocked Time" event types - these are internal and shouldn't be shown
  const transformedEventTypes = eventTypes
    .filter(et => et.title !== "Blocked Time")
    .map(et => ({
      id: et.id,
      title: et.title,
      duration: et.duration,
      locationType: et.locationType,
      userId: et.userId,
      hosts: et.hosts.map(h => h.user)
    }))

  return NextResponse.json(transformedEventTypes)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { title, slug, duration, description, locationType, hostIds } = createEventTypeSchema.parse(body)

    // Check if slug already exists for this user
    const existing = await prisma.eventType.findUnique({
      where: {
        userId_slug: {
          userId: session.user.id,
          slug,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ message: "Slug already exists" }, { status: 409 })
    }

    // Get user with subscription info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        organizationId: true, 
        role: true,
        subscriptionPlan: true,
        organization: {
          select: {
            subscriptionPlan: true
          }
        }
      }
    })

    // Check subscription plan limits
    const planId: "free" | "pro" | "team" = (user?.organizationId && user.organization?.subscriptionPlan) 
      ? (user.organization.subscriptionPlan as "free" | "pro" | "team")
      : ((user?.subscriptionPlan as "free" | "pro" | "team") || "free")
    
    // Count existing event types (excluding blocked time)
    const existingEventTypesCount = await prisma.eventType.count({
      where: {
        userId: session.user.id,
        title: { not: "Blocked Time" }
      }
    })

    // Check if user can create more event types
    if (!checkLimit(planId, "eventTypes", existingEventTypesCount)) {
      const plan = getPlanById(planId)
      const limit = plan.limits.eventTypes
      return NextResponse.json({ 
        message: `You've reached the limit of ${limit} event type${limit === 1 ? '' : 's'} for your current plan. Please upgrade to create more.`,
        upgradeRequired: true
      }, { status: 403 })
    }

    if (user?.organizationId) {
      const orgMembers = await prisma.user.findMany({
        where: { 
          organizationId: user.organizationId,
          id: { in: hostIds }
        },
        select: { id: true }
      })

      if (orgMembers.length !== hostIds.length) {
        return NextResponse.json({ message: "Some selected hosts are not in your organization" }, { status: 400 })
      }
    } else {
      // If no organization, only allow self
      if (hostIds.length !== 1 || hostIds[0] !== session.user.id) {
        return NextResponse.json({ message: "You can only assign yourself as host without an organization" }, { status: 400 })
      }
    }

    // Create event type with hosts
    const eventType = await prisma.eventType.create({
      data: {
        title,
        slug,
        duration,
        description: description || null,
        locationType,
        userId: session.user.id,
        hosts: {
          create: hostIds.map(hostId => ({
            userId: hostId,
          })),
        },
      },
    })

    return NextResponse.json(eventType)
  } catch (error: any) {
    console.error("Error creating event type:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: "Invalid request data", 
        errors: error.issues 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      message: error.message || "Internal server error",
      details: error.toString() 
    }, { status: 500 })
  }
}
