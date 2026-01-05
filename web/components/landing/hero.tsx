import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="py-20 text-center px-4">
      <h1 className="text-5xl font-extrabold tracking-tight mb-6">
        Scheduling made <span className="text-primary">simple</span>.
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        Book calls, manage your schedule, and get paid. All in one place.
        The best alternative to Cal.com for your business.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link href="/auth/signup">
          <Button size="lg">Start for free</Button>
        </Link>
        <Link href="/auth/signup/corporate">
          <Button size="lg" variant="outline">Corporate Account</Button>
        </Link>
        <Link href="#features">
          <Button variant="outline" size="lg">Learn more</Button>
        </Link>
      </div>
    </section>
  )
}

