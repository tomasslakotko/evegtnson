"use client"

import { useState, useEffect } from "react"
import { BookingForm } from "@/components/booking/booking-form"

interface BookingWidgetProps {
  identifier: string
  slug: string
  apiUrl?: string
}

export function BookingWidget({ identifier, slug, apiUrl = "/api/widget/event-type" }: BookingWidgetProps) {
  const [eventType, setEventType] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEventType = async () => {
      try {
        const res = await fetch(`${apiUrl}?identifier=${encodeURIComponent(identifier)}&slug=${encodeURIComponent(slug)}`)
        if (!res.ok) {
          throw new Error("Event type not found")
        }
        const data = await res.json()
        setEventType(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load booking form")
      } finally {
        setLoading(false)
      }
    }

    fetchEventType()
  }, [identifier, slug, apiUrl])

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ display: "inline-block", width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #667eea", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error || !eventType) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#ef4444" }}>
        {error || "Event type not found"}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <BookingForm eventType={eventType} />
    </div>
  )
}

