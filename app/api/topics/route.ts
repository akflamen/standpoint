import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getSessionFromRequest } from '@/lib/session'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('id, title, description, created_at, notes(count)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) throw error

    const topics = (data ?? []).map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      created_at: topic.created_at,
      note_count: Array.isArray(topic.notes) ? topic.notes[0]?.count ?? 0 : 0,
    }))

    return NextResponse.json({ topics })
  } catch (err) {
    console.error('Topics fetch error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: 'Sign in to suggest a topic' }, { status: 401 })
    }

    try {
      await enforceRateLimit(req, 'topic_suggest', session.userId, 5, 24 * 60 * 60 * 1000)
    } catch {
      return NextResponse.json(
        { error: 'You can only suggest 5 topics per day' },
        { status: 429 }
      )
    }

    const { title, description } = await req.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be 5-100 characters' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.from('topics').insert({
      title: title.trim(),
      description: description?.trim() || null,
      status: 'pending',
      created_by: session.userId,
    })

    if (error) throw error

    return NextResponse.json({ message: 'Topic submitted for admin review' })
  } catch (err) {
    console.error('Topic submit error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
