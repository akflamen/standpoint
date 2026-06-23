import { NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSessionFromCookies()

    if (!session) {
      return NextResponse.json({ session: null }, { status: 401 })
    }

    return NextResponse.json({
      session: {
        username: session.username,
        premium: session.premium,
      },
    })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json({ session: null }, { status: 500 })
  }
}
