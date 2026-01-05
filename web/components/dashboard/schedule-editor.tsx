"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save } from "lucide-react"
import { useRouter } from "next/navigation"

const DAYS = [
  { name: "Sunday", value: 0 },
  { name: "Monday", value: 1 },
  { name: "Tuesday", value: 2 },
  { name: "Wednesday", value: 3 },
  { name: "Thursday", value: 4 },
  { name: "Friday", value: 5 },
  { name: "Saturday", value: 6 },
]

interface Schedule {
  day: number
  startTime: string
  endTime: string
}

interface ScheduleEditorProps {
  userId?: string
  userName?: string
}

export function ScheduleEditor({ userId, userName }: ScheduleEditorProps) {
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSchedule()
  }, [userId])

  const fetchSchedule = async () => {
    setIsLoading(true)
    try {
      const url = userId ? `/api/schedule?userId=${userId}` : "/api/schedule"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setSchedules(data)
      }
    } catch (error) {
      console.error("Failed to fetch schedule", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDayToggle = (day: number) => {
    const existing = schedules.find((s) => s.day === day)
    if (existing) {
      setSchedules(schedules.filter((s) => s.day !== day))
    } else {
      setSchedules([
        ...schedules,
        { day, startTime: "09:00", endTime: "17:00" },
      ])
    }
  }

  const handleTimeChange = (day: number, field: "startTime" | "endTime", value: string) => {
    setSchedules(
      schedules.map((s) =>
        s.day === day ? { ...s, [field]: value } : s
      )
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || undefined,
          schedules,
        }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert("Failed to save schedule")
      }
    } catch (error) {
      console.error("Failed to save schedule", error)
      alert("Failed to save schedule")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{userName ? `${userName}'s Schedule` : "Weekly Schedule"}</CardTitle>
        <CardDescription>
          {userName 
            ? "Manage this team member's working hours"
            : "Manage your working hours here. Select days and set time ranges."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DAYS.map((day) => {
            const schedule = schedules.find((s) => s.day === day.value)
            const isEnabled = !!schedule

            return (
              <div
                key={day.value}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleDayToggle(day.value)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label className="w-24 font-medium cursor-pointer" htmlFor={`day-${day.value}`}>
                    {day.name}
                  </label>
                </div>
                {isEnabled && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) =>
                        handleTimeChange(day.value, "startTime", e.target.value)
                      }
                      className="w-32"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) =>
                        handleTimeChange(day.value, "endTime", e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

