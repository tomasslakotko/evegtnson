import { Metadata } from "next"
import Link from "next/link"
import { CorporateRegisterForm } from "@/components/auth/corporate-register-form"

export const metadata: Metadata = {
  title: "Corporate Sign Up",
  description: "Create a corporate account",
}

export default function CorporateRegisterPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center mx-auto">
      <Link
        href="/"
        className="absolute left-4 top-4 md:left-8 md:top-8 text-sm font-medium hover:underline"
      >
        Back
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Corporate Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up your organization and start managing your team
          </p>
        </div>
        <CorporateRegisterForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link href="/auth/signin" className="hover:text-primary underline underline-offset-4">
            Already have an account? Sign In
          </Link>
          {" • "}
          <Link href="/auth/signup" className="hover:text-primary underline underline-offset-4">
            Individual Account
          </Link>
        </p>
      </div>
    </div>
  )
}

