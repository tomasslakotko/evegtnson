"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  organizationSlug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export function CorporateRegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: "",
      organizationSlug: "",
      name: "",
      email: "",
      password: "",
    },
  })

  const organizationName = form.watch("organizationName")
  
  React.useEffect(() => {
    if (organizationName) {
      const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
      form.setValue("organizationSlug", slug)
    }
  }, [organizationName, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    const payload = {
      ...values,
      accountType: "corporate",
    }
    
    console.log("Sending registration request:", payload)

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    let data
    try {
      data = await response.json()
    } catch (e) {
      setError("Server error. Please try again.")
      setIsLoading(false)
      return
    }

    setIsLoading(false)

    if (!response.ok) {
      setError(data.message || "Something went wrong")
      return
    }

    // Redirect to login
    router.push("/auth/signin")
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input
              id="organizationName"
              placeholder="Acme Inc."
              type="text"
              disabled={isLoading}
              {...form.register("organizationName")}
            />
            {form.formState.errors.organizationName && (
              <p className="text-sm text-red-500">{form.formState.errors.organizationName.message}</p>
            )}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="organizationSlug">Organization URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">bookthecall.com/</span>
              <Input
                id="organizationSlug"
                placeholder="acme-inc"
                type="text"
                disabled={isLoading}
                {...form.register("organizationSlug")}
              />
            </div>
            {form.formState.errors.organizationSlug && (
              <p className="text-sm text-red-500">{form.formState.errors.organizationSlug.message}</p>
            )}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              type="text"
              disabled={isLoading}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="Password"
              type="password"
              disabled={isLoading}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button disabled={isLoading}>
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Building2 className="mr-2 h-4 w-4" />
            Create Corporate Account
          </Button>
        </div>
      </form>
    </div>
  )
}

