import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/i, "Username can only contain letters, numbers, underscores and hyphens").optional(),
  bio: z.string().max(500).optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        image: true,
        accounts: {
          select: {
            provider: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        bio: user.bio,
        image: user.image,
        providers: (user.accounts && Array.isArray(user.accounts)) 
          ? user.accounts.map(acc => acc.provider) 
          : []
    })
  } catch (error: any) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    
    // Handle special case for image update which might not be covered by schema (if sent separately)
    // Or if username validation is complex
    
    // If only image is provided, skip schema validation for other fields
    if (Object.keys(body).length === 1 && body.image !== undefined) {
         const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { image: body.image },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                bio: true,
                image: true,
                accounts: { select: { provider: true } }
            }
        })
        return NextResponse.json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            username: updatedUser.username,
            bio: updatedUser.bio,
            image: updatedUser.image,
            providers: (updatedUser.accounts && Array.isArray(updatedUser.accounts))
              ? updatedUser.accounts.map(acc => acc.provider)
              : []
        })
    }

    const data = updateProfileSchema.parse(body)

    // Check if username is already taken (if provided and different from current)
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          id: { not: session.user.id }
        }
      })

      if (existingUser) {
        return NextResponse.json({ message: "Username already taken" }, { status: 409 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.bio !== undefined && { bio: data.bio }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        image: true,
        accounts: { select: { provider: true } }
      }
    })

    return NextResponse.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        bio: updatedUser.bio,
        image: updatedUser.image,
        providers: (updatedUser.accounts && Array.isArray(updatedUser.accounts))
          ? updatedUser.accounts.map(acc => acc.provider)
          : []
    })
  } catch (error: any) {
    console.error("Error updating profile:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: "Invalid request data", 
        issues: error.issues // Changed from error.errors to error.issues
      }, { status: 400 })
    }
    return NextResponse.json({ 
      message: error.message || "Internal server error" 
    }, { status: 500 })
  }
}
