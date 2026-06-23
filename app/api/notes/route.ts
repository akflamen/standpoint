import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const topicId = searchParams.get('topicId')

    if (!topicId) {
      return NextResponse.json({ error: 'Missing topicId' }, { status: 400 })
    }

    const { data: notes, error } = await supabase
      .from('notes')
      .select(`
        id,
        content,
        username,
        parent_note_id,
        created_at,
        votes (vote_value, vote_weight)
      `)
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true })

    if (error) throw error

    const notesWithScores = (notes ?? []).map((note) => {
      const votes = (note.votes as { vote_value: number; vote_weight: number | null }[]) ?? []
      const score = votes.reduce(
        (sum, vote) => sum + vote.vote_value * Number(vote.vote_weight ?? 1),
        0
      )

      return {
        id: note.id,
        content: note.content,
        username: note.username,
        parent_note_id: note.parent_note_id,
        created_at: note.created_at,
        score: Math.round(score * 100) / 100,
        voteCount: votes.length,
      }
    })

    return NextResponse.json({ notes: notesWithScores })
  } catch (err) {
    console.error('Notes fetch error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: 'Sign in to post' }, { status: 401 })
    }

    const { topicId, content, parentNoteId } = await req.json()

    if (!topicId || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Note too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    if (content.trim().length < 1) {
      return NextResponse.json({ error: 'Note cannot be empty' }, { status: 400 })
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

    if (parentNoteId) {
      const { data: parentNote } = await supabaseAdmin
        .from('notes')
        .select('id')
        .eq('id', parentNoteId)
        .eq('topic_id', topicId)
        .single()

      if (!parentNote) {
        return NextResponse.json({ error: 'Parent note not found' }, { status: 404 })
      }
    }

    const { data: note, error } = await supabaseAdmin
      .from('notes')
      .insert({
        topic_id: topicId,
        content: content.trim(),
        username: session.username,
        account_id: session.userId,
        parent_note_id: parentNoteId || null,
      })
      .select('id, content, username, parent_note_id, created_at')
      .single()

    if (error) throw error

    await supabaseAdmin
      .from('accounts')
      .update({ last_topic_id: topicId })
      .eq('id', session.userId)

    return NextResponse.json({ note: { ...note, score: 0, voteCount: 0 } })
  } catch (err) {
    console.error('Note post error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
