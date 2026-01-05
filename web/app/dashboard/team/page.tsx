import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Mail, UserPlus, Tag } from "lucide-react"
import Link from "next/link"
import { ManageMemberTags } from "@/components/dashboard/manage-member-tags"
import { ManageMemberAvailability } from "@/components/dashboard/manage-member-availability"

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organization: {
        include: {
          members: {
            include: {
              tags: {
                include: {
                  tag: true,
                },
              },
            },
          },
          tags: true,
        },
      },
    },
  })

  if (!user?.organization) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>No Organization</CardTitle>
            <CardDescription>You need to be part of an organization to manage a team.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/signup/corporate">
              <Button>Create Corporate Account</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = user.role === "owner" || user.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1">{user.organization.name}</p>
        </div>
        {isOwner && (
          <Link href="/dashboard/team/invite">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your organization members</CardDescription>
            </div>
            {isOwner && (
              <Link href="/dashboard/team/tags">
                <Button variant="outline" size="sm">
                  <Tag className="mr-2 h-4 w-4" />
                  Manage Tags
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {user.organization.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {member.name?.charAt(0) || member.email?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{member.name || "No name"}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {member.tags?.map((userTag) => (
                        <span
                          key={userTag.tag.id}
                          className="px-2 py-1 text-xs font-medium rounded-md text-white"
                          style={{ backgroundColor: userTag.tag.color || "#3b82f6" }}
                        >
                          {userTag.tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-md">
                    {member.role || "member"}
                  </span>
                  {isOwner && (
                    <>
                      <ManageMemberTags 
                        member={member} 
                        availableTags={user.organization.tags || []}
                      />
                      <ManageMemberAvailability
                        memberId={member.id}
                        memberName={member.name || member.email || "Member"}
                        canManage={isOwner}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

