import {
  generateKeypair,
  encryptPrivateKey,
  decryptPrivateKey,
  signChallenge,
  generateRecoveryPhrase,
} from './crypto'

const SESSION_KEY = 'standpoint_session'
const PRIVATE_KEY_PREFIX = 'standpoint_pk_'

// Save encrypted private key to localStorage (stays on device only)
function saveEncryptedKey(username: string, encrypted: string, salt: string, iv: string) {
  localStorage.setItem(`${PRIVATE_KEY_PREFIX}${username}`, JSON.stringify({ encrypted, salt, iv }))
}

// Load encrypted private key from localStorage
function loadEncryptedKey(username: string) {
  const raw = localStorage.getItem(`${PRIVATE_KEY_PREFIX}${username}`)
  if (!raw) return null
  return JSON.parse(raw) as { encrypted: string; salt: string; iv: string }
}

// Save session token so user stays logged in without re-entering password
function saveSession(username: string, token: string, expiresAt: number) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, token, expiresAt }))
}

// Get current session if it hasn't expired
export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  const session = JSON.parse(raw) as { username: string; token: string; expiresAt: number }
  if (Date.now() > session.expiresAt) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
  return session
}

// Clear session on logout
export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

// Sign up — generate keypair, encrypt private key, store public key on server
export async function signup(username: string, password: string) {
  // Generate keypair locally
  const { publicKeyBase64, privateKeyBase64 } = await generateKeypair()

  // Generate recovery phrase
  const recoveryPhrase = generateRecoveryPhrase()

  // Encrypt private key with password before storing on device
  const { encrypted, salt, iv } = await encryptPrivateKey(privateKeyBase64, password)
  saveEncryptedKey(username, encrypted, salt, iv)

  // Send only username + public key to server — password never leaves device
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, publicKey: publicKeyBase64 }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Signup failed')

  // Save session
  saveSession(username, data.token, Date.now() + 48 * 60 * 60 * 1000)

  // Return recovery phrase to show user ONCE — never stored anywhere
  return { recoveryPhrase }
}

// Login — fetch challenge, sign it with private key, verify on server
export async function login(username: string, password: string) {
  // Load encrypted private key from device
  const stored = loadEncryptedKey(username)
  if (!stored) throw new Error('No key found on this device for that username. Use your recovery phrase.')

  // Decrypt private key using password
  let privateKeyBase64: string
  try {
    privateKeyBase64 = await decryptPrivateKey(stored.encrypted, stored.salt, stored.iv, password)
  } catch {
    throw new Error('Wrong password.')
  }

  // Get a fresh challenge from server
  const challengeRes = await fetch('/api/auth/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
  const challengeData = await challengeRes.json()
  if (!challengeRes.ok) throw new Error(challengeData.error || 'Could not get challenge')

  // Sign the challenge with private key
  const signature = await signChallenge(challengeData.challenge, privateKeyBase64)

  // Send signature to server to verify
  const verifyRes = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, challengeId: challengeData.challengeId, signature }),
  })
  const verifyData = await verifyRes.json()
  if (!verifyRes.ok) throw new Error(verifyData.error || 'Login failed')

  // Save session for 48 hours
  saveSession(username, verifyData.token, Date.now() + 48 * 60 * 60 * 1000)
}

// Check if this device has a saved key for a username (for auto-login hint)
export function hasLocalKey(username: string) {
  return !!loadEncryptedKey(username)
}