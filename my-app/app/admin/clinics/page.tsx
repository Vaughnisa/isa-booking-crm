import { ClinicsClient } from './clinics-client'
import { supabase } from '@/lib/supabase'

async function getClinics() {
  const { data } = await supabase
    .from('clinics')
    .select(`
      *,
      bookings:bookings(count)
    `)
    .order('date', { ascending: true })
  
  return data?.map(clinic => ({
    ...clinic,
    bookings_count: clinic.bookings?.[0]?.count || 0,
  })) || []
}

export default async function ClinicsPage() {
  const clinics = await getClinics()
  return <ClinicsClient clinics={clinics} />
}
