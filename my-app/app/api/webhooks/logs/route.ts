import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const webhookId = searchParams.get('webhook_id')
  const limit = parseInt(searchParams.get('limit') || '50')
  
  let query = supabase
    .from('webhook_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (webhookId) {
    query = query.eq('webhook_id', webhookId)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data || [])
}
