import { HelpCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar, Clock, Users, Settings, Link as LinkIcon, Mail, Video } from "lucide-react"

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-8 w-8" />
          Help & Documentation
        </h1>
        <p className="text-muted-foreground mt-2">
          Complete guide to using BookTheCall
        </p>
      </div>

      <Tabs defaultValue="basics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Basics */}
        <TabsContent value="basics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Creating Event Types
              </CardTitle>
              <CardDescription>How to create a new meeting type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Step 1: Go to Event Types</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  In the main menu, select "Event Types" or go to the dashboard home page.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Step 2: Create a new event type</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Click the "New Event Type" button in the top right corner.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Step 3: Fill in the information</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Title</strong> - the name of the meeting type (e.g., "Consultation", "Interview")</li>
                  <li><strong>Description</strong> - description of the meeting for clients</li>
                  <li><strong>Duration</strong> - meeting duration in minutes</li>
                  <li><strong>Meeting Type</strong> - choose how the meeting will be conducted:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Google Meet - video call via Google Meet</li>
                      <li>Teams - video call via Microsoft Teams</li>
                      <li>Phone - phone call</li>
                      <li>MiroTalk - video call via MiroTalk P2P</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Step 4: Assign hosts (for teams)</h3>
                <p className="text-sm text-muted-foreground">
                  If you work in a team, select team members who can conduct this type of meeting.
                </p>
              </div>

              <Alert>
                <AlertTitle>Tip</AlertTitle>
                <AlertDescription>
                  After creating, you'll receive a unique booking link. Share this link with clients so they can book a meeting.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Public Booking Link
              </CardTitle>
              <CardDescription>How to share your booking link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Where to find the link?</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  After creating an event type, you'll see a card with information. At the bottom of the card is the public booking link.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Link format</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  The link looks like this:
                </p>
                <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-sm">
                  <code>https://yourdomain.com/booking/username/event-slug</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How to use</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Copy the link and send it to the client via email or message</li>
                  <li>Place the link on your website</li>
                  <li>Add the link to your email signature</li>
                  <li>Use the widget to embed on your website</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Embeddable Widget
              </CardTitle>
              <CardDescription>How to embed the booking form on your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Getting the widget code</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  In the event type card, find the "Embed" button. Click it to get the embed code.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Using iframe</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Insert the following code on your page:
                </p>
                <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-sm overflow-x-auto">
                  <code>{`<iframe 
  src="https://yourdomain.com/booking/username/event-slug" 
  width="100%" 
  height="600" 
  frameborder="0"
></iframe>`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking */}
        <TabsContent value="booking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                How to Book a Meeting
              </CardTitle>
              <CardDescription>Instructions for clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Step 1: Open the booking link</h3>
                <p className="text-sm text-muted-foreground">
                  Go to the link provided by the meeting organizer.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Step 2: Select date and time</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>The calendar shows available dates (highlighted in gray)</li>
                  <li>Unavailable dates are inactive and cannot be selected</li>
                  <li>Choose a convenient date</li>
                  <li>Select an available time from the list</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Step 3: Fill in your information</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Name</strong> - your name</li>
                  <li><strong>Email</strong> - your email address (required)</li>
                  <li><strong>Phone</strong> - your phone number (if "Phone" meeting type is selected)</li>
                  <li><strong>Notes</strong> - additional information for the organizer</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Step 4: Select timezone</h3>
                <p className="text-sm text-muted-foreground">
                  By default, "Riga (EET)" timezone is used. You can change it if you're in a different timezone.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Step 5: Confirm booking</h3>
                <p className="text-sm text-muted-foreground">
                  Click the "Book" button. You'll receive a confirmation email with meeting details.
                </p>
              </div>

              <Alert>
                <AlertTitle>After Booking</AlertTitle>
                <AlertDescription>
                  You'll receive a confirmation email that includes:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Date and time of the meeting</li>
                    <li>Join link (if video call)</li>
                    <li>"Add to Calendar" button</li>
                    <li>Organizer information</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Managing Bookings</CardTitle>
              <CardDescription>How to view and manage your bookings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Viewing bookings</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Go to the "Bookings" section in the main menu. Here you'll see all your bookings:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Upcoming meetings</li>
                  <li>Past meetings</li>
                  <li>Cancelled meetings</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Booking actions</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  For each booking, the following actions are available:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Reschedule</strong> - change the date and time of the meeting</li>
                  <li><strong>Edit</strong> - modify meeting information</li>
                  <li><strong>Cancel</strong> - cancel the meeting</li>
                  <li><strong>Assign Link</strong> - add or change the meeting link</li>
                  <li><strong>Approve/Decline</strong> - for bookings requiring confirmation</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Calendar</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  In the "Calendar" section, you can view all your meetings in calendar format:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>View by days and weeks</li>
                  <li>Filter by team members</li>
                  <li>Create blocked time</li>
                  <li>View meeting details on click</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Blocking time</h3>
                <p className="text-sm text-muted-foreground">
                  In the calendar, you can click on an available time slot and create "Blocked Time". This will block the time from public booking but won't create an event in Google Calendar.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Working with Teams
              </CardTitle>
              <CardDescription>Managing teams and organizations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Creating an organization</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  When registering, you can choose "Corporate (Enterprise)" to create an organization. As the organization owner, you can:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Invite team members</li>
                  <li>Manage roles (admin, member)</li>
                  <li>Create tags to organize the team</li>
                  <li>Assign hosts for event types</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Inviting team members</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to the "Team" section</li>
                  <li>Click "Invite Member"</li>
                  <li>Enter the user's email address</li>
                  <li>Select a role:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><strong>Admin</strong> - can manage the team and bookings</li>
                      <li><strong>Member</strong> - regular team member</li>
                    </ul>
                  </li>
                  <li>The user will receive an invitation via email</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Tags help organize your team. You can:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Create tags with names and colors</li>
                  <li>Assign tags to team members</li>
                  <li>Use tags for filtering and organization</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Assigning hosts</h3>
                <p className="text-sm text-muted-foreground">
                  When creating an event type, you can select multiple hosts from your team. Clients will be able to book a meeting with any of the assigned hosts.
                </p>
              </div>

              <Alert>
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  The booking URL for organizations uses the organization name (slug) instead of the username.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>Personal settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Basic Information</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Username</strong> - used in the booking URL</li>
                  <li><strong>Name</strong> - your display name</li>
                  <li><strong>Bio</strong> - brief description about you</li>
                  <li><strong>Avatar</strong> - your profile photo</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Availability</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  In the "Availability" section, you can set your working hours:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Set working hours for each day of the week</li>
                  <li>Configure separate schedules for each team member</li>
                  <li>The system automatically considers your schedule when showing available slots</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Calendar Integration</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  In the "Calendar Integrations" section, you can connect:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Google Calendar</strong> - sync with Google Calendar</li>
                  <li>Automatic event creation when booking</li>
                  <li>Check availability from calendar</li>
                  <li>Update events when bookings change</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <Badge variant="secondary" className="mr-2">Requires</Badge> Pro or Team plan
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Subscription</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  In the "Subscription" section, you can:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>View your current subscription plan</li>
                  <li>See available features and limits</li>
                  <li>Contact an administrator to change your plan</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Available plans and their features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Free</h3>
                  <Badge variant="secondary">Free</Badge>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>1 event type</li>
                  <li>5 bookings per month</li>
                  <li>1 team member</li>
                  <li>Email notifications</li>
                  <li>Basic calendar</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4 border-primary">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Pro</h3>
                  <Badge>€12/month</Badge>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Unlimited event types</li>
                  <li>Unlimited bookings</li>
                  <li>Individual account</li>
                  <li>Google Calendar integration</li>
                  <li>Custom branding</li>
                  <li>Email and SMS notifications</li>
                  <li>Priority support</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Team</h3>
                  <Badge>€29/month</Badge>
                </div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>All Pro features</li>
                  <li>Unlimited team members</li>
                  <li>Admin dashboard</li>
                  <li>Advanced analytics</li>
                  <li>API access</li>
                  <li>Dedicated support</li>
                </ul>
              </div>

              <Alert>
                <AlertTitle>Changing Plans</AlertTitle>
                <AlertDescription>
                  To change your subscription plan, contact a system administrator through the "Subscription" section.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
