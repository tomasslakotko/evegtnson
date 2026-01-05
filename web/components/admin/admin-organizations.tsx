"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Search, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  subscriptionPlan: string | null
  _count: {
    members: number
  }
  createdAt: string
}

export function AdminOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    subscriptionPlan: "free" as "free" | "pro" | "team",
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrganizations()
  }, [search])

  const fetchOrganizations = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      params.append("limit", "100")

      const res = await fetch(`/api/admin/organizations?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrganizations(data.organizations || [])
      }
    } catch (err) {
      console.error("Error fetching organizations:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingOrg(null)
    setFormData({
      name: "",
      slug: "",
      description: "",
      subscriptionPlan: "free",
    })
    setError(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (org: Organization) => {
    setEditingOrg(org)
    setFormData({
      name: org.name,
      slug: org.slug,
      description: org.description || "",
      subscriptionPlan: (org.subscriptionPlan as any) || "free",
    })
    setError(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const url = editingOrg 
        ? `/api/admin/organizations/${editingOrg.id}`
        : "/api/admin/organizations"
      
      const method = editingOrg ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || "Failed to save organization")
        return
      }

      setIsDialogOpen(false)
      fetchOrganizations()
    } catch (err) {
      console.error("Error saving organization:", err)
      setError("An error occurred")
    }
  }

  const handleDelete = async (orgId: string) => {
    if (!confirm("Are you sure you want to delete this organization? All members will be affected.")) return

    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchOrganizations()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.message || "Failed to delete organization")
      }
    } catch (err) {
      console.error("Error deleting organization:", err)
      alert("An error occurred")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Organization Management</CardTitle>
            <CardDescription>Create, edit, and manage organizations</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between border p-4 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{org.name}</p>
                    <Badge variant="secondary">{org.subscriptionPlan || "free"}</Badge>
                    <Badge variant="outline">{org._count.members} members</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">/{org.slug}</p>
                  {org.description && (
                    <p className="text-sm text-muted-foreground mt-1">{org.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(org)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(org.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {organizations.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No organizations found</p>
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingOrg ? "Edit Organization" : "Create Organization"}</DialogTitle>
              <DialogDescription>
                {editingOrg ? "Update organization information" : "Create a new organization"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  required
                />
                <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and hyphens</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                <Select
                  value={formData.subscriptionPlan}
                  onValueChange={(val: any) => setFormData({ ...formData, subscriptionPlan: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

