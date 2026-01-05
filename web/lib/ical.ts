import ical from 'ical-generator'

interface BookingICalData {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  meetingUrl?: string | null
  attendeeName: string
  attendeeEmail: string
  hostName: string
  hostEmail?: string
}

export function generateICalFile(data: BookingICalData): string {
  const calendar = ical({ name: 'Book the Call - Meeting' })

  const description = [
    data.description || `Meeting with ${data.hostName}`,
    data.meetingUrl ? `Meeting Link: ${data.meetingUrl}` : '',
    `Attendee: ${data.attendeeName} (${data.attendeeEmail})`,
  ].filter(Boolean).join('\n\n')

  const location = data.meetingUrl || data.location || 'Online'

  const event = calendar.createEvent({
    start: data.startTime,
    end: data.endTime,
    summary: data.title,
    description: description,
    location: location,
    url: data.meetingUrl || undefined,
    organizer: {
      name: data.hostName,
      email: data.hostEmail || 'noreply@bookthecall.com',
    },
    attendees: [
      {
        name: data.attendeeName,
        email: data.attendeeEmail,
        rsvp: true,
        status: 'ACCEPTED',
      },
    ],
    status: 'CONFIRMED',
    busystatus: 'BUSY',
    method: 'REQUEST',
  })

  return calendar.toString()
}

export function getICalDownloadUrl(bookingId: string): string {
  return `/api/bookings/${bookingId}/ical`
}

