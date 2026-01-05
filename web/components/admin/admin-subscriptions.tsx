"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CreditCard } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AdminSubscriptions() {
  const [formData, setFormData] = useState({
    userId: "",
    organizationId: "",
    planId: "free" as "free" | "pro" | "team",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || "Failed to update subscription")
        return
      }

      setSuccess(true)
      setFormData({
        userId: "",
        organizationId: "",
        planId: "free",
      })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("Error updating subscription:", err)
      setError("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>Change subscription plans for users or organizations</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="userId">User ID (optional)</Label>
            <Input
              id="userId"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value, organizationId: "" })}
              placeholder="User ID"
            />
            <p className="text-xs text-muted-foreground">Leave empty if updating organization</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="organizationId">Organization ID (optional)</Label>
            <Input
              id="organizationId"
              value={formData.organizationId}
              onChange={(e) => setFormData({ ...formData, organizationId: e.target.value, userId: "" })}
              placeholder="Organization ID"
            />
            <p className="text-xs text-muted-foreground">Leave empty if updating user</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="planId">Subscription Plan *</Label>
            <Select
              value={formData.planId}
              onValueChange={(val: any) => setFormData({ ...formData, planId: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro (€12/month)</SelectItem>
                <SelectItem value="team">Team (€29/month)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Subscription updated successfully!
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading || (!formData.userId && !formData.organizationId)}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Update Subscription
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

