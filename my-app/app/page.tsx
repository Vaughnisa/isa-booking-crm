import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Anchor, Calendar, Users, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

async function getUpcomingClinics() {
  const { data } = await supabase
    .from('clinics')
    .select(`
      *,
      bookings:bookings(count)
    `)
    .eq('status', 'open')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(3)

  return data?.map((clinic) => ({
    ...clinic,
    bookings_count: clinic.bookings?.[0]?.count || 0,
  })) || []
}

export default async function HomePage() {
  const clinics = await getUpcomingClinics()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Anchor className="h-12 w-12" />
            <h1 className="text-4xl md:text-5xl font-bold">International Sailing Academy</h1>
          </div>
          <p className="text-xl md:text-2xl opacity-90 mb-8">
            World-class sailing clinics in La Cruz, Mexico
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="#clinics">View Upcoming Clinics</Link>
          </Button>
        </div>
      </section>

      {/* Upcoming Clinics */}
      <section id="clinics" className="py-16 px-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Upcoming Clinics</h2>
            <p className="text-muted-foreground">Book your spot today</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">Admin Login</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic) => {
            const spotsRemaining = clinic.capacity - (clinic.bookings_count || 0)
            return (
              <Card key={clinic.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{clinic.title}</CardTitle>
                  <CardDescription>{clinic.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(clinic.date)}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {spotsRemaining} spots remaining
                    </div>
                  </div>

                  <Button asChild className="w-full">
                    <Link href={`/book/${clinic.id}`}>
                      Book Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {clinics.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No upcoming clinics at the moment.</p>
            <p className="text-sm">Check back soon for new dates!</p>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="bg-muted py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose ISA?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Anchor className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Expert Coaches</h3>
              <p className="text-sm text-muted-foreground">Learn from world-class sailors with decades of experience.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Perfect Conditions</h3>
              <p className="text-sm text-muted-foreground">Consistent winds and warm waters in beautiful La Cruz.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Small Groups</h3>
              <p className="text-sm text-muted-foreground">Personalized attention with limited group sizes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-muted-foreground text-sm">
        <p>© 2025 International Sailing Academy. All rights reserved.</p>
      </footer>
    </div>
  )
}
