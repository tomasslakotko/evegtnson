import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, color } = createTagSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organization) {
      return new NextResponse("User is not part of an organization", { status: 403 })
    }

    if (user.role !== "owner" && user.role !== "admin") {
      return new NextResponse("Insufficient permissions", { status: 403 })
    }

    // Check if tag already exists
    const existingTag = await prisma.tag.findUnique({
      where: {
        organizationId_name: {
          organizationId: user.organizationId!,
          name,
        },
      },
    })

    if (existingTag) {
      return new NextResponse("Tag already exists", { status: 400 })
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || "#3b82f6", // default blue
        organizationId: user.organizationId!,
      },
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error("Create tag error:", error)
    return new NextResponse("Invalid request", { status: 400 })
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organization) {
      return new NextResponse("User is not part of an organization", { status: 403 })
    }

    const tags = await prisma.tag.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Get tags error:", error)
    return new NextResponse("Invalid request", { status: 400 })
  }
}

