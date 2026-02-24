import { notFound } from 'next/navigation'
import { BookingFlowClient } from './booking-flow-client'
import { supabase } from '@/lib/supabase'

// Required for static export with dynamic routes
export async function generateStaticParams() {
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id')
  
  return (clinics || []).map((clinic) => ({
    'clinic-id': clinic.id,
  }))
}

interface BookPageProps {
  params: Promise<{
    'clinic-id': string
  }>
}

export default async function BookPage({ params }: BookPageProps) {
  const { 'clinic-id': clinicId } = await params
  
  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .single()

  if (!clinic || clinic.status !== 'open') {
    notFound()
  }

  // Check available spots
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .in('payment_status', ['deposit_paid', 'fully_paid', 'pending'])

  const spotsRemaining = clinic.capacity - (count || 0)

  return <BookingFlowClient clinic={clinic} spotsRemaining={spotsRemaining} />
}
