import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "€0",
    features: ["1 Event Type", "Google Calendar", "Unlimited Bookings"],
  },
  {
    name: "Pro",
    price: "€12",
    features: ["Unlimited Event Types", "Teams & Outlook", "Stripe Payments", "Custom Branding"],
    highlight: true,
  },
  {
    name: "Team",
    price: "€29",
    features: ["All Pro features", "Admin Dashboard", "Team Scheduling", "Priority Support"],
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Simple pricing</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`p-8 rounded-xl border ${plan.highlight ? 'border-primary shadow-lg' : 'border-border'}`}>
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold mb-6">{plan.price}<span className="text-base font-normal text-muted-foreground">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>Choose {plan.name}</Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

