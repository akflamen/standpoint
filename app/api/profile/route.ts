import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')
    const token = searchParams.get('token')

    if (!username || !token) {
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

    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('username, tier, created_at, premium')
      .eq('username', username)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({ account })
  } catch (err) {
    console.error('Profile error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
