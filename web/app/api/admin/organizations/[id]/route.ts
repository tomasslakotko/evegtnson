import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireSystemAdmin } from "@/lib/admin"
import { z } from "zod"

const updateOrganizationSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  subscriptionPlan: z.enum(["free", "pro", "team"]).optional(),
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
    const data = updateOrganizationSchema.parse(body)

    // Check if slug is taken (if provided)
    if (data.slug) {
      const existing = await prisma.organization.findFirst({
        where: {
          slug: data.slug,
          id: { not: id }
        }
      })

      if (existing) {
        return NextResponse.json({ message: "Slug already taken" }, { status: 409 })
      }
    }

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.subscriptionPlan !== undefined && { subscriptionPlan: data.subscriptionPlan }),
      },
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
      }
    })

    return NextResponse.json(updatedOrg)
  } catch (error: any) {
    console.error("Error updating organization:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: "Invalid request data", 
        errors: error.issues 
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

    await prisma.organization.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting organization:", error)
    return NextResponse.json({ 
      message: error.message || "Internal server error" 
    }, { status: 500 })
  }
}

