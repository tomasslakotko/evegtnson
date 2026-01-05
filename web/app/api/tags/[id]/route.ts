import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { id } = await params

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

    // Verify tag belongs to organization
    const tag = await prisma.tag.findUnique({
      where: { id },
    })

    if (!tag || tag.organizationId !== user.organizationId) {
      return new NextResponse("Tag not found", { status: 404 })
    }

    // Delete all user-tag relationships first (cascade will handle this, but explicit is better)
    await prisma.userTag.deleteMany({
      where: { tagId: id },
    })

    // Delete the tag
    await prisma.tag.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete tag error:", error)
    return new NextResponse("Invalid request", { status: 400 })
  }
}

