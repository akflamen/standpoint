import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPhrase } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, phrase } = await req.json()
  const normalizedPhrase = phrase?.trim().replace(/\s+/g, ' ')

  if (!username || !normalizedPhrase) {
    return NextResponse.json({ error: 'Username and phrase required' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('accounts')
    .select('id, phrase_hash')
    .eq('username', username)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'Invalid username or recovery phrase' }, { status: 401 })
  }

  const isValid = await verifyPhrase(normalizedPhrase, user.phrase_hash)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid username or recovery phrase' }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
