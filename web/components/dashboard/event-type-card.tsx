"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ExternalLink, Clock, Video, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface EventTypeCardProps {
  id: string
  title: string
  slug: string
  duration: number
  locationType: string
  identifier: string // Can be username or organization slug
}

export function EventTypeCard({ id, title, slug, duration, locationType, identifier }: EventTypeCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/event-types/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({ message: "Failed to delete event type" }))
        alert(data.message || "Failed to delete event type")
      }
    } catch (error) {
      console.error("Error deleting event type:", error)
      alert("An error occurred while deleting the event type")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>/{identifier}/{slug}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Clock className="h-4 w-4" /> {duration} mins
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Video className="h-4 w-4" /> {locationType}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between items-center">
        <Link href={`/${identifier}/${slug}`} target="_blank" className="text-sm font-medium text-primary flex items-center hover:underline">
          <ExternalLink className="mr-1 h-3 w-3" /> Preview
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/event-types/${id}`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the event type "{title}". This action cannot be undone.
                  All future bookings for this event type will be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  )
}
