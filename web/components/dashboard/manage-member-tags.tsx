"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tag, X, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export function ManageMemberTags({ member, availableTags }: { 
  member: any,
  availableTags: any[]
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const memberTagIds = member.tags?.map((ut: any) => ut.tag.id) || []
  const unassignedTags = availableTags.filter(tag => !memberTagIds.includes(tag.id))

  const handleAddTag = async (tagId: string) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/user-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: member.id,
          tagId,
        }),
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to add tag", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/user-tags?userId=${member.id}&tagId=${tagId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to remove tag", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Tag className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Current Tags</h4>
            {member.tags && member.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {member.tags.map((userTag: any) => (
                  <div
                    key={userTag.tag.id}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-white"
                    style={{ backgroundColor: userTag.tag.color || "#3b82f6" }}
                  >
                    <span>{userTag.tag.name}</span>
                    <button
                      onClick={() => handleRemoveTag(userTag.tag.id)}
                      disabled={isLoading}
                      className="hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags assigned</p>
            )}
          </div>

          {unassignedTags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Add Tag</h4>
              <div className="flex flex-wrap gap-2">
                {unassignedTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    disabled={isLoading}
                    className="px-2 py-1 text-xs font-medium rounded-md border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-3 w-3 inline mr-1" />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

