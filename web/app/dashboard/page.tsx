import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle } from "lucide-react"
import Link from "next/link"
import { EventTypeCard } from "@/components/dashboard/event-type-card"
import { getPlanById, checkLimit } from "@/lib/subscription"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      role: true, 
      organizationId: true,
      username: true,
      subscriptionPlan: true,
      organization: {
        select: {
          slug: true,
          subscriptionPlan: true
        }
      }
    }
  })

  let whereClause: any = { userId: session.user.id }

  // If owner/admin, fetch all event types for the organization
  if ((user?.role === "owner" || user?.role === "admin") && user.organizationId) {
    const orgMembers = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true }
    })
    const memberIds = orgMembers.map(m => m.id)
    whereClause = { userId: { in: memberIds } }
  }

  const eventTypes = await prisma.eventType.findMany({
    where: whereClause,
  })
  
  // Filter out "Blocked Time" event types - these are internal and shouldn't be shown
  const filteredEventTypes = eventTypes.filter(et => et.title !== "Blocked Time")
  
  // Determine identifier: use organization slug if user belongs to one, otherwise username
  const identifier = user?.organization?.slug || user?.username || "user"

  // Check subscription plan limits
  const planId: "free" | "pro" | "team" = (user?.organizationId && user.organization?.subscriptionPlan) 
    ? (user.organization.subscriptionPlan as "free" | "pro" | "team")
    : ((user?.subscriptionPlan as "free" | "pro" | "team") || "free")
  
  const currentPlan = getPlanById(planId)
  const canCreateMore = checkLimit(planId, "eventTypes", filteredEventTypes.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Event Types</h1>
        <Link href="/dashboard/event-types/new">
           <Button disabled={!canCreateMore}>
             <Plus className="mr-2 h-4 w-4" /> New Event Type
           </Button>
        </Link>
      </div>

      {!canCreateMore && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Event Type Limit Reached</AlertTitle>
          <AlertDescription>
            You've reached the limit of {currentPlan.limits.eventTypes} event type{currentPlan.limits.eventTypes === 1 ? '' : 's'} for your current plan ({currentPlan.name}). 
            <Link href="/dashboard/subscription" className="ml-2 underline font-semibold">
              Upgrade to create more
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEventTypes.map((eventType) => (
          <EventTypeCard
            key={eventType.id}
            id={eventType.id}
            title={eventType.title}
            slug={eventType.slug}
            duration={eventType.duration}
            locationType={eventType.locationType}
            identifier={identifier}
          />
        ))}
        {filteredEventTypes.length === 0 && (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg bg-slate-50/50">
            <h3 className="text-lg font-semibold mb-2">No event types yet</h3>
            <p className="text-muted-foreground mb-4">Create your first event type to start accepting bookings.</p>
            <Link href="/dashboard/event-types/new">
              <Button>Create Event Type</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
