"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PLANS, getPlanById, type PlanId } from "@/lib/subscription"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Crown, Zap, Users, Loader2, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SubscriptionPageClientProps {
  currentPlanId: string
  isOrgAccount: boolean
  orgName?: string | null
}

export function SubscriptionPageClient({ currentPlanId, isOrgAccount, orgName }: SubscriptionPageClientProps) {
  const router = useRouter()
  const [isChanging, setIsChanging] = useState<string | null>(null)
  const [isSystemAdmin, setIsSystemAdmin] = useState(false)

  const currentPlan = getPlanById(currentPlanId)

  useEffect(() => {
    // Check if user is system admin
    fetch("/api/admin/check")
      .then(res => res.json())
      .then(data => setIsSystemAdmin(data.isSystemAdmin || false))
      .catch(() => setIsSystemAdmin(false))
  }, [])

  const handlePlanChange = async (newPlanId: PlanId) => {
    if (newPlanId === currentPlanId) return

    setIsChanging(newPlanId)
    try {
      const res = await fetch("/api/subscription/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: newPlanId }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({ message: "Failed to change plan" }))
        alert(data.message || "Failed to change plan")
      }
    } catch (error) {
      console.error("Error changing plan:", error)
      alert("An error occurred while changing plan")
    } finally {
      setIsChanging(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-2">
          {isOrgAccount 
            ? `Manage subscription for ${orgName || "your organization"}`
            : "Manage your subscription plan"}
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription plan</CardDescription>
            </div>
            <Badge variant={currentPlanId === "free" ? "secondary" : "default"} className="text-lg px-4 py-2">
              {currentPlan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold">€{currentPlan.price}<span className="text-base font-normal text-muted-foreground">/month</span></p>
            </div>
            <div className="space-y-2">
              {currentPlan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {Object.values(PLANS).map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId
            const isUpgrade = plan.price > currentPlan.price
            const isDowngrade = plan.price < currentPlan.price && plan.price > 0
            
            return (
              <Card key={plan.id} className={isCurrentPlan ? "border-primary shadow-lg" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    {plan.id === "pro" && <Zap className="h-5 w-5 text-yellow-500" />}
                    {plan.id === "team" && <Crown className="h-5 w-5 text-purple-500" />}
                    {plan.id === "free" && <Users className="h-5 w-5 text-gray-500" />}
                    {isCurrentPlan && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold mt-2">
                    €{plan.price}
                    <span className="text-base font-normal text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : isSystemAdmin ? (
                    <Button 
                      className="w-full" 
                      variant={isUpgrade ? "default" : "outline"}
                      onClick={() => handlePlanChange(plan.id)}
                      disabled={isChanging === plan.id}
                    >
                      {isChanging === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Select Plan"
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Contact Admin
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Note about plan changes */}
      {!isSystemAdmin && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <strong>Plan Changes:</strong> Only system administrators can change subscription plans. 
            Please contact support if you need to upgrade or modify your plan.
          </AlertDescription>
        </Alert>
      )}

      {isSystemAdmin && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>System Admin:</strong> You can change subscription plans directly. 
              Payment processing is not yet configured. When Stripe is integrated, plan changes will be processed automatically.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

