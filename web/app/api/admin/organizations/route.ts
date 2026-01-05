import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireSystemAdmin } from "@/lib/admin"
import { z } from "zod"

const createOrganizationSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  subscriptionPlan: z.enum(["free", "pro", "team"]).optional(),
})

const updateOrganizationSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  subscriptionPlan: z.enum(["free", "pro", "team"]).optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    await requireSystemAdmin(session.user.id)
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search") || ""

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ]
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          subscriptionPlan: true,
          _count: {
            select: {
              members: true,
            }
          },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.organization.count({ where }),
    ])

    return NextResponse.json({
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    await requireSystemAdmin(session.user.id)
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createOrganizationSchema.parse(body)

    // Check if slug already exists
    const existing = await prisma.organization.findUnique({
      where: { slug: data.slug }
    })

    if (existing) {
      return NextResponse.json({ message: "Organization with this slug already exists" }, { status: 409 })
    }

    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        subscriptionPlan: data.subscriptionPlan || "free",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        subscriptionPlan: true,
        createdAt: true,
      }
    })

    return NextResponse.json(organization, { status: 201 })
  } catch (error: any) {
    console.error("Error creating organization:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: "Invalid request data", 
        errors: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ 
      message: error.message || "Internal server error" 
    }, { status: 500 })
  }
}

