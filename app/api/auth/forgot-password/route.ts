// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserByUsername, verifyPhrase, updateUserPassword } from '@/lib/auth'
import { rateLimit } from '../../../../lib/rate-limit'

// Rate Limiting: 3 attempts per hour
const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
})

export async function POST(req: NextRequest) {
  try {
    // Get client IP from headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'anonymous'

    // Apply rate limiting
    try {
      await limiter.check(ip, 3) // 3 attempts max per hour
    } catch {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { username, phrase, newPassword } = await req.json()
    const normalizedPhrase = phrase?.trim().replace(/\s+/g, ' ')

    // Validate inputs
    if (!username || !normalizedPhrase || !newPassword) {
      return NextResponse.json(
        { error: 'Username, security phrase, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Get user by username
    const user = await getUserByUsername(username)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or security phrase' },
        { status: 401 }
      )
    }

    // Verify security phrase
    const isValidPhrase = await verifyPhrase(normalizedPhrase, user.phrase_hash)
    if (!isValidPhrase) {
      return NextResponse.json(
        { error: 'Invalid username or security phrase' },
        { status: 401 }
      )
    }

    // Update password
    await updateUserPassword(user.id, newPassword)

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}