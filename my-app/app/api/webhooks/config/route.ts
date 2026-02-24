import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// This endpoint receives webhook configuration from the admin UI
// The actual outbound webhooks to Make.com are triggered from other API routes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (id) {
    const { data } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('id', id)
      .single()
    return NextResponse.json(data)
  }
  
  const { data } = await supabase
    .from('webhook_configs')
    .select('*')
    .order('created_at', { ascending: false })
  
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const { data, error } = await supabase
    .from('webhook_configs')
    .upsert({
      id: body.id,
      name: body.name,
      url: body.url,
      secret: body.secret,
      is_active: body.is_active,
      events: body.events,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }
  
  await supabase.from('webhook_configs').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
