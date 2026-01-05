import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isSystemAdmin } from "@/lib/admin"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const hasAccess = await isSystemAdmin(session.user.id)
  if (!hasAccess) {
    redirect("/dashboard")
  }

  // Fetch statistics
  const [usersCount, orgsCount, bookingsCount, eventTypesCount] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.booking.count(),
    prisma.eventType.count(),
  ])

  const stats = {
    users: usersCount,
    organizations: orgsCount,
    bookings: bookingsCount,
    eventTypes: eventTypesCount,
  }

  return <AdminDashboard stats={stats} />
}

