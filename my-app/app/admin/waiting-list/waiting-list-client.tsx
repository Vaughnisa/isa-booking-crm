'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Clock, Mail, Phone, UserPlus, ArrowRight, CheckCircle } from 'lucide-react'
import { formatDate, getExperienceLevelColor } from '@/lib/utils'
import { WaitingListEntry, Clinic } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface WaitingListClientProps {
  entries: WaitingListEntry[]
  clinics: Clinic[]
}

export function WaitingListClient({ entries: initialEntries, clinics }: WaitingListClientProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null)
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false)

  const promoteToBooking = async () => {
    if (!selectedEntry) return

    // 1. Create or get client
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', selectedEntry.email)
      .single()

    let clientId = existingClient?.id

    if (!clientId) {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({
          name: selectedEntry.name,
          email: selectedEntry.email,
          phone: selectedEntry.phone,
          experience_level: selectedEntry.experience_level,
        })
        .select()
        .single()
      
      clientId = newClient?.id
    }

    if (!clientId) return

    // 2. Create booking
    const { data: booking } = await supabase
      .from('bookings')
      .insert({
        clinic_id: selectedEntry.clinic_id,
        client_id: clientId,
        payment_status: 'pending',
      })
      .select()
      .single()

    if (booking) {
      // 3. Update waiting list entry
      await supabase
        .from('waiting_list')
        .update({
          status: 'converted',
          converted_to_booking_id: booking.id,
          notified_at: new Date().toISOString(),
        })
        .eq('id', selectedEntry.id)

      // 4. Update local state
      setEntries(entries.filter((e) => e.id !== selectedEntry.id))
      setIsPromoteDialogOpen(false)
    }
  }

  const addToWaitlist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const { data } = await supabase
      .from('waiting_list')
      .insert({
        clinic_id: formData.get('clinic_id') as string,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        experience_level: formData.get('experience_level') as any,
        notes: formData.get('notes') as string,
      })
      .select('*, clinic:clinics(*)')
      .single()

    if (data) {
      setEntries([...entries, data])
      e.currentTarget.reset()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Waiting List</h1>
        <p className="text-muted-foreground">Manage people waiting for sold-out clinics.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Waitlist
            </CardTitle>
            <CardDescription>{entries.length} people waiting</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Waiting Since</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No one on the waiting list.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {entry.email}
                          </div>
                          {entry.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {entry.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.clinic?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.clinic?.date && formatDate(entry.clinic.date)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.experience_level && (
                          <Badge className={getExperienceLevelColor(entry.experience_level)}>
                            {entry.experience_level}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(entry.requested_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedEntry(entry)
                            setIsPromoteDialogOpen(true)
                          }}
                        >
                          <ArrowRight className="mr-1 h-4 w-4" />
                          Promote
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add to Waitlist
            </CardTitle>
            <CardDescription>Manually add someone to a clinic waitlist.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addToWaitlist} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="clinic">Clinic</Label>
                <Select name="clinic_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.title} - {formatDate(clinic.date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="experience_level">Experience</Label>
                  <Select name="experience_level">
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full">Add to Waitlist</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to Booking</DialogTitle>
            <DialogDescription>
              This will create a booking for {selectedEntry?.name} and send them a payment link.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="py-4 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Client: </span>
                  <span className="font-medium">{selectedEntry.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-medium">{selectedEntry.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Clinic: </span>
                  <span className="font-medium">{selectedEntry.clinic?.title}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date: </span>
                  <span className="font-medium">
                    {selectedEntry.clinic?.date && formatDate(selectedEntry.clinic.date)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={promoteToBooking}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
