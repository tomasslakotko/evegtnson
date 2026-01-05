import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "google",
      },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
      },
    })

    return NextResponse.json({
      connected: !!account,
      account: account ? {
        id: account.id,
        providerAccountId: account.providerAccountId,
      } : null,
    })
  } catch (error) {
    console.error("Error checking Google Calendar connection:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    await prisma.account.deleteMany({
      where: {
        userId: session.user.id,
        provider: "google",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

