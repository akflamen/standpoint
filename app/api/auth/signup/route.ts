import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, hashPhrase } from '@/lib/auth'
import { generateRecoveryPhrase } from '@/lib/phrases'
import { enforceRateLimit, getRequestIp } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { VOTE_WEIGHT } from '@/lib/vote-weight'

export async function POST(req: NextRequest) {
  try {
    const ip = getRequestIp(req)
    try {
      await enforceRateLimit(req, 'signup', ip, 3, 60 * 60 * 1000)
    } catch {
      return NextResponse.json(
        { error: 'Too many signup attempts. Try again later.' },
        { status: 429 }
      )
    }

    const { username, password } = await req.json()
    const trimmedUsername = username?.trim()

    if (!trimmedUsername || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('username', trimmedUsername)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }

    const recoveryPhrase = generateRecoveryPhrase()
    const passwordHash = await hashPassword(password)
    const phraseHash = await hashPhrase(recoveryPhrase)

    const { error } = await supabaseAdmin.from('accounts').insert({
      username: trimmedUsername,
      password_hash: passwordHash,
      phrase_hash: phraseHash,
      premium: false,
      banned: false,
      vote_weight: VOTE_WEIGHT.NEW_USER,
    })

    if (error) {
      console.error('Signup insert error:', error)
      return NextResponse.json(
        { error: 'Could not create account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      username: trimmedUsername,
      recoveryPhrase,
    })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
