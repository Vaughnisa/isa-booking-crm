'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
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
import { Search, Mail, Phone, Anchor, User, Save } from 'lucide-react'
import { formatDate, getExperienceLevelColor } from '@/lib/utils'
import { Client } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface ClientsClientProps {
  clients: (Client & { bookings_count?: number })[]
}

export function ClientsClient({ clients: initialClients }: ClientsClientProps) {
  const [clients, setClients] = useState(initialClients)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const saveClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedClient) return

    const { error } = await supabase
      .from('clients')
      .update({
        name: selectedClient.name,
        email: selectedClient.email,
        phone: selectedClient.phone,
        experience_level: selectedClient.experience_level,
        weight: selectedClient.weight,
        sail_size_preference: selectedClient.sail_size_preference,
        notes: selectedClient.notes,
      })
      .eq('id', selectedClient.id)

    if (!error) {
      setClients(clients.map((c) => (c.id === selectedClient.id ? selectedClient : c)))
      setIsDetailOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Client Database</h1>
        <p className="text-muted-foreground">View and manage client information.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
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
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No clients found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedClient(client)
                      setIsDetailOpen(true)
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.equipment_needs && (
                            <p className="text-xs text-muted-foreground">{client.equipment_needs}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.experience_level && (
                        <Badge className={getExperienceLevelColor(client.experience_level)}>
                          {client.experience_level}
                        </Badge>
                      )}
                      {client.weight && (
                        <p className="text-xs text-muted-foreground mt-1">{client.weight} lbs</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Anchor className="h-4 w-4 text-muted-foreground" />
                        <span>{client.bookings_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(client.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Details
            </DialogTitle>
            <DialogDescription>View and edit client information.</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <form onSubmit={saveClient}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={selectedClient.name}
                      onChange={(e) =>
                        setSelectedClient({ ...selectedClient, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={selectedClient.email}
                      onChange={(e) =>
                        setSelectedClient({ ...selectedClient, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={selectedClient.phone || ''}
                      onChange={(e) =>
                        setSelectedClient({ ...selectedClient, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="experience">Experience Level</Label>
                    <Select
                      value={selectedClient.experience_level || ''}
                      onValueChange={(value) =>
                        setSelectedClient({
                          ...selectedClient,
                          experience_level: value as any,
                        })
                      }
                    >
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={selectedClient.weight || ''}
                      onChange={(e) =>
                        setSelectedClient({
                          ...selectedClient,
                          weight: parseInt(e.target.value) || null,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sail">Sail Size Preference</Label>
                    <Input
                      id="sail"
                      value={selectedClient.sail_size_preference || ''}
                      onChange={(e) =>
                        setSelectedClient({
                          ...selectedClient,
                          sail_size_preference: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={selectedClient.notes || ''}
                    onChange={(e) =>
                      setSelectedClient({ ...selectedClient, notes: e.target.value })
                    }
                    placeholder="Add any relevant notes about this client..."
                  />
                </div>

                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Client Stats</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Bookings: </span>
                      <span className="font-medium">{selectedClient.bookings_count || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Member Since: </span>
                      <span className="font-medium">{formatDate(selectedClient.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
