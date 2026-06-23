// app/api/auth/session/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { session: null },
        { status: 401 }
      )
    }

    // Validate session
    const { data: session, error } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token', sessionToken)
      .single()

    if (error || !session) {
      return NextResponse.json(
        { session: null },
        { status: 401 }
      )
    }

    // Check if session expired
    const expiresAt = new Date(session.expires_at)
    if (expiresAt < new Date()) {
      await supabase
        .from('sessions')
        .delete()
        .eq('token', sessionToken)
      
      const response = NextResponse.json(
        { session: null },
        { status: 401 }
      )
      response.cookies.delete('session_token')
      return response
    }

    // Get user info
    const { data: user } = await supabase
      .from('accounts')
      .select('username')
      .eq('id', session.user_id)
      .single()

    return NextResponse.json({
      session: {
        username: user?.username || null,
        token: sessionToken,
      }
    })

  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json(
      { session: null },
      { status: 500 }
    )
  }
}