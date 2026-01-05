import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { isSystemAdmin } from "@/lib/admin"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ isSystemAdmin: false }, { status: 401 })
  }

  try {
    const hasAccess = await isSystemAdmin(session.user.id)
    return NextResponse.json({ isSystemAdmin: hasAccess })
  } catch (error) {
    return NextResponse.json({ isSystemAdmin: false })
  }
}

