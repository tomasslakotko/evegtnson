import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const identifier = searchParams.get("identifier") // username or org slug
  const slug = searchParams.get("slug")

  if (!identifier || !slug) {
    return NextResponse.json({ error: "Missing identifier or slug" }, { status: 400 })
  }

  try {
    // Try to find user by username first
    let user = await prisma.user.findUnique({
      where: { username: identifier },
      include: {
        organization: true
      }
    })

    // If not found, try to find organization by slug
    if (!user) {
      const organization = await prisma.organization.findUnique({
        where: { slug: identifier },
        include: {
          members: {
            where: {
              role: { in: ["owner", "admin"] }
            },
            take: 1
          }
        }
      })

      if (organization && organization.members.length > 0) {
        user = await prisma.user.findUnique({
          where: { id: organization.members[0].id },
          include: {
            organization: true
          }
        })
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User or organization not found" }, { status: 404 })
    }

    // Find event type - check all users in the organization if it's an org event
    let eventType = await prisma.eventType.findUnique({
      where: {
        userId_slug: {
          userId: user.id,
          slug,
        }
      },
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

    // If not found and user has organization, search in all org members
    if (!eventType && user.organizationId) {
      const orgMembers = await prisma.user.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true }
      })

      for (const member of orgMembers) {
        eventType = await prisma.eventType.findUnique({
          where: {
            userId_slug: {
              userId: member.id,
              slug,
            }
          },
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
        if (eventType) break
      }
    }

    if (!eventType) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 })
    }

    // Filter out blocked time
    if (eventType.title === "Blocked Time") {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 })
    }

    // Transform to include flat host objects
    const transformedEventType = {
      id: eventType.id,
      title: eventType.title,
      slug: eventType.slug,
      duration: eventType.duration,
      description: eventType.description,
      locationType: eventType.locationType,
      hosts: eventType.hosts.map((h: any) => h.user)
    }

    return NextResponse.json(transformedEventType)
  } catch (error) {
    console.error("Error fetching event type for widget:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

