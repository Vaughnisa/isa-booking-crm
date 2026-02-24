'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, ExternalLink, Edit, Users } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Clinic } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface ClinicsClientProps {
  clinics: Clinic[]
}

export function ClinicsClient({ clinics: initialClinics }: ClinicsClientProps) {
  const [clinics, setClinics] = useState(initialClinics)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const filteredClinics = clinics.filter(clinic =>
    clinic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.coach?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleStatus = async (clinic: Clinic) => {
    const newStatus = clinic.status === 'open' ? 'closed' : 'open'
    
    const { error } = await supabase
      .from('clinics')
      .update({ status: newStatus })
      .eq('id', clinic.id)

    if (!error) {
      setClinics(clinics.map(c =>
        c.id === clinic.id ? { ...c, status: newStatus } : c
      ))
    }
  }

  const saveClinic = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingClinic) return

    const { error } = await supabase
      .from('clinics')
      .update({
        title: editingClinic.title,
        coach: editingClinic.coach,
        capacity: editingClinic.capacity,
        price: editingClinic.price,
      })
      .eq('id', editingClinic.id)

    if (!error) {
      setClinics(clinics.map(c =>
        c.id === editingClinic.id ? editingClinic : c
      ))
      setIsEditDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clinic Management</h1>
          <p className="text-muted-foreground">Manage your sailing clinics and capacity.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Clinic
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clinics..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clinic</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClinics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No clinics found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClinics.map((clinic) => {
                  const spotsRemaining = clinic.capacity - (clinic.bookings_count || 0)
                  return (
                    <TableRow key={clinic.id}>
                      <TableCell>
                        <div className="font-medium">{clinic.title}</div>
                        <div className="text-sm text-muted-foreground">{clinic.location}</div>
                      </TableCell>
                      <TableCell>{formatDate(clinic.date)}</TableCell>
                      <TableCell>{clinic.coach || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {clinic.bookings_count || 0} / {clinic.capacity}
                          </span>
                          {spotsRemaining <= 2 && spotsRemaining > 0 && (
                            <Badge variant="destructive" className="text-xs">Low</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(clinic.price)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={clinic.status === 'open'}
                            onCheckedChange={() => toggleStatus(clinic)}
                          />
                          <Badge className={getStatusColor(clinic.status)}>
                            {clinic.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingClinic(clinic)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/book/${clinic.id}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Clinic</DialogTitle>
            <DialogDescription>
              Update clinic details. Changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>
          {editingClinic && (
            <form onSubmit={saveClinic}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editingClinic.title}
                    onChange={(e) => setEditingClinic({ ...editingClinic, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="coach">Coach</Label>
                  <Input
                    id="coach"
                    value={editingClinic.coach || ''}
                    onChange={(e) => setEditingClinic({ ...editingClinic, coach: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={editingClinic.capacity}
                      onChange={(e) => setEditingClinic({ ...editingClinic, capacity: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (cents)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={editingClinic.price}
                      onChange={(e) => setEditingClinic({ ...editingClinic, price: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
