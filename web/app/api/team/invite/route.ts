import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["member", "admin"]),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const { email, name, role } = inviteSchema.parse(body)

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organization) {
      return new NextResponse("User is not part of an organization", { status: 403 })
    }

    // Check if user has permission (owner or admin)
    if (user.role !== "owner" && user.role !== "admin") {
      return new NextResponse("Insufficient permissions", { status: 403 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      if (existingUser.organizationId === user.organizationId) {
        return new NextResponse("User is already a member of this organization", { status: 400 })
      }
      // If user exists but in different org, we could transfer them, but for now just return error
      return new NextResponse("User already exists with a different organization", { status: 400 })
    }

    // Generate a random password (in production, send invitation email instead)
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Create user in the organization
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        username: email.split("@")[0],
        organizationId: user.organizationId,
        role,
      },
    })

    // In production, send invitation email with temp password or magic link
    // For now, we'll just return success

    return NextResponse.json({
      message: "User invited successfully",
      user: { id: newUser.id, email: newUser.email },
      // In production, don't return the password
      tempPassword: tempPassword, // Remove this in production
    })
  } catch (error) {
    console.error("Invite error:", error)
    return new NextResponse("Invalid request", { status: 400 })
  }
}

