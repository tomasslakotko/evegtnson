"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["member", "admin"]),
})

export function InviteUserForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "member",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    const response = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    const data = await response.json()

    setIsLoading(false)

    if (!response.ok) {
      setError(data.message || "Something went wrong")
      return
    }

    router.push("/dashboard/team")
    router.refresh()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm max-w-md">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="John Doe"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          onValueChange={(val: any) => form.setValue("role", val)}
          defaultValue={form.getValues("role")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Invite User
        </Button>
      </div>
    </form>
  )
}

