import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getSessionFromCookies()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('username, premium, vote_weight, last_vote_at, last_topic_id')
      .eq('id', session.userId)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    let lastTopic: { id: string; title: string } | null = null
    if (account.last_topic_id) {
      const { data: topic } = await supabaseAdmin
        .from('topics')
        .select('id, title')
        .eq('id', account.last_topic_id)
        .single()

      if (topic) {
        lastTopic = { id: topic.id, title: topic.title }
      }
    }



    return NextResponse.json({
      profile: {
        username: account.username,
        premium: Boolean(account.premium),
        lastTopic,
      },
    })
  } catch (err) {
    console.error('Profile error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromCookies()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { topicId } = await req.json()
    if (!topicId) {
      return NextResponse.json({ error: 'Missing topicId' }, { status: 400 })
    }

    const { data: topic } = await supabaseAdmin
      .from('topics')
      .select('id')
      .eq('id', topicId)
      .eq('status', 'approved')
      .single()

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    await supabaseAdmin
      .from('accounts')
      .update({ last_topic_id: topicId })
      .eq('id', session.userId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Profile update error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
