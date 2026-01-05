"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Search, Edit, Trash2, Shield } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface User {
  id: string
  name: string | null
  email: string | null
  username: string | null
  role: string | null
  subscriptionPlan: string | null
  organizationId: string | null
  organization: {
    name: string
    slug: string
  } | null
  createdAt: string
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    username: "",
    password: "",
    role: "member" as "member" | "admin" | "owner" | "system_admin",
    subscriptionPlan: "free" as "free" | "pro" | "team",
    organizationId: "",
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [search])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      params.append("limit", "100")

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error("Error fetching users:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      email: "",
      name: "",
      username: "",
      password: "",
      role: "member",
      subscriptionPlan: "free",
      organizationId: "",
    })
    setError(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email || "",
      name: user.name || "",
      username: user.username || "",
      password: "",
      role: (user.role as any) || "member",
      subscriptionPlan: (user.subscriptionPlan as any) || "free",
      organizationId: user.organizationId || "",
    })
    setError(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const url = editingUser 
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users"
      
      const method = editingUser ? "PATCH" : "POST"

      const body: any = {
        name: formData.name,
        username: formData.username,
        role: formData.role,
        subscriptionPlan: formData.subscriptionPlan,
      }

      if (!editingUser) {
        body.email = formData.email
        if (formData.password) {
          body.password = formData.password
        }
      }

      if (formData.organizationId) {
        body.organizationId = formData.organizationId
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || "Failed to save user")
        return
      }

      setIsDialogOpen(false)
      fetchUsers()
    } catch (err) {
      console.error("Error saving user:", err)
      setError("An error occurred")
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.message || "Failed to delete user")
      }
    } catch (err) {
      console.error("Error deleting user:", err)
      alert("An error occurred")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Create, edit, and manage user accounts</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
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
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between border p-4 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.name || user.email}</p>
                    {user.role === "system_admin" && (
                      <Badge variant="default" className="bg-purple-500">
                        <Shield className="h-3 w-3 mr-1" />
                        System Admin
                      </Badge>
                    )}
                    <Badge variant="outline">{user.role || "member"}</Badge>
                    <Badge variant="secondary">{user.subscriptionPlan || "free"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.organization && (
                    <p className="text-xs text-muted-foreground">
                      Organization: {user.organization.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Update user information" : "Create a new user account"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="password">Password (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(val: any) => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="system_admin">System Admin</SelectItem>
                  </SelectContent>
                </Select>
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

