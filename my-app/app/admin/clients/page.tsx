import { ClientsClient } from './clients-client'
import { supabase } from '@/lib/supabase'

async function getClients() {
  const { data } = await supabase
    .from('clients')
    .select(`
      *,
      bookings:bookings(count)
    `)
    .order('created_at', { ascending: false })
  
  return data?.map(client => ({
    ...client,
    bookings_count: client.bookings?.[0]?.count || 0,
  })) || []
}

export default async function ClientsPage() {
  const clients = await getClients()
  return <ClientsClient clients={clients} />
}
