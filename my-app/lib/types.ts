export interface Clinic {
  id: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  coach: string | null
  capacity: number
  price: number
  deposit_amount: number
  location: string
  description: string | null
  status: 'open' | 'closed' | 'cancelled'
  created_at: string
  updated_at: string
  bookings_count?: number
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'pro' | null
  weight: number | null
  height: string | null
  sail_size_preference: string | null
  equipment_needs: string | null
  bring_own_boat: boolean
  boat_details: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  clinic_id: string
  client_id: string
  payment_status: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded' | 'cancelled'
  deposit_amount: number
  total_price: number | null
  balance_due: number | null
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  sailing_goals: string | null
  dietary_restrictions: string | null
  waiver_signed: boolean
  waiver_signed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  clinic?: Clinic
  client?: Client
}

export interface WaitingListEntry {
  id: string
  clinic_id: string
  name: string
  email: string
  phone: string | null
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'pro' | null
  notes: string | null
  requested_at: string
  notified_at: string | null
  status: 'waiting' | 'converted' | 'expired'
  converted_to_booking_id: string | null
  created_at: string
  clinic?: Clinic
}

export interface DashboardStats {
  totalRevenue: number
  bookingsThisMonth: number
  outstandingBalance: number
  upcomingClinics: number
}
