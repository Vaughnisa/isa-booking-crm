import { WaitingListClient } from './waiting-list-client'
import { supabase } from '@/lib/supabase'

async function getWaitingList() {
  const { data } = await supabase
    .from('waiting_list')
    .select(`
      *,
      clinic:clinics(id, title, date, capacity)
    `)
    .eq('status', 'waiting')
    .order('requested_at', { ascending: true })
  
  return data || []
}

async function getClinics() {
  const { data } = await supabase
    .from('clinics')
    .select('*')
    .eq('status', 'open')
    .order('date', { ascending: true })
  
  return data || []
}

export default async function WaitingListPage() {
  const [waitingList, clinics] = await Promise.all([
    getWaitingList(),
    getClinics(),
  ])
  
  return <WaitingListClient entries={waitingList} clinics={clinics} />
}
