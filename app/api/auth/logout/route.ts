// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (sessionToken) {
      // Delete session from database
      await supabase
        .from('sessions')
        .delete()
        .eq('token', sessionToken)
    }

    // Clear cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    response.cookies.delete('session_token')
    
    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}