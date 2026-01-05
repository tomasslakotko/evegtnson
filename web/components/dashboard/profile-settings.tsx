"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Check, X, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProfileData {
  id: string
  name: string | null
  email: string | null
  username: string | null
  bio: string | null
  image: string | null
}

export function ProfileSettings() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile")
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setFormData({
            name: data.name || "",
            username: data.username || "",
            bio: data.bio || "",
          })
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || "Failed to update profile")
        return
      }

      const updated = await res.json()
      setProfile(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("An error occurred while updating profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your public profile settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.image || ""} />
              <AvatarFallback>
                {profile?.name?.charAt(0) || profile?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-sm text-muted-foreground">Avatar updates coming soon</p>
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="grid gap-2">
            <Label>Email</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={profile?.email || ""} 
                disabled 
                className="bg-muted"
              />
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {/* Username */}
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="username"
              pattern="[a-z0-9_-]+"
            />
            <p className="text-xs text-muted-foreground">
              Only letters, numbers, underscores and hyphens allowed
            </p>
          </div>

          {/* Full Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          {/* Bio */}
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Profile updated successfully!
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

