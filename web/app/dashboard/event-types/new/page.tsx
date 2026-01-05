import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { CreateEventTypeForm } from "@/components/dashboard/create-event-type-form"

export default async function NewEventTypePage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      username: true,
      organization: {
        select: {
          slug: true
        }
      }
    }
  })

  const urlPrefix = user?.organization?.slug || user?.username || "username"

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Event Type</h1>
      <CreateEventTypeForm currentUserId={session.user.id} urlPrefix={urlPrefix} />
    </div>
  )
}
