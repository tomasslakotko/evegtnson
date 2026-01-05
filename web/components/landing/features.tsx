import { Calendar, Video, CreditCard, Users } from "lucide-react"

const features = [
  {
    title: "Calendar Integration",
    description: "Connect your Google and Outlook calendars to avoid double bookings.",
    icon: Calendar,
  },
  {
    title: "Video Calls",
    description: "Seamless integration with Google Meet, Teams, and more.",
    icon: Video,
  },
  {
    title: "Payments",
    description: "Accept payments for your consultations via Stripe.",
    icon: CreditCard,
  },
  {
    title: "Teams",
    description: "Manage your entire team's availability in one dashboard.",
    icon: Users,
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

