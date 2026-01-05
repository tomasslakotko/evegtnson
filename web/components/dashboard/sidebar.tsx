"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, Clock, Settings, User, Users, CalendarDays, CreditCard, Shield, HelpCircle } from "lucide-react"
import { useEffect, useState } from "react"

const items = [
  { title: "Event Types", href: "/dashboard", icon: Calendar },
  { title: "Bookings", href: "/dashboard/bookings", icon: Clock },
  { title: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { title: "Availability", href: "/dashboard/availability", icon: User },
  { title: "Team", href: "/dashboard/team", icon: Users },
  { title: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
  { title: "Help", href: "/dashboard/help", icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isSystemAdmin, setIsSystemAdmin] = useState(false)

  useEffect(() => {
    // Check if user is system admin
    fetch("/api/admin/check")
      .then(res => res.json())
      .then(data => setIsSystemAdmin(data.isSystemAdmin || false))
      .catch(() => setIsSystemAdmin(false))
  }, [])

  return (
    <div className="w-full md:w-64 border-r bg-slate-50/40 p-4 hidden md:block">
      <div className="font-bold text-xl mb-6 px-4">BookTheCall</div>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors",
              pathname === item.href
                 ? "bg-slate-100 text-primary"
                 : "text-slate-600"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
        {isSystemAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors mt-4 border-t pt-4",
              pathname?.startsWith("/admin")
                 ? "bg-slate-100 text-primary"
                 : "text-slate-600"
            )}
          >
            <Shield className="h-4 w-4" />
            System Admin
          </Link>
        )}
      </nav>
    </div>
  )
}
