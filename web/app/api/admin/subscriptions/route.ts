import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireSystemAdmin } from "@/lib/admin"
import { z } from "zod"
import { PLANS, type PlanId } from "@/lib/subscription"

const updateSubscriptionSchema = z.object({
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  planId: z.enum(["free", "pro", "team"]),
})

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
    const { userId, organizationId, planId } = updateSubscriptionSchema.parse(body)

    if (!userId && !organizationId) {
      return NextResponse.json({ message: "Either userId or organizationId is required" }, { status: 400 })
    }

    if (userId && organizationId) {
      return NextResponse.json({ message: "Provide either userId or organizationId, not both" }, { status: 400 })
    }

    // Verify plan exists
    if (!(planId in PLANS)) {
      return NextResponse.json({ message: "Invalid plan" }, { status: 400 })
    }

    if (organizationId) {
      // Update organization plan
      await prisma.organization.update({
        where: { id: organizationId },
        data: { subscriptionPlan: planId },
      })
    } else if (userId) {
      // Update user plan
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionPlan: planId },
      })
    }

    return NextResponse.json({ success: true, planId })
  } catch (error: any) {
    console.error("Error updating subscription:", error)
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

