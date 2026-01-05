"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScheduleEditor } from "@/components/dashboard/schedule-editor"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Clock } from "lucide-react"

interface ManageMemberAvailabilityProps {
  memberId: string
  memberName: string
  canManage: boolean
}

export function ManageMemberAvailability({ 
  memberId, 
  memberName, 
  canManage 
}: ManageMemberAvailabilityProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!canManage) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage {memberName}'s Availability</DialogTitle>
          <DialogDescription>
            Set working hours for this team member
          </DialogDescription>
        </DialogHeader>
        <ScheduleEditor userId={memberId} userName={memberName} />
      </DialogContent>
    </Dialog>
  )
}

