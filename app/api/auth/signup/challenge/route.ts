import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()

    if (!username) {
      return NextResponse.json({ error: 'Missing username' }, { status: 400 })
    }

    // Check account exists
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('username', username)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Username not found' }, { status: 404 })
    }

    // Generate a fresh random challenge — expires in 5 minutes
    const challenge = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const { data: stored, error } = await supabaseAdmin
      .from('login_challenges')
      .insert({ username, challenge, expires_at: expiresAt })
      .select('id')
      .single()

    if (error || !stored) {
      return NextResponse.json({ error: 'Could not create challenge' }, { status: 500 })
    }

    return NextResponse.json({ challenge, challengeId: stored.id })
  } catch (err) {
    console.error('Challenge error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}