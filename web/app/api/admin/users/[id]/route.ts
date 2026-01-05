import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireSystemAdmin } from "@/lib/admin"
import { z } from "zod"
import { PLANS, type PlanId } from "@/lib/subscription"

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/i).optional(),
  role: z.enum(["member", "admin", "owner", "system_admin"]).optional(),
  subscriptionPlan: z.enum(["free", "pro", "team"]).optional(),
  organizationId: z.string().nullable().optional(),
})

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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
    const { id } = await context.params
    const body = await req.json()
    const data = updateUserSchema.parse(body)

    // Check if username is taken (if provided)
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          id: { not: id }
        }
      })

      if (existingUser) {
        return NextResponse.json({ message: "Username already taken" }, { status: 409 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.subscriptionPlan !== undefined && { subscriptionPlan: data.subscriptionPlan }),
        ...(data.organizationId !== undefined && { organizationId: data.organizationId }),
      },
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
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error("Error updating user:", error)
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

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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
    const { id } = await context.params

    // Prevent deleting yourself
    if (id === session.user.id) {
      return NextResponse.json({ message: "Cannot delete your own account" }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ 
      message: error.message || "Internal server error" 
    }, { status: 500 })
  }
}

