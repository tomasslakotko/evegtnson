import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getGoogleCalendarClient } from "@/lib/google-calendar"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ hasAccess: false }, { status: 401 })
  }

  try {
    // Try to get calendar client - if it works, user has calendar access
    await getGoogleCalendarClient(session.user.id)
    return NextResponse.json({ hasAccess: true })
  } catch (error: any) {
    // If it fails, user doesn't have calendar access
    // Log error in development only
    if (process.env.NODE_ENV === "development") {
      console.error("Calendar access check failed:", error.message)
    }
    return NextResponse.json({ hasAccess: false })
  }
}

