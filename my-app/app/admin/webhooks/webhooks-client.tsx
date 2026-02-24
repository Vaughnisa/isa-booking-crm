'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Send, Copy, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

const AVAILABLE_EVENTS = [
  { id: 'booking.confirmed', label: 'Booking Confirmed', description: 'Triggered when deposit is paid' },
  { id: 'payment.received', label: 'Payment Received', description: 'Any payment (deposit or full)' },
  { id: 'balance.due', label: 'Balance Due', description: '30 days before clinic date' },
  { id: 'booking.cancelled', label: 'Booking Cancelled', description: 'When a booking is cancelled' },
]

interface WebhookConfig {
  id: string
  name: string
  url: string
  secret: string | null
  is_active: boolean
  events: string[]
  created_at: string
}

interface WebhookLog {
  id: string
  webhook_id: string
  event: string
  payload: any
  response_status: number | null
  error_message: string | null
  delivered_at: string | null
  created_at: string
  webhook?: { name: string }
}

interface WebhooksClientProps {
  webhooks: WebhookConfig[]
  logs: WebhookLog[]
}

export function WebhooksClient({ webhooks: initialWebhooks, logs: initialLogs }: WebhooksClientProps) {
  const [webhooks, setWebhooks] = useState(initialWebhooks)
  const [logs, setLogs] = useState(initialLogs)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Partial<WebhookConfig> | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const appUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : ''
  const webhookUrl = `${appUrl}/api/webhooks/make`

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const saveWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWebhook) return

    const response = await fetch('/api/webhooks/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingWebhook),
    })

    if (response.ok) {
      const saved = await response.json()
      setWebhooks((prev) => {
        const exists = prev.find((w) => w.id === saved.id)
        if (exists) {
          return prev.map((w) => (w.id === saved.id ? saved : w))
        }
        return [saved, ...prev]
      })
      setIsAddDialogOpen(false)
      setEditingWebhook(null)
    }
  }

  const deleteWebhook = async (id: string) => {
    await fetch(`/api/webhooks/config?id=${id}`, { method: 'DELETE' })
    setWebhooks(webhooks.filter((w) => w.id !== id))
  }

  const toggleWebhook = async (webhook: WebhookConfig) => {
    const updated = { ...webhook, is_active: !webhook.is_active }
    
    const response = await fetch('/api/webhooks/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })

    if (response.ok) {
      const saved = await response.json()
      setWebhooks(webhooks.map((w) => (w.id === saved.id ? saved : w)))
    }
  }

  const testWebhook = async (webhook: WebhookConfig) => {
    const testPayload = {
      event: 'booking.confirmed',
      booking_id: 'test-' + Date.now(),
      client: {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+1-555-TEST',
      },
      clinic: {
        id: 'test-clinic',
        title: 'Test Clinic',
        date: '2025-06-01',
        coach: 'Test Coach',
      },
      payment: {
        deposit_paid: 50000,
        balance_due: 100000,
        balance_due_date: '2025-05-01',
      },
      timestamp: new Date().toISOString(),
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhook.secret && { 'X-Webhook-Secret': webhook.secret }),
        },
        body: JSON.stringify(testPayload),
      })

      // Refresh logs
      const logsRes = await fetch('/api/webhooks/logs')
      if (logsRes.ok) {
        setLogs(await logsRes.json())
      }

      alert(`Test sent! Response: ${response.status}`)
    } catch (error) {
      alert(`Test failed: ${error}`)
    }
  }

  const refreshLogs = async () => {
    const res = await fetch('/api/webhooks/logs')
    if (res.ok) {
      setLogs(await res.json())
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Webhook Integration</h1>
        <p className="text-muted-foreground">Configure Make.com webhooks for automation.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>
            Use this URL in your Make.com scenario. Send POST requests with the payload format below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
              {webhookUrl}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(webhookUrl, 'url')}
            >
              {copiedId === 'url' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Webhook Endpoints</CardTitle>
            <CardDescription>Manage your Make.com webhook connections.</CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingWebhook({
                name: '',
                url: '',
                secret: '',
                is_active: true,
                events: ['booking.confirmed'],
              })
              setIsAddDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Webhook
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No webhooks configured.
                  </TableCell>
                </TableRow>
              ) : (
                webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{webhook.url}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event.split('.')[1]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={() => toggleWebhook(webhook)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => testWebhook(webhook)}
                          title="Test webhook"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingWebhook(webhook)
                            setIsAddDialogOpen(true)
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Delivery Log</CardTitle>
            <CardDescription>Recent webhook deliveries and their status.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Webhook</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No deliveries yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.event}</Badge>
                    </TableCell>
                    <TableCell>{log.webhook?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      {log.response_status && log.response_status < 400 ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>{log.response_status}</span>
                        </div>
                      ) : log.error_message ? (
                        <div className="flex items-center gap-1 text-red-600" title={log.error_message}>
                          <XCircle className="h-4 w-4" />
                          <span>Failed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <span>{log.response_status || 'Pending'}</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingWebhook?.id ? 'Edit Webhook' : 'Add Webhook'}</DialogTitle>
            <DialogDescription>
              Configure a webhook endpoint for Make.com integration.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveWebhook}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Make.com Production"
                  value={editingWebhook?.name || ''}
                  onChange={(e) =>
                    setEditingWebhook((prev) => ({ ...prev!, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">Webhook URL</Label>
                <Input
                  id="url"
                  placeholder="https://hook.make.com/..."
                  value={editingWebhook?.url || ''}
                  onChange={(e) =>
                    setEditingWebhook((prev) => ({ ...prev!, url: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="secret">Secret (optional)</Label>
                <Input
                  id="secret"
                  type="password"
                  placeholder="X-Webhook-Secret header value"
                  value={editingWebhook?.secret || ''}
                  onChange={(e) =>
                    setEditingWebhook((prev) => ({ ...prev!, secret: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Events</Label>
                <div className="space-y-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={event.id}
                        checked={editingWebhook?.events?.includes(event.id)}
                        onCheckedChange={(checked) => {
                          setEditingWebhook((prev) => ({
                            ...prev!,
                            events: checked
                              ? [...(prev?.events || []), event.id]
                              : prev?.events?.filter((e) => e !== event.id) || [],
                          }))
                        }}
                      />
                      <div className="grid gap-1 leading-none">
                        <label
                          htmlFor={event.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {event.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Webhook</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
