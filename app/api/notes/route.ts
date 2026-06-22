import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '../../../lib/supabase'

// GET — public, returns all notes for a topic with vote counts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const topicId = searchParams.get('topicId')

    if (!topicId) {
      return NextResponse.json({ error: 'Missing topicId' }, { status: 400 })
    }

    // Fetch notes with vote counts
    const { data: notes, error } = await supabase
      .from('notes')
      .select(`
        id,
        content,
        username,
        parent_note_id,
        created_at,
        votes (vote_value)
      `)
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Calculate vote score for each note
    const notesWithScores = notes.map(note => ({
      id: note.id,
      content: note.content,
      username: note.username,
      parent_note_id: note.parent_note_id,
      created_at: note.created_at,
      score: (note.votes as { vote_value: number }[]).reduce(
        (sum, v) => sum + v.vote_value, 0
      ),
      voteCount: (note.votes as { vote_value: number }[]).length,
    }))

    return NextResponse.json({ notes: notesWithScores })
  } catch (err) {
    console.error('Notes fetch error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — logged in users post a new note
export async function POST(req: NextRequest) {
  try {
    const { topicId, content, parentNoteId, token, username } = await req.json()

    if (!topicId || !content || !token || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Note too long (max 1000 characters)' }, { status: 400 })
    }

    if (content.trim().length < 1) {
      return NextResponse.json({ error: 'Note cannot be empty' }, { status: 400 })
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
      return NextResponse.json({ error: 'Session expired, please log in again' }, { status: 401 })
    }

    // Verify topic exists and is approved
    const { data: topic } = await supabaseAdmin
      .from('topics')
      .select('id')
      .eq('id', topicId)
      .eq('status', 'approved')
      .single()

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
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

    // If replying, verify parent note exists in same topic
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
        username,
        account_id: account.id,
        parent_note_id: parentNoteId || null,
      })
      .select('id, content, username, parent_note_id, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ note: { ...note, score: 0, voteCount: 0 } })
  } catch (err) {
    console.error('Note post error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
