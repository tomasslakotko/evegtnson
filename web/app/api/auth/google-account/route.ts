import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { google } from "googleapis"

// This endpoint handles connecting Google account for authentication only (without calendar access)
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")

  if (!code) {
    // Redirect to Google OAuth with minimal scopes (no calendar)
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/google-account`
    )

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["openid", "email", "profile"], // Only basic profile, no calendar
      state: session.user.id, // Pass user ID in state
    })

    return NextResponse.redirect(authUrl)
  }

  // Handle OAuth callback
  try {
    const { searchParams } = new URL(req.url)
    const state = searchParams.get("state")
    const userId = state || session.user.id

    if (userId !== session.user.id) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/settings?error=invalid_state`)
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/google-account`
    )

    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get user info from Google
    const people = google.people({ version: "v1", auth: oauth2Client })
    const profile = await people.people.get({
      resourceName: "people/me",
      personFields: "emailAddresses,names,photos",
    })

    const email = profile.data.emailAddresses?.[0]?.value
    const name = profile.data.names?.[0]?.displayName
    const image = profile.data.photos?.[0]?.url

    if (!email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/settings?error=no_email`)
    }

    // Check if this Google account is already linked to another user
    const existingAccount = await prisma.account.findFirst({
      where: {
        provider: "google",
        providerAccountId: email,
      },
    })

    if (existingAccount && existingAccount.userId !== session.user.id) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/settings?error=already_linked`)
    }

    // Link or update the account (without calendar scopes)
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: email,
        },
      },
      update: {
        access_token: tokens.access_token || null,
        refresh_token: tokens.refresh_token || null,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
      },
      create: {
        userId: session.user.id,
        provider: "google",
        providerAccountId: email,
        type: "oauth",
        access_token: tokens.access_token || null,
        refresh_token: tokens.refresh_token || null,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
      },
    })

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/settings?success=google_linked`)
  } catch (error) {
    console.error("Error linking Google account:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/settings?error=link_failed`)
  }
}
