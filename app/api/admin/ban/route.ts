import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-admin-secret')
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username, action, reason } = await req.json()

    if (!username || !action) {
      return NextResponse.json({ error: 'Missing username or action' }, { status: 400 })
    }

    if (action !== 'ban' && action !== 'unban') {
      return NextResponse.json({ error: 'Action must be ban or unban' }, { status: 400 })
    }

    // 1. Query the target user utilizing case-insensitive matching
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('id, username, banned')
      .ilike('username', username.trim())
      .maybeSingle()

    if (!account) {
      return NextResponse.json({ error: 'User handle not found in database logs' }, { status: 404 })
    }

    const banned = action === 'ban'

    // 2. Perform target exclusion update string
    const { error: updateError } = await supabaseAdmin
      .from('accounts')
      .update({
        banned,
        ban_reason: banned ? reason?.trim() || 'Policy violation' : null,
      })
      .eq('id', account.id)

    if (updateError) throw updateError

    // 3. If banned, force drop active sessions using your exact column keys
    if (banned) {
      // Verified from your database visual: column name is strictly 'user_id'
      const { error: sessionError } = await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('user_id', account.id)

      if (sessionError) throw sessionError
    }

    return NextResponse.json({
      message: banned ? 'User target blacklisted' : 'User target restored',
      username: account.username,
      banned,
    })
  } catch (err) {
    console.error('Admin ban configuration error:', err)
    return NextResponse.json({ error: 'Internal server database transaction error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-admin-secret')
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const username = req.nextUrl.searchParams.get('username')
    if (!username) {
      return NextResponse.json({ error: 'Missing token string parameter' }, { status: 400 })
    }

    // Query target payload records using case-insensitive validation
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('username, banned, ban_reason, premium')
      .ilike('username', username.trim())
      .maybeSingle()

    if (!account) {
      return NextResponse.json({ error: 'User target not found in registry' }, { status: 404 })
    }

    return NextResponse.json({ account })
  } catch (err) {
    console.error('Admin query execution failure:', err)
    return NextResponse.json({ error: 'Internal database reading pipeline failure' }, { status: 500 })
  }
}