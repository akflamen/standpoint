// lib/auth.ts
import { supabase } from './supabase'
import crypto from 'crypto'

// Hash password with salt
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex')
  return `${salt}:${hash}`
}

// Verify password
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex')
  return hash === verifyHash
}

// Hash security phrase (same as password hashing)
export async function hashPhrase(phrase: string): Promise<string> {
  return hashPassword(phrase)
}

// Verify security phrase
export async function verifyPhrase(
  phrase: string,
  storedHash: string
): Promise<boolean> {
  return verifyPassword(phrase, storedHash)
}

// Get user by username
export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, username, phrase_hash, password_hash')
    .eq('username', username)
    .single()
  
  if (error) return null
  return data
}

// Update user password
export async function updateUserPassword(userId: string, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword)
  const { error } = await supabase
    .from('accounts')
    .update({ password_hash: hashedPassword })
    .eq('id', userId)
  
  if (error) throw new Error('Failed to update password')
  return true
}

// Get session from cookie
export async function getSession(): Promise<{ username: string; token: string } | null> {
  try {
    // Get session token from cookies (server-side)
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      return null
    }

    // Validate session in database
    const { data: session, error } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token', sessionToken)
      .single()

    if (error || !session) {
      return null
    }

    // Check if session expired
    const expiresAt = new Date(session.expires_at)
    if (expiresAt < new Date()) {
      // Delete expired session
      await supabase
        .from('sessions')
        .delete()
        .eq('token', sessionToken)
      return null
    }

    // Get user info
    const { data: user } = await supabase
      .from('accounts')
      .select('username')
      .eq('id', session.user_id)
      .single()

    if (!user) {
      return null
    }

    return {
      username: user.username,
      token: sessionToken,
    }

  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

// Get session for client-side usage (with cookie parsing)
export async function getClientSession(): Promise<{ username: string; token: string } | null> {
  try {
    // For client-side, we need to call the API
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.session || null

  } catch (error) {
    console.error('Get client session error:', error)
    return null
  }
}