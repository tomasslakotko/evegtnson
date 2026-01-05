import { ScheduleEditor } from "@/components/dashboard/schedule-editor"

export default function AvailabilityPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Availability</h1>
                <p className="text-muted-foreground">Manage your working hours here.</p>
            </div>
            
            <ScheduleEditor />
        </div>
    )
}

