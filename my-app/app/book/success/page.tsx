import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, MapPin, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface SuccessPageProps {
  searchParams: Promise<{
    booking_id?: string
  }>
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams
  const bookingId = params.booking_id

  let booking = null
  if (bookingId) {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        clinic:clinics(*),
        client:clients(*)
      `)
      .eq('id', bookingId)
      .single()
    booking = data
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you! Your deposit has been received and your spot is secured.
          </p>
        </div>

        {booking && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="pb-4 border-b">
                  <p className="text-sm text-muted-foreground mb-1">Clinic</p>
                  <p className="font-semibold text-lg">{booking.clinic?.title}</p>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{booking.clinic?.date && formatDate(booking.clinic.date)}</p>
                    <p className="text-sm text-muted-foreground">{booking.clinic?.coach}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{booking.clinic?.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span>Deposit Paid</span>
                      <span className="font-medium">{formatCurrency(booking.deposit_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Balance Due</span>
                      <span>{formatCurrency(booking.balance_due || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">What's Next?</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Check your email for confirmation</li>
                    <li>• Sign waiver before arrival</li>
                    <li>• Balance due 30 days before clinic</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/">Return to Website</Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin">Go to Admin Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
