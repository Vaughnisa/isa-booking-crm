import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { triggerWebhook } from '@/lib/webhooks'

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const bookingId = session.metadata?.booking_id

      if (bookingId) {
        // Update booking status
        const { data: booking } = await supabase
          .from('bookings')
          .update({
            payment_status: 'deposit_paid',
            stripe_payment_intent_id: session.payment_intent,
          })
          .eq('id', bookingId)
          .select()
          .single()

        // Trigger webhooks
        if (booking) {
          await triggerWebhook('booking.confirmed', bookingId)
          await triggerWebhook('payment.received', bookingId)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    )
  }
}
