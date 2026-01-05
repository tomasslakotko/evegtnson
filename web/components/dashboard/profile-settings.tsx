"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Check, X, Mail, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn } from "next-auth/react"

interface ProfileData {
  id: string
  name: string | null
  email: string | null
  username: string | null
  bio: string | null
  image: string | null
  providers?: string[]
}

export function ProfileSettings() {
  const router = useRouter()
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setIsUploading(true);
    setError(null);

    try {
      // Direct upload to our API endpoint
      const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const newBlob = await response.json();
      
      // Update local state
      setProfile(prev => prev ? ({ ...prev, image: newBlob.url }) : null);
      
      router.refresh();
      setIsUploading(false);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload image");
      setIsUploading(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
        await signIn("google", { callbackUrl: "/dashboard/settings" })
    } catch (error) {
        console.error("Link Google error:", error)
        setError("Failed to link Google account")
    }
  }

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
            <Avatar className="h-20 w-20 border">
              <AvatarImage src={profile?.image || ""} className="object-cover" />
              <AvatarFallback className="text-lg">
                {profile?.name?.charAt(0) || profile?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Profile Picture</p>
              <div className="flex items-center gap-2">
                <Input
                  ref={inputFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                  id="avatar-upload"
                  disabled={isUploading}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  disabled={isUploading}
                  onClick={() => inputFileRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {isUploading ? "Uploading..." : "Upload New Picture"}
                </Button>
                {profile?.image && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={async () => {
                             setProfile(prev => prev ? ({ ...prev, image: null }) : null);
                             await fetch("/api/profile", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ image: null }),
                              });
                        }}
                    >
                        Remove
                    </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Supports JPG, PNG, GIF up to 5MB
              </p>
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

          {/* Linked Accounts Section */}
          <div className="grid gap-2">
            <Label>Linked Accounts</Label>
            <div className="border rounded-md p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full border shadow-sm">
                            <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Google</p>
                            <p className="text-xs text-muted-foreground">
                                {profile?.providers?.includes("google") 
                                    ? "Connected" 
                                    : "Not connected"}
                            </p>
                        </div>
                    </div>
                    {profile?.providers?.includes("google") ? (
                        <Button variant="outline" size="sm" disabled className="text-green-600 border-green-200 bg-green-50">
                            <Check className="mr-2 h-3 w-3" />
                            Connected
                        </Button>
                    ) : (
                        <Button type="button" variant="outline" size="sm" onClick={handleLinkGoogle}>
                            Connect
                        </Button>
                    )}
                </div>
            </div>
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
