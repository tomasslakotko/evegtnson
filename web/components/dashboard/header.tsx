"use client"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header({ user }: { user: any }) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: "/auth/signin"
      })
      router.push("/auth/signin")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
      // Fallback: redirect anyway
      router.push("/auth/signin")
    }
  }

  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-white dark:bg-slate-950">
      <div className="md:hidden font-bold">BookTheCall</div>
      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
             </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
             <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

