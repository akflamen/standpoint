import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/session'

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
    await clearSessionCookie(response)
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}
