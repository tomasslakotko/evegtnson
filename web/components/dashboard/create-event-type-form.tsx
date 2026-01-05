"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  description: z.string().optional(),
  locationType: z.string(),
  hostIds: z.array(z.string()).min(1, "Select at least one host"),
})

interface Member {
  id: string
  name: string | null
  image: string | null
  email: string | null
}

interface CreateEventTypeFormProps {
  currentUserId?: string
  urlPrefix?: string // username or organization slug
  initialData?: {
    id?: string
    title: string
    slug: string
    duration: number
    description?: string
    locationType: string
    hostIds: string[]
  }
}

export function CreateEventTypeForm({ currentUserId, urlPrefix = "username", initialData }: CreateEventTypeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<React.ReactNode | null>(null)
  const [members, setMembers] = useState<Member[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any, // Temporary fix for complex Zod types inference
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      duration: initialData?.duration || 30,
      description: initialData?.description || "",
      locationType: initialData?.locationType || "google_meet",
      hostIds: initialData?.hostIds || (currentUserId ? [currentUserId] : []),
    },
  })

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/organization/members")
        if (res.ok) {
          const data = await res.json()
          setMembers(data)
        }
      } catch (err) {
        console.error("Failed to fetch members", err)
      }
    }
    fetchMembers()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    const isEditing = !!initialData?.id
    const url = isEditing ? `/api/event-types/${initialData.id}` : "/api/event-types"
    const method = isEditing ? "PATCH" : "POST"

    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    setIsLoading(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      if (response.status === 409) {
        setError("Slug already exists")
      } else if (response.status === 403 && data.upgradeRequired) {
        setError(
          <span>
            {data.message}{" "}
            <a href="/dashboard/subscription" className="underline font-semibold">
              Upgrade your plan
            </a>
          </span>
        )
      } else if (data.message) {
        setError(data.message)
      } else {
        setError("Something went wrong")
      }
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  const handleHostToggle = (hostId: string) => {
    const currentHosts = form.getValues("hostIds")
    if (currentHosts.includes(hostId)) {
      form.setValue("hostIds", currentHosts.filter(id => id !== hostId))
    } else {
      form.setValue("hostIds", [...currentHosts, hostId])
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Meeting Title"
          {...form.register("title")}
        />
        {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL Slug</Label>
        <div className="flex items-center gap-2">
           <span className="text-muted-foreground text-sm">/{urlPrefix}/</span>
           <Input id="slug" {...form.register("slug")} />
        </div>
        {form.formState.errors.slug && <p className="text-red-500 text-sm">{form.formState.errors.slug.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Input type="number" id="duration" {...form.register("duration")} />
        {form.formState.errors.duration && <p className="text-red-500 text-sm">{form.formState.errors.duration.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Select
           onValueChange={(val: string) => form.setValue("locationType", val)}
           defaultValue={form.getValues("locationType")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="google_meet">Google Meet</SelectItem>
            <SelectItem value="teams">Microsoft Teams</SelectItem>
            <SelectItem value="mirotalk">MiroTalk P2P (Free)</SelectItem>
            <SelectItem value="phone">Phone Call</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Hosts</Label>
        <p className="text-sm text-muted-foreground mb-2">Select team members who can host this event. Bookings will be assigned to available hosts randomly.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border p-4 rounded-md max-h-60 overflow-y-auto">
          {members.map(member => (
            <div key={member.id} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded">
              <Checkbox 
                id={`host-${member.id}`}
                checked={form.watch("hostIds")?.includes(member.id)}
                onCheckedChange={() => handleHostToggle(member.id)}
              />
              <Label htmlFor={`host-${member.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.image || ""} />
                  <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{member.name || member.email}</span>
              </Label>
            </div>
          ))}
          {members.length === 0 && <p className="text-sm text-muted-foreground">No team members found.</p>}
        </div>
        {form.formState.errors.hostIds && <p className="text-red-500 text-sm">{form.formState.errors.hostIds.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...form.register("description")} />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Save Changes" : "Create Event Type"}
        </Button>
      </div>
    </form>
  )
}
