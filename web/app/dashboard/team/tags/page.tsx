"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Tag, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const formSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
})

export default function TagsPage() {
  const router = useRouter()
  const [tags, setTags] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      color: "#3b82f6",
    },
  })

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    setIsFetching(true)
    try {
      const res = await fetch("/api/tags")
      if (res.ok) {
        const data = await res.json()
        setTags(data)
      }
    } catch (error) {
      console.error("Failed to fetch tags", error)
    } finally {
      setIsFetching(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (res.ok) {
        form.reset()
        fetchTags()
      } else {
        const data = await res.json()
        alert(data.message || "Failed to create tag")
      }
    } catch (error) {
      alert("Failed to create tag")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return

    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchTags()
      }
    } catch (error) {
      alert("Failed to delete tag")
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Tags</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create New Tag</CardTitle>
          <CardDescription>Create tags to organize your team members</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tag Name</Label>
                <Input
                  id="name"
                  placeholder="Developer"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    className="w-20 h-10"
                    {...form.register("color")}
                  />
                  <Input
                    type="text"
                    placeholder="#3b82f6"
                    {...form.register("color")}
                  />
                </div>
                {form.formState.errors.color && (
                  <p className="text-red-500 text-sm">{form.formState.errors.color.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Tag
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Tags</CardTitle>
          <CardDescription>All tags in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tags.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tags created yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-white"
                  style={{ backgroundColor: tag.color || "#3b82f6" }}
                >
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">{tag.name}</span>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="hover:opacity-70 ml-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

