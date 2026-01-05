import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { SubscriptionPageClient } from "@/components/dashboard/subscription-page-client"

export default async function SubscriptionPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionPlan: true,
      organizationId: true,
      organization: {
        select: {
          subscriptionPlan: true,
          name: true
        }
      }
    }
  })

  // For organizations, use org plan; for individuals, use user plan
  const currentPlanId = (user?.organizationId && user.organization?.subscriptionPlan) 
    ? user.organization.subscriptionPlan 
    : (user?.subscriptionPlan || "free")
  
  const isOrgAccount = !!user?.organizationId

  return (
    <SubscriptionPageClient 
      currentPlanId={currentPlanId}
      isOrgAccount={isOrgAccount}
      orgName={user?.organization?.name}
    />
  )
}
