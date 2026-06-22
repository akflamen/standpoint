import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { noteId, voteValue, token, username } = await req.json()

    if (!noteId || !voteValue || !token || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (voteValue !== 1 && voteValue !== -1) {
      return NextResponse.json({ error: 'Vote must be 1 or -1' }, { status: 400 })
    }

    // Verify session token
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

    // Get account id
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('username', username)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Check if user already voted on this note
    const { data: existingVote } = await supabaseAdmin
      .from('votes')
      .select('id, vote_value')
      .eq('note_id', noteId)
      .eq('account_id', account.id)
      .single()

    if (existingVote) {
      if (existingVote.vote_value === voteValue) {
        // Same vote — remove it (toggle off)
        await supabaseAdmin
          .from('votes')
          .delete()
          .eq('id', existingVote.id)
        return NextResponse.json({ message: 'Vote removed' })
      } else {
        // Different vote — update it
        await supabaseAdmin
          .from('votes')
          .update({ vote_value: voteValue })
          .eq('id', existingVote.id)
        return NextResponse.json({ message: 'Vote updated' })
      }
    }

    // New vote
    await supabaseAdmin
      .from('votes')
      .insert({ note_id: noteId, account_id: account.id, vote_value: voteValue })

    return NextResponse.json({ message: 'Vote recorded' })
  } catch (err) {
    console.error('Vote error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
