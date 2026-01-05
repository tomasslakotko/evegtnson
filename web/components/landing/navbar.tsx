import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 max-w-7xl mx-auto">
      <Link href="/" className="text-2xl font-bold">BookTheCall</Link>
      <div className="hidden md:flex gap-6">
        <Link href="#features" className="hover:underline">Features</Link>
        <Link href="#pricing" className="hover:underline">Pricing</Link>
      </div>
      <div className="flex gap-4">
        <Link href="/auth/signin">
          <Button variant="ghost">Log in</Button>
        </Link>
        <Link href="/auth/signup">
          <Button>Get Started</Button>
        </Link>
      </div>
    </nav>
  )
}

