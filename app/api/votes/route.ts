import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'
import {
  calculateUserWeight,
  getUserDisplayWeight,
  getActualWeightForOthers,
  incrementWeightAfterVote,
  calculateCombinedVote,
  VOTE_WEIGHT,
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

    // Get user data with new fields
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('id, vote_count, total_votes_cast, last_vote_at, premium, vote_weight')
      .eq('id', session.userId)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Calculate actual weight based on vote count
    const actualWeight = calculateUserWeight(
      account.vote_count || 0,
      account.last_vote_at,
      Boolean(account.premium)
    )

    // Check if user already voted on this note
    const { data: existingVote } = await supabaseAdmin
      .from('votes')
      .select('id, vote_value, vote_weight')
      .eq('note_id', noteId)
      .eq('account_id', session.userId)
      .single()

    // Handle vote removal (if same vote value)
    if (existingVote && existingVote.vote_value === voteValue) {
      // Remove the vote
      await supabaseAdmin.from('votes').delete().eq('id', existingVote.id)
      
      // Don't decrease vote count when removing a vote
      // (user already earned that weight from voting)
      
      return NextResponse.json({
        message: 'Vote removed',
        // User sees their vote as 100% (since it's removed, show 0)
        ownViewWeight: 0,
        actualWeight: actualWeight,
      })
    }

    // Get all votes for this note to calculate combined weight
    const { data: allVotes } = await supabaseAdmin
      .from('votes')
      .select('account_id, vote_weight, vote_value')
      .eq('note_id', noteId)
      .eq('vote_value', 1) // Only count upvotes for weight calculation

    // Prepare vote weights for combination
    let voteWeights: number[] = []
    if (allVotes) {
      voteWeights = allVotes.map(v => Number(v.vote_weight))
    }

    // If updating existing vote, remove old weight first
    if (existingVote && existingVote.vote_value !== voteValue) {
      const index = voteWeights.indexOf(Number(existingVote.vote_weight))
      if (index > -1) {
        voteWeights.splice(index, 1)
      }
    }

    // Add current user's weight (only for upvotes)
    if (voteValue === 1) {
      voteWeights.push(actualWeight)
    }

    // Calculate combined vote
    const combined = calculateCombinedVote(voteWeights)

    // Prepare vote data
    const voteData = {
      note_id: noteId,
      account_id: session.userId,
      vote_value: voteValue,
      vote_weight: actualWeight,
      combined_full_votes: combined.fullVotes,
      combined_remainder: combined.remainder,
      total_vote_weight: combined.totalWeight,
    }

    if (existingVote) {
      // Update existing vote
      await supabaseAdmin
        .from('votes')
        .update(voteData)
        .eq('id', existingVote.id)
    } else {
      // Insert new vote
      await supabaseAdmin.from('votes').insert(voteData)
      
      // Increment vote count only for new votes (not updates)
      const newVoteCount = incrementWeightAfterVote(
        account.vote_count || 0,
        Boolean(account.premium)
      )
      
      await supabaseAdmin
        .from('accounts')
        .update({
          vote_count: newVoteCount,
          total_votes_cast: (account.total_votes_cast || 0) + 1,
          last_vote_at: new Date().toISOString(),
        })
        .eq('id', session.userId)
    }

    // Get updated user data
    const { data: updatedAccount } = await supabaseAdmin
      .from('accounts')
      .select('vote_count, total_votes_cast, premium')
      .eq('id', session.userId)
      .single()

    // Calculate updated weight
    const updatedWeight = calculateUserWeight(
      updatedAccount?.vote_count || 0,
      new Date().toISOString(),
      Boolean(account.premium)
    )

    // Update note's vote count in the notes table (optional optimization)
    await supabaseAdmin
      .from('notes')
      .update({
        vote_weight: combined.totalWeight,
        vote_count: combined.fullVotes,
        vote_remainder: combined.remainder,
      })
      .eq('id', noteId)

    return NextResponse.json({
      message: existingVote ? 'Vote updated' : 'Vote recorded',
      // User always sees their vote as 1 (100%)
      ownViewWeight: getUserDisplayWeight(updatedWeight),
      // Other users see actual weight
      actualWeight: getActualWeightForOthers(updatedWeight),
      combinedVote: {
        fullVotes: combined.fullVotes,
        remainder: combined.remainder,
        totalWeight: combined.totalWeight,
      },
      voteCount: updatedAccount?.total_votes_cast || 0,
      userWeightPercentage: Math.round(updatedWeight),
    })
  } catch (err) {
    console.error('Vote error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET endpoint to fetch vote status for a note
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    const { searchParams } = new URL(req.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({ error: 'Missing noteId' }, { status: 400 })
    }

    // Get all votes for this note
    const { data: votes } = await supabaseAdmin
      .from('votes')
      .select('account_id, vote_weight, vote_value')
      .eq('note_id', noteId)
      .eq('vote_value', 1)

    // Calculate combined vote
    const weights = votes?.map(v => Number(v.vote_weight)) || []
    const combined = calculateCombinedVote(weights)

    // Get user's own vote if logged in
    let userVote = null
    let userWeight = 0
    if (session) {
      const { data: userVoteData } = await supabaseAdmin
        .from('votes')
        .select('vote_value, vote_weight')
        .eq('note_id', noteId)
        .eq('account_id', session.userId)
        .single()

      if (userVoteData) {
        userVote = userVoteData.vote_value
        userWeight = Number(userVoteData.vote_weight)
      }
    }

    return NextResponse.json({
      combinedVote: {
        fullVotes: combined.fullVotes,
        remainder: combined.remainder,
        totalWeight: combined.totalWeight,
        displayTotal: combined.fullVotes + (combined.remainder > 0 ? 1 : 0),
      },
      userVote,
      userWeight: session ? getUserDisplayWeight(userWeight) : null,
      actualUserWeight: session ? userWeight : null,
      totalVoters: votes?.length || 0,
    })
  } catch (err) {
    console.error('Get vote error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}