import { BookingWidget } from "@/components/widget/booking-widget"

interface WidgetPageProps {
  params: Promise<{ identifier: string; slug: string }>
}

export default async function WidgetPage(props: WidgetPageProps) {
  const params = await props.params
  const { identifier, slug } = params

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <BookingWidget identifier={identifier} slug={slug} />
    </div>
  )
}

