"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, ExternalLink, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CalendarIntegration {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  connected: boolean
  action: () => void
}

export function CalendarIntegrations() {
  const router = useRouter()
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    fetchConnectionStatus()
  }, [])

  const fetchConnectionStatus = async () => {
    try {
      const res = await fetch("/api/calendar/google")
      if (res.ok) {
        const data = await res.json()
        // Check if Google account has calendar access by trying to get calendar client
        let hasCalendarAccess = false
        if (data.connected) {
          try {
            const calendarRes = await fetch("/api/calendar/google/check-access")
            if (calendarRes.ok) {
              const calendarData = await calendarRes.json()
              hasCalendarAccess = calendarData.hasAccess || false
            }
          } catch (e) {
            // If check fails, assume no calendar access
            hasCalendarAccess = false
          }
        }
        
        setIntegrations([
          {
            id: "google",
            name: "Google Calendar",
            icon: <div className="bg-red-100 p-2 rounded-full w-10 h-10 flex items-center justify-center font-bold text-red-600">G</div>,
            description: "Connect your Google Calendar to check for conflicts and sync events",
            connected: hasCalendarAccess,
            action: hasCalendarAccess ? handleDisconnect : handleConnect,
          },
          {
            id: "outlook",
            name: "Outlook Calendar",
            icon: <div className="bg-blue-100 p-2 rounded-full w-10 h-10 flex items-center justify-center font-bold text-blue-600">O</div>,
            description: "Connect your Outlook Calendar to check for conflicts",
            connected: false,
            action: () => {
              alert("Outlook Calendar integration coming soon!")
            }
          },
        ])
      }
    } catch (error) {
      console.error("Error fetching connection status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // Use signIn with Google provider which includes calendar scopes
      // This will update existing Google account with calendar permissions if already connected
      await signIn("google", {
        callbackUrl: "/dashboard/settings",
        redirect: true,
      })
    } catch (error) {
      console.error("Error connecting Google Calendar:", error)
      alert("Failed to connect Google Calendar. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Calendar? This will stop syncing events.")) {
      return
    }

    try {
      const res = await fetch("/api/calendar/google", {
        method: "DELETE",
      })

      if (res.ok) {
        router.refresh()
        fetchConnectionStatus()
      } else {
        alert("Failed to disconnect Google Calendar")
      }
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error)
      alert("An error occurred while disconnecting")
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
        <CardTitle>Calendar Integrations</CardTitle>
        <CardDescription>Connect your calendars to check for conflicts and sync events.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="flex items-center justify-between border p-4 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              {integration.icon}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{integration.name}</p>
                  {integration.connected && (
                    <Badge variant="default" className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {integration.description}
                </p>
                {integration.id === "google" && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Requires separate Google Calendar access (different from Google account connection)
                  </p>
                )}
              </div>
            </div>
            <Button
              variant={integration.connected ? "outline" : "default"}
              onClick={integration.action}
              disabled={isConnecting && !integration.connected}
            >
              {isConnecting && !integration.connected ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : integration.connected ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Disconnect
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </div>
        ))}

        <Alert className="mt-4">
          <AlertDescription className="text-sm text-muted-foreground">
            Calendar integrations will automatically check for conflicts when booking new meetings and sync events between platforms.
            {integrations.find(i => i.id === "google")?.connected && (
              <span className="block mt-2 text-green-600">
                ✓ Google Calendar is connected and will sync your bookings automatically.
              </span>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

