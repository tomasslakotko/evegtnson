import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ProfileSettings } from "@/components/dashboard/profile-settings"
import { CalendarIntegrations } from "@/components/dashboard/calendar-integrations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPlanById } from "@/lib/subscription"
import { CreditCard, Building2, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function SettingsPage() {
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
          name: true,
          slug: true
        }
      }
    }
  })

  // For organizations, use org plan; for individuals, use user plan
  const currentPlanId = (user?.organizationId && user.organization?.subscriptionPlan) 
    ? user.organization.subscriptionPlan 
    : (user?.subscriptionPlan || "free")
  
  const currentPlan = getPlanById(currentPlanId)
  const isOrgAccount = !!user?.organizationId

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                {isOrgAccount 
                  ? `Current plan for ${user.organization?.name || "your organization"}`
                  : "Your current subscription plan"}
              </CardDescription>
            </div>
            <Badge variant={currentPlanId === "free" ? "secondary" : "default"} className="text-sm">
              {currentPlan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">€{currentPlan.price}<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground mt-1">
                {isOrgAccount ? (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Organization Plan
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Individual Plan
                  </span>
                )}
              </p>
            </div>
            <Link href="/dashboard/subscription">
              <Button variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <ProfileSettings />

      {/* Calendar Integrations */}
      <CalendarIntegrations />
    </div>
  )
}
