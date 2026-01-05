"use client"

import { useRef } from "react"
import { Upload } from "lucide-react"
import { upload } from '@vercel/blob/client';

// ... (interface remains the same)

export function ProfileSettings() {
  const router = useRouter()
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false) // New state
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ... (useEffect and initial fetch remain the same)

  // New function for handling file upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setIsUploading(true);
    setError(null);

    try {
      // 1. Upload to Vercel Blob
      const response = await fetch(`/api/upload`, {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const newBlob = await response.json();
      
      // The API route handles database update in the onUploadCompleted callback 
      // OR we can do it manually here if we want immediate feedback in UI without waiting for webhook
      // Let's do a direct upload from client for simplicity and speed if we use client-side tokens
      // But since we implemented server-side token generation, we need to use the client SDK with the token
      
      // ACTUALLY, let's use the simplest flow: Client uploads to our API, API uploads to Blob
      // Wait, Vercel Blob recommends client uploads. Let's stick to the official client SDK pattern.
      // But we need to install the client package.
      
      // Let's try a simpler approach first: Upload via our API endpoint directly
      // Re-reading the API route I wrote: it uses handleUpload which expects the client to use the `upload` function from @vercel/blob/client
      
      // Let's use the `upload` function from the client SDK
      const { url } = await put(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });

      // Update local state
      setProfile(prev => prev ? ({ ...prev, image: url }) : null);
      
      // The database update is handled by the server-side callback in /api/upload
      // But to be sure UI reflects it immediately and persists if callback is slow:
      // (The callback updates the DB, so refresh should show it)
      
      router.refresh();
      setIsUploading(false);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload image");
      setIsUploading(false);
    }
  };

  // ... (handleSubmit remains the same)

  // ... (isLoading check remains the same)

  return (
    <Card>
      {/* ... Header ... */}
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
                             // Handle delete logic if needed
                             setProfile(prev => prev ? ({ ...prev, image: null }) : null);
                             // Call API to remove image from DB
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

          {/* ... Rest of the form ... */}

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

