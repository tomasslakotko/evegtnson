import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BookingForm } from "@/components/booking/booking-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Video, Phone, Building2, Globe } from "lucide-react"

export default async function BookingPage(props: { params: Promise<{ username: string, slug: string }> }) {
  const params = await props.params;
  const { username, slug } = params

  console.log(`[BookingPage] Requested: username=${username}, slug=${slug}`)

  // Try to find user by username first
  let user = await prisma.user.findUnique({
    where: { username },
    include: {
      organization: true
    }
  })
  
  console.log(`[BookingPage] User found by username? ${!!user}`)

  // If not found, try to find organization by slug
  if (!user) {
    const organization = await prisma.organization.findUnique({
      where: { slug: username },
      include: {
        members: {
          where: {
            role: { in: ["owner", "admin"] }
          },
          take: 1
        }
      }
    })

    console.log(`[BookingPage] Organization found by slug? ${!!organization}`)

    if (organization && organization.members.length > 0) {
      // Use the first owner/admin as the base user for event type lookup
      user = await prisma.user.findUnique({
        where: { id: organization.members[0].id },
        include: {
          organization: true
        }
      })
      console.log(`[BookingPage] User set to org admin: ${user?.id}`)
    }
  }

  if (!user) {
    console.log(`[BookingPage] No user or organization found -> 404`)
    notFound()
  }

  // Find event type - check all users in the organization if it's an org event
  let eventType = await prisma.eventType.findUnique({
    where: {
      userId_slug: {
        userId: user.id,
        slug,
      }
    },
    include: {
      hosts: {
        include: {
          user: true
        }
      }
    }
  })

  console.log(`[BookingPage] Event type found initially? ${!!eventType}`)

  // If not found and user has organization, search efficiently across all organization members
  if (!eventType && user.organizationId) {
    console.log(`[BookingPage] Searching via optimized query in org...`)
    
    // Optimized query: Find ANY event type with this slug belonging to ANY member of the organization
    eventType = await prisma.eventType.findFirst({
      where: {
        slug: slug,
        user: {
          organizationId: user.organizationId
        }
      },
      include: {
        hosts: {
          include: {
            user: true
          }
        }
      }
    })
    
    if (eventType) {
      console.log(`[BookingPage] Found event type via optimized query: ${eventType.id}`)
    }
  }

  if (!eventType) {
    console.log(`[BookingPage] Event type not found anywhere -> 404`)
    notFound()
  }

  // Determine display info
  const isTeamEvent = eventType.hosts.length > 1
  const showOrganization = (isTeamEvent || user.organizationId) && !!user.organization

  const displayName = showOrganization ? user.organization?.name : (user.name || user.username)
  const displayImage = showOrganization ? null : user.image
  const displayInitials = showOrganization 
    ? user.organization?.name?.charAt(0).toUpperCase() 
    : (user.name?.charAt(0) || user.username?.charAt(0))?.toUpperCase()

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-xl shadow-lg border max-w-5xl w-full grid md:grid-cols-[1fr_2fr] overflow-hidden min-h-[600px]">
        {/* Left Side: Info */}
        <div className="p-8 border-r bg-slate-50/50">
           <div className="mb-8">
              <Avatar className="h-16 w-16 mb-4">
                 <AvatarImage src={displayImage || ""} />
                 <AvatarFallback className={showOrganization ? "bg-blue-100 text-blue-700" : ""}>
                    {displayInitials}
                 </AvatarFallback>
              </Avatar>
              <div className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2">
                {showOrganization && <Building2 className="h-3 w-3" />}
                {displayName}
              </div>
              <h1 className="text-2xl font-bold">{eventType.title}</h1>
           </div>
           
           <div className="space-y-4">
             <div className="flex items-center text-muted-foreground">
               <Clock className="w-5 h-5 mr-3" />
               <span>{eventType.duration} mins</span>
             </div>
             <div className="flex items-center text-muted-foreground">
               {eventType.locationType === 'google_meet' && <Video className="w-5 h-5 mr-3" />}
               {eventType.locationType === 'teams' && <Video className="w-5 h-5 mr-3" />}
               {eventType.locationType === 'mirotalk' && <Globe className="w-5 h-5 mr-3" />}
               {eventType.locationType === 'phone' && <Phone className="w-5 h-5 mr-3" />}
               <span className="capitalize">
                 {eventType.locationType === 'mirotalk' ? 'MiroTalk Video' : eventType.locationType.replace('_', ' ')}
               </span>
             </div>
             {eventType.description && (
               <p className="text-sm text-muted-foreground mt-6 whitespace-pre-wrap leading-relaxed">
                 {eventType.description}
               </p>
             )}
           </div>
        </div>

        {/* Right Side: Calendar & Form */}
        <div className="p-8">
           <BookingForm eventType={eventType} />
        </div>
      </div>
    </div>
  )
}
