import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { code, token, username } = await req.json()

    if (!code || !token || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Verify session
    const { data: session } = await supabaseAdmin
      .from('login_challenges')
      .select('username, expires_at')
      .eq('challenge', `session_${token}`)
      .single()

    if (!session || session.username !== username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    // Check code exists and is unused
    const { data: premiumCode } = await supabaseAdmin
      .from('premium_codes')
      .select('id, used')
      .eq('code', code)
      .single()

    if (!premiumCode) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    if (premiumCode.used) {
      return NextResponse.json({ error: 'Code already used' }, { status: 400 })
    }

    // Mark code as used and activate premium — both in one go
    await supabaseAdmin
      .from('premium_codes')
      .update({ used: true })
      .eq('id', premiumCode.id)

    await supabaseAdmin
      .from('accounts')
      .update({ premium: true })
      .eq('username', username)

    return NextResponse.json({ message: 'Premium activated' })
  } catch (err) {
    console.error('Premium error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}