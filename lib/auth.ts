import { supabase } from './supabase'
import crypto from 'crypto'

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex')
  return `${salt}:${hash}`
}

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

export async function hashPhrase(phrase: string): Promise<string> {
  return hashPassword(phrase)
}

export async function verifyPhrase(
  phrase: string,
  storedHash: string
): Promise<boolean> {
  return verifyPassword(phrase, storedHash)
}

export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, username, phrase_hash, password_hash, banned')
    .eq('username', username)
    .single()

  if (error) return null
  return data
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword)
  const { error } = await supabase
    .from('accounts')
    .update({ password_hash: hashedPassword })
    .eq('id', userId)

  if (error) throw new Error('Failed to update password')
  return true
}
