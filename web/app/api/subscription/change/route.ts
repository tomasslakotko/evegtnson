import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { PLANS, type PlanId } from "@/lib/subscription"

const changePlanSchema = z.object({
  planId: z.enum(["free", "pro", "team"]),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if user is system admin
    const { isSystemAdmin } = await import("@/lib/admin")
    const hasAdminAccess = await isSystemAdmin(session.user.id)
    
    if (!hasAdminAccess) {
      return NextResponse.json({ 
        message: "Only system administrators can change subscription plans. Please contact support." 
      }, { status: 403 })
    }

    const body = await req.json()
    const { planId } = changePlanSchema.parse(body)

    // Verify plan exists
    if (!(planId in PLANS)) {
      return NextResponse.json({ message: "Invalid plan" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        organizationId: true,
        role: true,
        organization: {
          select: {
            id: true
          }
        }
      }
    })

    // For organizations, only owner/admin can change plan
    if (user?.organizationId) {
      if (user.role !== "owner" && user.role !== "admin") {
        return NextResponse.json({ message: "Only organization owners and admins can change subscription plan" }, { status: 403 })
      }

      // Update organization plan
      await prisma.organization.update({
        where: { id: user.organizationId },
        data: { subscriptionPlan: planId },
      })
    } else {
      // Update user plan
      await prisma.user.update({
        where: { id: session.user.id },
        data: { subscriptionPlan: planId },
      })
    }

    return NextResponse.json({ success: true, planId })
  } catch (error: any) {
    console.error("Error changing subscription plan:", error)
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

