import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { triggerWebhook } from '@/lib/webhooks'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinicId,
      name,
      email,
      phone,
      emergencyName,
      emergencyPhone,
      experienceLevel,
      weight,
      height,
      sailSize,
      sailingGoals,
      equipmentOption,
      boatDetails,
      dietaryRestrictions,
    } = body

    // Get clinic details
    const { data: clinic } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single()

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    // Check availability
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .in('payment_status', ['deposit_paid', 'fully_paid', 'pending'])

    if ((count || 0) >= clinic.capacity) {
      return NextResponse.json({ error: 'Clinic is full' }, { status: 400 })
    }

    // Create or get existing client
    let { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .single()

    let clientId = existingClient?.id

    if (!clientId) {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          name,
          email,
          phone,
          emergency_contact_name: emergencyName,
          emergency_contact_phone: emergencyPhone,
          experience_level: experienceLevel,
          weight: weight ? parseInt(weight) : null,
          height,
          sail_size_preference: sailSize,
          equipment_needs: equipmentOption === 'charter' ? 'Charter boat' : 'Bring own boat',
          bring_own_boat: equipmentOption === 'own',
          boat_details: boatDetails,
        })
        .select()
        .single()

      if (clientError) {
        return NextResponse.json({ error: clientError.message }, { status: 500 })
      }

      clientId = newClient.id
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        clinic_id: clinicId,
        client_id: clientId,
        payment_status: 'pending',
        deposit_amount: clinic.deposit_amount,
        total_price: clinic.price,
        balance_due: clinic.price - clinic.deposit_amount,
        sailing_goals: sailingGoals,
        dietary_restrictions: dietaryRestrictions,
      })
      .select()
      .single()

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 500 })
    }

    // Create Stripe Checkout Session
    const origin = request.headers.get('origin') || 'http://localhost:3000'
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${clinic.title} - Deposit`,
              description: `Deposit for ${clinic.title} on ${clinic.date}`,
            },
            unit_amount: clinic.deposit_amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/book/success?booking_id=${booking.id}`,
      cancel_url: `${origin}/book/${clinicId}?canceled=true`,
      metadata: {
        booking_id: booking.id,
        clinic_id: clinicId,
        client_id: clientId,
      },
    })

    // Update booking with session ID
    await supabase
      .from('bookings')
      .update({ stripe_session_id: session.id })
      .eq('id', booking.id)

    return NextResponse.json({
      bookingId: booking.id,
      checkoutUrl: session.url,
    })
  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
