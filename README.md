# BookTheCall

A modern booking system similar to Cal.com, built with Next.js, TypeScript, and Prisma.

## Features

- ✅ Event type management
- ✅ Booking system with calendar integration
- ✅ Team/organization support
- ✅ Google Calendar integration
- ✅ Email notifications (Resend)
- ✅ Subscription plans (Free, Pro, Team)
- ✅ Embeddable booking widget
- ✅ iCal file generation
- ✅ Timezone support
- ✅ System admin panel

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma)
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS + Shadcn UI
- **Email**: Resend
- **Calendar**: Google Calendar API

## Getting Started

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

## Environment Variables

Required environment variables:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3001"
RESEND_API_KEY="re_..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

## Documentation

- [Database Setup](./web/DATABASE_SETUP.md)
- [Email Setup](./web/EMAIL_SETUP.md)
- [Google Calendar Setup](./web/GOOGLE_CALENDAR_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)

## License

MIT

