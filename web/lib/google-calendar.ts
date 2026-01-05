import { google } from "googleapis"
import { prisma } from "@/lib/prisma"

// Get Google Calendar client for a user
export async function getGoogleCalendarClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId: userId,
      provider: "google",
    },
  })

  if (!account || !account.access_token) {
    throw new Error("Google Calendar not connected")
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/callback/google`
  )

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token || undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  })

  // Refresh token if expired
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    if (account.refresh_token) {
      const { credentials } = await oauth2Client.refreshAccessToken()
      
      // Update token in database
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: credentials.access_token || account.access_token,
          expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : account.expires_at,
          refresh_token: credentials.refresh_token || account.refresh_token,
        },
      })

      oauth2Client.setCredentials(credentials)
    } else {
      throw new Error("Token expired and no refresh token available")
    }
  }

  return google.calendar({ version: "v3", auth: oauth2Client })
}

// Check if user has busy slots in Google Calendar
export async function checkGoogleCalendarBusy(
  userId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const calendar = await getGoogleCalendarClient(userId)
    
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        items: [{ id: "primary" }],
      },
    })

    const busySlots = response.data.calendars?.primary?.busy || []
    return busySlots.length > 0
  } catch (error) {
    console.error("Error checking Google Calendar:", error)
    // If error, assume not busy (fail open)
    return false
  }
}

// Create event in Google Calendar
export async function createGoogleCalendarEvent(
  userId: string,
  eventData: {
    title: string
    description?: string
    startTime: Date
    endTime: Date
    location?: string
    attendeeEmail?: string
    attendeeName?: string
  }
): Promise<string | null> {
  try {
    const calendar = await getGoogleCalendarClient(userId)

    const event = {
      summary: eventData.title,
      description: eventData.description || "",
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: "UTC",
      },
      location: eventData.location || "",
      attendees: eventData.attendeeEmail
        ? [
            {
              email: eventData.attendeeEmail,
              displayName: eventData.attendeeName,
            },
          ]
        : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 24 hours before
          { method: "popup", minutes: 60 }, // 1 hour before
        ],
      },
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    })

    return response.data.id || null
  } catch (error) {
    console.error("Error creating Google Calendar event:", error)
    return null
  }
}

// Update event in Google Calendar
export async function updateGoogleCalendarEvent(
  userId: string,
  eventId: string,
  eventData: {
    title?: string
    description?: string
    startTime?: Date
    endTime?: Date
    location?: string
  }
): Promise<boolean> {
  try {
    const calendar = await getGoogleCalendarClient(userId)

    const updateData: any = {}
    if (eventData.title) updateData.summary = eventData.title
    if (eventData.description !== undefined) updateData.description = eventData.description
    if (eventData.startTime) {
      updateData.start = {
        dateTime: eventData.startTime.toISOString(),
        timeZone: "UTC",
      }
    }
    if (eventData.endTime) {
      updateData.end = {
        dateTime: eventData.endTime.toISOString(),
        timeZone: "UTC",
      }
    }
    if (eventData.location !== undefined) updateData.location = eventData.location

    await calendar.events.patch({
      calendarId: "primary",
      eventId: eventId,
      requestBody: updateData,
    })

    return true
  } catch (error) {
    console.error("Error updating Google Calendar event:", error)
    return false
  }
}

// Delete event from Google Calendar
export async function deleteGoogleCalendarEvent(
  userId: string,
  eventId: string
): Promise<boolean> {
  try {
    const calendar = await getGoogleCalendarClient(userId)

    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    })

    return true
  } catch (error) {
    console.error("Error deleting Google Calendar event:", error)
    return false
  }
}

