import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireSystemAdmin } from "@/lib/admin"
import { z } from "zod"

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/i).optional(),
  password: z.string().min(6).optional(),
  organizationId: z.string().optional(),
  role: z.enum(["member", "admin", "owner"]).optional(),
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
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          subscriptionPlan: true,
          organizationId: true,
          organization: {
            select: {
              name: true,
              slug: true,
            }
          },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
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
    const data = createUserSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Generate username if not provided
    const username = data.username || data.email.split("@")[0]

    // Check if username is taken
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUsername) {
      return NextResponse.json({ message: "Username already taken" }, { status: 409 })
    }

    // Hash password if provided
    let hashedPassword = null
    if (data.password) {
      const bcrypt = await import("bcryptjs")
      hashedPassword = await bcrypt.default.hash(data.password, 10)
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        username,
        password: hashedPassword,
        organizationId: data.organizationId || null,
        role: data.role || "member",
        subscriptionPlan: data.subscriptionPlan || "free",
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        subscriptionPlan: true,
        createdAt: true,
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)
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

