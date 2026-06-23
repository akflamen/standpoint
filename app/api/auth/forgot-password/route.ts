// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, verifyPhrase } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

// Rate Limiting: 3 attempts per hour
const limiter = rateLimit({
  intervalMs: 60 * 60 * 1000, // 1 hour
  action: 'forgot-password',
})

export async function POST(req: NextRequest) {
  try {
    // Get client IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'anonymous'

    // Apply rate limiting
    try {
      await limiter.check(ip, 3)
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
        { error: 'Username, recovery phrase, and new password are required' },
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
    const { data: user } = await supabaseAdmin
      .from('accounts')
      .select('id, phrase_hash')
      .eq('username', username)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or recovery phrase' },
        { status: 401 }
      )
    }

    // Verify recovery phrase
    const isValidPhrase = await verifyPhrase(normalizedPhrase, user.phrase_hash)
    if (!isValidPhrase) {
      return NextResponse.json(
        { error: 'Invalid username or recovery phrase' },
        { status: 401 }
      )
    }

    // Update password
    const newHash = await hashPassword(newPassword)
    const { error } = await supabaseAdmin
      .from('accounts')
      .update({ password_hash: newHash })
      .eq('id', user.id)

    if (error) {
      console.error('Password update error:', error)
      return NextResponse.json(
        { error: 'Could not update password' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
