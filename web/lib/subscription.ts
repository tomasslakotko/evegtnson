// Subscription plans configuration
export type PlanId = "free" | "pro" | "team"

export interface Plan {
  id: PlanId
  name: string
  price: number
  priceId?: string // Stripe price ID (for future integration)
  features: string[]
  limits: {
    eventTypes: number // -1 for unlimited
    bookingsPerMonth: number // -1 for unlimited
    teamMembers: number // -1 for unlimited
    calendarIntegrations: boolean
    customBranding: boolean
    prioritySupport: boolean
  }
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    features: [
      "1 Event Type",
      "5 Bookings per Month",
      "Email Notifications",
      "Basic Calendar View",
    ],
    limits: {
      eventTypes: 1,
      bookingsPerMonth: 5, // 5 bookings per month
      teamMembers: 1,
      calendarIntegrations: false,
      customBranding: false,
      prioritySupport: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 12,
    priceId: undefined, // Will be set when Stripe is configured
    features: [
      "Unlimited Event Types",
      "Unlimited Bookings",
      "Individual Account",
      "Google Calendar Integration",
      "Custom Branding",
      "Email & SMS Notifications",
      "Priority Support",
    ],
    limits: {
      eventTypes: -1, // unlimited
      bookingsPerMonth: -1, // unlimited
      teamMembers: 1, // Individual account only
      calendarIntegrations: true,
      customBranding: true,
      prioritySupport: true,
    },
  },
  team: {
    id: "team",
    name: "Team",
    price: 29,
    priceId: undefined, // Will be set when Stripe is configured
    features: [
      "All Pro Features",
      "Unlimited Team Members",
      "Admin Dashboard",
      "Advanced Analytics",
      "API Access",
      "Dedicated Support",
    ],
    limits: {
      eventTypes: -1, // unlimited
      bookingsPerMonth: -1, // unlimited
      teamMembers: -1, // unlimited
      calendarIntegrations: true,
      customBranding: true,
      prioritySupport: true,
    },
  },
}

export function getPlanById(planId: string | null | undefined): Plan {
  if (!planId || !(planId in PLANS)) {
    return PLANS.free
  }
  return PLANS[planId as PlanId]
}

export function checkFeatureAccess(
  userPlan: PlanId | null | undefined,
  feature: keyof Plan["limits"]
): boolean {
  const plan = getPlanById(userPlan)
  const limit = plan.limits[feature]
  
  if (typeof limit === "boolean") {
    return limit
  }
  
  return limit === -1 || limit > 0
}

export function checkLimit(
  userPlan: PlanId | null | undefined,
  feature: keyof Plan["limits"],
  currentCount: number
): boolean {
  const plan = getPlanById(userPlan)
  const limit = plan.limits[feature]
  
  if (typeof limit === "boolean") {
    return limit
  }
  
  if (limit === -1) {
    return true // unlimited
  }
  
  return currentCount < limit
}

