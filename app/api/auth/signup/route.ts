import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { username, publicKey } = await req.json()

    // Basic validation
    if (!username || !publicKey) {
      return NextResponse.json({ error: 'Missing username or public key' }, { status: 400 })
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, underscores' }, { status: 400 })
    }

    // Check username not already taken
    const { data: existing } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    // Create account — only username and public key stored, nothing else
    const { data: account, error } = await supabaseAdmin
      .from('accounts')
      .insert({ username, public_key: publicKey })
      .select('id')
      .single()

    if (error || !account) {
      return NextResponse.json({ error: 'Could not create account' }, { status: 500 })
    }

    // Issue a simple session token
    const token = crypto.randomBytes(32).toString('hex')

    // Store token in login_challenges table temporarily as session proof
    // In V2 we'll add a proper sessions table — for now this is enough
    await supabaseAdmin.from('login_challenges').insert({
      username,
      challenge: `session_${token}`,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })

    return NextResponse.json({ token })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}