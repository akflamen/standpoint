import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

// GET — public, returns all approved topics
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('id, title, description, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ topics: data })
  } catch (err) {
    console.error('Topics fetch error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — logged in users can suggest a new topic
export async function POST(req: NextRequest) {
  try {
    const { title, description, token, username } = await req.json()

    if (!title || !token || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (title.length < 5 || title.length > 100) {
      return NextResponse.json({ error: 'Title must be 5-100 characters' }, { status: 400 })
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

    // Insert topic as pending — you approve it manually in Supabase dashboard
    const { error } = await supabaseAdmin
      .from('topics')
      .insert({
        title,
        description: description || null,
        status: 'pending',
        created_by: account.id,
      })

    if (error) throw error

    return NextResponse.json({ message: 'Topic submitted for review' })
  } catch (err) {
    console.error('Topic submit error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}