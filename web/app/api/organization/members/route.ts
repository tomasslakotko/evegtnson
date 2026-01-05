import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true }
  })

  if (!user?.organizationId) {
    // If no organization, return just the user themselves
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, image: true, email: true }
    })
    return NextResponse.json([currentUser])
  }

  // Fetch all members of the organization
  const members = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    select: {
      id: true,
      name: true,
      image: true,
      email: true
    }
  })

  return NextResponse.json(members)
}

