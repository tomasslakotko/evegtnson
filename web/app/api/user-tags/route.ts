import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const userTagSchema = z.object({
  userId: z.string(),
  tagId: z.string(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const { userId, tagId } = userTagSchema.parse(body)

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!currentUser?.organization) {
      return new NextResponse("User is not part of an organization", { status: 403 })
    }

    if (currentUser.role !== "owner" && currentUser.role !== "admin") {
      return new NextResponse("Insufficient permissions", { status: 403 })
    }

    // Verify user is in same organization
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser || targetUser.organizationId !== currentUser.organizationId) {
      return new NextResponse("User not found or not in same organization", { status: 404 })
    }

    // Verify tag belongs to organization
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    })

    if (!tag || tag.organizationId !== currentUser.organizationId) {
      return new NextResponse("Tag not found", { status: 404 })
    }

    // Check if already exists
    const existing = await prisma.userTag.findUnique({
      where: {
        userId_tagId: {
          userId,
          tagId,
        },
      },
    })

    if (existing) {
      return new NextResponse("Tag already assigned", { status: 400 })
    }

    const userTag = await prisma.userTag.create({
      data: {
        userId,
        tagId,
      },
      include: {
        tag: true,
      },
    })

    return NextResponse.json(userTag)
  } catch (error) {
    console.error("Add tag error:", error)
    return new NextResponse("Invalid request", { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const tagId = searchParams.get("tagId")

    if (!userId || !tagId) {
      return new NextResponse("Missing userId or tagId", { status: 400 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!currentUser?.organization) {
      return new NextResponse("User is not part of an organization", { status: 403 })
    }

    if (currentUser.role !== "owner" && currentUser.role !== "admin") {
      return new NextResponse("Insufficient permissions", { status: 403 })
    }

    await prisma.userTag.delete({
      where: {
        userId_tagId: {
          userId,
          tagId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove tag error:", error)
    return new NextResponse("Invalid request", { status: 400 })
  }
}

