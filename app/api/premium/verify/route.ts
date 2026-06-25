// app/api/premium/verify/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'
import { VOTE_WEIGHT, calculateUserWeight } from '@/lib/vote-weight'  // ← Add calculateUserWeight here

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    }

    const { orderId, devMode } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const { data: intent, error: intentError } = await supabaseAdmin
      .from('payment_intents')
      .select('id, account_id, status')
      .eq('order_id', orderId)
      .eq('account_id', session.userId)
      .single()

    if (intentError || !intent) {
      return NextResponse.json({ error: 'Payment session not found' }, { status: 404 })
    }

    if (intent.status !== 'pending') {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
    }

    const hasRazorpayKeys =
      Boolean(process.env.RAZORPAY_KEY_ID) &&
      Boolean(process.env.RAZORPAY_KEY_SECRET)

    if (!hasRazorpayKeys && !devMode) {
      return NextResponse.json(
        { error: 'Razorpay is not configured for live verification yet' },
        { status: 503 }
      )
    }

    if (hasRazorpayKeys && !devMode) {
      // TODO: verify Razorpay payment signature + payment id here
      return NextResponse.json(
        { error: 'Live Razorpay verification hook not wired yet' },
        { status: 501 }
      )
    }

    // Get current user data to preserve vote count
    const { data: currentUser } = await supabaseAdmin
      .from('accounts')
      .select('vote_count, total_votes_cast')
      .eq('id', session.userId)
      .single()

    // Update account to premium - keep vote_count the same
    const { error: premiumError } = await supabaseAdmin
      .from('accounts')
      .update({
        premium: true,
        vote_count: currentUser?.vote_count || 0,
        total_votes_cast: currentUser?.total_votes_cast || 0,
      })
      .eq('id', session.userId)

    if (premiumError) {
      console.error('Premium activation error:', premiumError)
      return NextResponse.json({ error: 'Could not activate premium' }, { status: 500 })
    }

    // Delete the payment intent
    await supabaseAdmin.from('payment_intents').delete().eq('id', intent.id)

    // Calculate new weight with premium benefits
    const { data: updatedUser } = await supabaseAdmin
      .from('accounts')
      .select('vote_count, premium')
      .eq('id', session.userId)
      .single()

    const newWeight = calculateUserWeight(
      updatedUser?.vote_count || 0,
      new Date().toISOString(),
      true // isPremium
    )

    return NextResponse.json({
      message: 'Premium activated',
      premium: true,
      voteWeight: newWeight,
      voteCount: updatedUser?.vote_count || 0,
      // Premium users now gain 4% per vote instead of 2%
      weightPerVote: VOTE_WEIGHT.PREMIUM_INCREMENT_PER_VOTE,
    })
  } catch (err) {
    console.error('Premium verify error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}