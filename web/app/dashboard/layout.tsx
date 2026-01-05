import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header user={session.user} />
        <main className="flex-1 p-6 bg-slate-50/20">{children}</main>
      </div>
    </div>
  )
}

