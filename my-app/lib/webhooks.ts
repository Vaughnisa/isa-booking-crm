import { supabase } from '@/lib/supabase'

export interface WebhookPayload {
  event: 'booking.confirmed' | 'payment.received' | 'balance.due' | 'booking.cancelled'
  booking_id: string
  client: {
    name: string
    email: string
    phone?: string
  }
  clinic: {
    id: string
    title: string
    date: string
    coach?: string
  }
  payment: {
    deposit_paid: number
    balance_due: number
    balance_due_date?: string
  }
  timestamp: string
}

export async function triggerWebhook(
  event: WebhookPayload['event'],
  bookingId: string
): Promise<void> {
  try {
    // Get booking details with client and clinic info
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        client:clients(name, email, phone),
        clinic:clinics(id, title, date, coach, deposit_amount, price)
      `)
      .eq('id', bookingId)
      .single()

    if (!booking || !booking.client || !booking.clinic) {
      console.error('Booking not found for webhook:', bookingId)
      return
    }

    // Get active webhooks that subscribe to this event
    const { data: webhooks } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('is_active', true)
      .contains('events', [event])

    if (!webhooks || webhooks.length === 0) {
      return
    }

    // Calculate balance due date (30 days before clinic)
    const clinicDate = new Date(booking.clinic.date)
    const balanceDueDate = new Date(clinicDate)
    balanceDueDate.setDate(balanceDueDate.getDate() - 30)

    const payload: WebhookPayload = {
      event,
      booking_id: bookingId,
      client: {
        name: booking.client.name,
        email: booking.client.email,
        phone: booking.client.phone || undefined,
      },
      clinic: {
        id: booking.clinic.id,
        title: booking.clinic.title,
        date: booking.clinic.date,
        coach: booking.clinic.coach || undefined,
      },
      payment: {
        deposit_paid: booking.deposit_amount || booking.clinic.deposit_amount || 50000,
        balance_due: booking.balance_due || (booking.clinic.price - (booking.deposit_amount || 50000)),
        balance_due_date: balanceDueDate.toISOString().split('T')[0],
      },
      timestamp: new Date().toISOString(),
    }

    // Send to all subscribed webhooks
    await Promise.all(
      webhooks.map((webhook) =>
        deliverWebhook(webhook.id, webhook.url, webhook.secret, event, payload)
      )
    )
  } catch (error) {
    console.error('Error triggering webhook:', error)
  }
}

async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string | null,
  event: string,
  payload: WebhookPayload
): Promise<void> {
  const startTime = Date.now()
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (secret) {
      headers['X-Webhook-Secret'] = secret
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    const responseBody = await response.text()

    // Log the delivery
    await supabase.from('webhook_logs').insert({
      webhook_id: webhookId,
      event,
      payload,
      response_status: response.status,
      response_body: responseBody.slice(0, 1000), // Limit size
      delivered_at: new Date().toISOString(),
    })

    if (!response.ok) {
      console.error(`Webhook delivery failed: ${response.status} - ${responseBody}`)
    }
  } catch (error) {
    // Log the failure
    await supabase.from('webhook_logs').insert({
      webhook_id: webhookId,
      event,
      payload,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      delivered_at: new Date().toISOString(),
    })
    
    console.error('Webhook delivery error:', error)
  }
}

// Trigger balance due reminders (would be called by a cron job)
export async function triggerBalanceDueReminders(): Promise<void> {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('payment_status', 'deposit_paid')
    .gte('clinic.date', new Date().toISOString())
    .lte('clinic.date', thirtyDaysFromNow.toISOString())

  if (bookings) {
    for (const booking of bookings) {
      await triggerWebhook('balance.due', booking.id)
    }
  }
}
