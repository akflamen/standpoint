import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'
import {
  applyInactivityDecay,
  boostWeightAfterVote,
} from '@/lib/vote-weight'

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: 'Sign in to vote' }, { status: 401 })
    }

    const { noteId, voteValue } = await req.json()

    if (!noteId || voteValue === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (voteValue !== 1 && voteValue !== -1) {
      return NextResponse.json({ error: 'Vote must be 1 or -1' }, { status: 400 })
    }

    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('vote_weight, last_vote_at, premium')
      .eq('id', session.userId)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const currentWeight = applyInactivityDecay(
      Number(account.vote_weight ?? 0.3),
      account.last_vote_at,
      Boolean(account.premium)
    )

    const { data: existingVote } = await supabaseAdmin
      .from('votes')
      .select('id, vote_value')
      .eq('note_id', noteId)
      .eq('account_id', session.userId)
      .single()

    if (existingVote) {
      if (existingVote.vote_value === voteValue) {
        await supabaseAdmin.from('votes').delete().eq('id', existingVote.id)
        return NextResponse.json({
          message: 'Vote removed',
          voteWeight: currentWeight,
        })
      }

      await supabaseAdmin
        .from('votes')
        .update({ vote_value: voteValue, vote_weight: currentWeight })
        .eq('id', existingVote.id)

      const boostedWeight = boostWeightAfterVote(currentWeight, Boolean(account.premium))
      await supabaseAdmin
        .from('accounts')
        .update({
          vote_weight: boostedWeight,
          last_vote_at: new Date().toISOString(),
        })
        .eq('id', session.userId)

      return NextResponse.json({
        message: 'Vote updated',
        voteWeight: boostedWeight,
      })
    }

    await supabaseAdmin.from('votes').insert({
      note_id: noteId,
      account_id: session.userId,
      vote_value: voteValue,
      vote_weight: currentWeight,
    })

    const boostedWeight = boostWeightAfterVote(currentWeight, Boolean(account.premium))
    await supabaseAdmin
      .from('accounts')
      .update({
        vote_weight: boostedWeight,
        last_vote_at: new Date().toISOString(),
      })
      .eq('id', session.userId)

    return NextResponse.json({
      message: 'Vote recorded',
      voteWeight: boostedWeight,
    })
  } catch (err) {
    console.error('Vote error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
