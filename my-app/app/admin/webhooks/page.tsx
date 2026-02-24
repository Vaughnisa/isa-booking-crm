import { WebhooksClient } from './webhooks-client'
import { supabase } from '@/lib/supabase'

async function getWebhooks() {
  const { data } = await supabase
    .from('webhook_configs')
    .select('*')
    .order('created_at', { ascending: false })
  
  return data || []
}

async function getWebhookLogs() {
  const { data } = await supabase
    .from('webhook_logs')
    .select('*, webhook:webhook_configs(name)')
    .order('created_at', { ascending: false })
    .limit(50)
  
  return data || []
}

export default async function WebhooksPage() {
  const [webhooks, logs] = await Promise.all([
    getWebhooks(),
    getWebhookLogs(),
  ])
  
  return <WebhooksClient webhooks={webhooks} logs={logs} />
}
