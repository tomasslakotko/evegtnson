import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface BookingEmailData {
  attendeeName: string
  attendeeEmail: string
  eventTitle: string
  startTime: Date
  endTime: Date
  hostName: string
  meetingUrl?: string | null
  locationType?: string
  notes?: string | null
  icalUrl?: string
  bookingId?: string
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email")
    return
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Moscow",
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const locationText = data.locationType === "mirotalk" 
    ? "MiroTalk Video" 
    : data.locationType?.replace("_", " ") || "Online"

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
    
    await resend.emails.send({
      from: fromEmail,
      to: data.attendeeEmail,
      subject: `Подтверждение бронирования: ${data.eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Ваша встреча подтверждена!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Здравствуйте, <strong>${data.attendeeName}</strong>!</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Ваша встреча "<strong>${data.eventTitle}</strong>" была успешно забронирована.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h2 style="margin-top: 0; color: #667eea;">Детали встречи</h2>
              <p style="margin: 10px 0;"><strong>📅 Дата и время:</strong> ${formatDate(data.startTime)}</p>
              <p style="margin: 10px 0;"><strong>⏰ Время:</strong> ${formatTime(data.startTime)} - ${formatTime(data.endTime)}</p>
              <p style="margin: 10px 0;"><strong>👤 Хост:</strong> ${data.hostName}</p>
              <p style="margin: 10px 0;"><strong>📍 Место:</strong> ${locationText}</p>
              ${data.notes ? `<p style="margin: 10px 0;"><strong>📝 Примечания:</strong> ${data.notes}</p>` : ""}
            </div>
            
            ${data.meetingUrl ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.meetingUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                  🔗 Присоединиться к встрече
                </a>
              </div>
            ` : ""}
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${data.icalUrl || '#'}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px;">
                📅 Добавить в календарь
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Если у вас возникли вопросы или вам нужно изменить время встречи, пожалуйста, свяжитесь с нами.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error("Error sending confirmation email:", error)
    // Don't throw - email failure shouldn't break booking creation
  }
}

export async function sendBookingUpdateEmail(data: BookingEmailData, updateType: "rescheduled" | "updated" | "cancelled") {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email")
    return
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Moscow",
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const locationText = data.locationType === "mirotalk" 
    ? "MiroTalk Video" 
    : data.locationType?.replace("_", " ") || "Online"

  const subjectMap = {
    rescheduled: "Изменение времени встречи",
    updated: "Обновление информации о встрече",
    cancelled: "Отмена встречи",
  }

  const titleMap = {
    rescheduled: "Время встречи было изменено",
    updated: "Информация о встрече была обновлена",
    cancelled: "Встреча была отменена",
  }

  const colorMap = {
    rescheduled: "#f59e0b",
    updated: "#3b82f6",
    cancelled: "#ef4444",
  }

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
    
    await resend.emails.send({
      from: fromEmail,
      to: data.attendeeEmail,
      subject: `${subjectMap[updateType]}: ${data.eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${colorMap[updateType]} 0%, ${colorMap[updateType]}dd 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${titleMap[updateType]}</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Здравствуйте, <strong>${data.attendeeName}</strong>!</p>
            
            ${updateType === "cancelled" ? `
              <p style="font-size: 16px; margin-bottom: 20px;">К сожалению, встреча "<strong>${data.eventTitle}</strong>" была отменена.</p>
            ` : `
              <p style="font-size: 16px; margin-bottom: 20px;">Информация о вашей встрече "<strong>${data.eventTitle}</strong>" была обновлена.</p>
            `}
            
            ${updateType !== "cancelled" ? `
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${colorMap[updateType]};">
                <h2 style="margin-top: 0; color: ${colorMap[updateType]};">Актуальные детали встречи</h2>
                <p style="margin: 10px 0;"><strong>📅 Дата и время:</strong> ${formatDate(data.startTime)}</p>
                <p style="margin: 10px 0;"><strong>⏰ Время:</strong> ${formatTime(data.startTime)} - ${formatTime(data.endTime)}</p>
                <p style="margin: 10px 0;"><strong>👤 Хост:</strong> ${data.hostName}</p>
                <p style="margin: 10px 0;"><strong>📍 Место:</strong> ${locationText}</p>
                ${data.notes ? `<p style="margin: 10px 0;"><strong>📝 Примечания:</strong> ${data.notes}</p>` : ""}
              </div>
              
              ${data.meetingUrl ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${data.meetingUrl}" style="background: ${colorMap[updateType]}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                    🔗 Присоединиться к встрече
                  </a>
                </div>
              ` : ""}
              
              ${data.icalUrl ? `
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${data.icalUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px;">
                    📅 Обновить в календаре
                  </a>
                </div>
              ` : ""}
            ` : ""}
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              ${updateType === "cancelled" 
                ? "Если у вас есть вопросы, пожалуйста, свяжитесь с нами." 
                : "Если у вас возникли вопросы или вам нужно изменить время встречи, пожалуйста, свяжитесь с нами."}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error(`Error sending ${updateType} email:`, error)
    // Don't throw - email failure shouldn't break booking updates
  }
}

export async function sendMeetingLinkEmail(data: BookingEmailData & { icalUrl?: string }) {
  if (!process.env.RESEND_API_KEY || !data.meetingUrl) {
    console.warn("RESEND_API_KEY not set or no meeting URL, skipping email")
    return
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Moscow",
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
    
    await resend.emails.send({
      from: fromEmail,
      to: data.attendeeEmail,
      subject: `Ссылка на встречу: ${data.eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Ссылка на встречу готова!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">Здравствуйте, <strong>${data.attendeeName}</strong>!</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Для вашей встречи "<strong>${data.eventTitle}</strong>" была создана ссылка для подключения.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 10px 0;"><strong>📅 Дата и время:</strong> ${formatDate(data.startTime)}</p>
              <p style="margin: 10px 0;"><strong>⏰ Время:</strong> ${formatTime(data.startTime)} - ${formatTime(data.endTime)}</p>
              <p style="margin: 10px 0;"><strong>👤 Хост:</strong> ${data.hostName}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.meetingUrl}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                🔗 Присоединиться к встрече
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Или скопируйте ссылку: <br>
              <a href="${data.meetingUrl}" style="color: #10b981; word-break: break-all;">${data.meetingUrl}</a>
            </p>
            
            ${data.icalUrl ? `
              <div style="text-align: center; margin: 20px 0;">
                <a href="${data.icalUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px;">
                  📅 Добавить в календарь
                </a>
              </div>
            ` : ""}
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error("Error sending meeting link email:", error)
    // Don't throw - email failure shouldn't break booking updates
  }
}

