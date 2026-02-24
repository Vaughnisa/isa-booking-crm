import { DashboardClient } from './dashboard-client'
import { supabase } from '@/lib/supabase'
import { DashboardStats } from '@/lib/types'

async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  
  // Get total revenue from paid bookings
  const { data: revenueData } = await supabase
    .from('bookings')
    .select('deposit_amount, total_price')
    .in('payment_status', ['deposit_paid', 'fully_paid'])
  
  const totalRevenue = revenueData?.reduce((sum, b) => {
    return sum + (b.deposit_amount || 0) + ((b.total_price || 0) - (b.deposit_amount || 0))
  }, 0) || 0
  
  // Get bookings this month
  const { count: bookingsThisMonth } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth)
  
  // Get outstanding balances
  const { data: balanceData } = await supabase
    .from('bookings')
    .select('balance_due')
    .eq('payment_status', 'deposit_paid')
  
  const outstandingBalance = balanceData?.reduce((sum, b) => sum + (b.balance_due || 0), 0) || 0
  
  // Get upcoming clinics
  const { count: upcomingClinics } = await supabase
    .from('clinics')
    .select('*', { count: 'exact', head: true })
    .gte('date', now.toISOString().split('T')[0])
    .eq('status', 'open')
  
  return {
    totalRevenue,
    bookingsThisMonth: bookingsThisMonth || 0,
    outstandingBalance,
    upcomingClinics: upcomingClinics || 0,
  }
}

async function getUpcomingClinics() {
  const { data } = await supabase
    .from('clinics')
    .select(`
      *,
      bookings:bookings(count)
    `)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(5)
  
  return data?.map(clinic => ({
    ...clinic,
    bookings_count: clinic.bookings?.[0]?.count || 0,
  })) || []
}

async function getRecentBookings() {
  const { data } = await supabase
    .from('bookings')
    .select(`
      *,
      clinic:clinics(title, date),
      client:clients(name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(10)
  
  return data || []
}

export default async function AdminDashboard() {
  const [stats, clinics, bookings] = await Promise.all([
    getDashboardStats(),
    getUpcomingClinics(),
    getRecentBookings(),
  ])
  
  return <DashboardClient stats={stats} clinics={clinics} bookings={bookings} />
}
