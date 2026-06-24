import { supabase } from './supabase'
import crypto from 'crypto'

/**
 * Hash a password securely using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against its stored hash
 */
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

/**
 * Hash a recovery phrase securely
 * Normalize spaces before hashing so signup and reset match
 */
export async function hashPhrase(phrase: string): Promise<string> {
  const normalized = phrase.trim().replace(/\s+/g, ' ')
  return hashPassword(normalized)
}

/**
 * Verify a recovery phrase against its stored hash
 */
export async function verifyPhrase(
  phrase: string,
  storedHash: string
): Promise<boolean> {
  const normalized = phrase.trim().replace(/\s+/g, ' ')
  return verifyPassword(normalized, storedHash)
}

/**
 * Fetch user by username
 */
export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, username, phrase_hash, password_hash, banned')
    .eq('username', username)
    .single()

  if (error) return null
  return data
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: string, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword)
  const { error } = await supabase
    .from('accounts')
    .update({ password_hash: hashedPassword })
    .eq('id', userId)

  if (error) throw new Error('Failed to update password')
  return true
}
