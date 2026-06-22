import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

// GET — fetch all pending topics
export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-admin-secret')
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('topics')
      .select('id, title, description, status, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ topics: data })
  } catch (err) {
    console.error('Admin topics error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — approve or reject a topic
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-admin-secret')
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { topicId, action } = await req.json()

    if (!topicId || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Action must be approve or reject' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('topics')
      .update({ status: action === 'approve' ? 'approved' : 'rejected' })
      .eq('id', topicId)

    if (error) throw error
    return NextResponse.json({ message: `Topic ${action}d` })
  } catch (err) {
    console.error('Admin action error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}