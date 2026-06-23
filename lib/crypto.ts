// lib/crypto.ts

// ===============================
// 1. RECOVERY PHRASE GENERATION
// ===============================

// Generate a 12-word BIP39-style recovery phrase
export function generateRecoveryPhrase(): string {
  const wordList = [
    'apple', 'bridge', 'canal', 'dance', 'eagle', 'flame', 'grace', 'honor',
    'ivory', 'jewel', 'karma', 'light', 'magic', 'noble', 'ocean', 'prism',
    'quest', 'river', 'solar', 'tower', 'ultra', 'vivid', 'water', 'xenon',
    'yield', 'zonal', 'amber', 'blaze', 'coral', 'drift', 'ember', 'frost',
    'glint', 'haven', 'inlet', 'joust', 'knack', 'lunar', 'mirth', 'nexus',
    'orbit', 'pilot', 'quill', 'realm', 'stead', 'tidal', 'unity', 'vapor',
    'whirl', 'xylem', 'young', 'zesty', 'arise', 'bloom', 'crisp', 'delta',
    'equip', 'focus', 'grasp', 'helix', 'image', 'joins', 'kinetic', 'latch',
    'mount', 'novel', 'onset', 'patch', 'quiet', 'revel', 'swift', 'trace',
    'urban', 'verge', 'width', 'exact', 'yarns', 'zones', 'atlas', 'brace',
    'chunk', 'depot', 'epoch', 'flank', 'grove', 'hinge', 'indie', 'joker',
    'kneel', 'lapse', 'medal', 'nerve', 'oxide', 'plank', 'quote', 'ridge',
    'shelf', 'trail', 'umbra', 'voice', 'waltz', 'xerus', 'yacht', 'zippy'
  ]

  // Generate 12 random indices
  const array = new Uint8Array(12)
  window.crypto.getRandomValues(array)
  
  // Map indices to words and join with space
  const words = Array.from(array).map(n => wordList[n % wordList.length])
  return words.join(' ')  // ✅ Fixed: proper join with space
}

// ===============================
// 2. KEYPAIR GENERATION (ECDSA P-256)
// ===============================

export async function generateKeypair() {
  const keypair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true, // extractable so we can export and encrypt it
    ['sign', 'verify']
  )

  // Export public key
  const publicKeyRaw = await window.crypto.subtle.exportKey(
    'spki',
    keypair.publicKey
  )

  // Export private key
  const privateKeyRaw = await window.crypto.subtle.exportKey(
    'pkcs8',
    keypair.privateKey
  )

  return {
    publicKeyBase64: btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw))),
    privateKeyBase64: btoa(String.fromCharCode(...new Uint8Array(privateKeyRaw))),
  }
}

// ===============================
// 3. PASSWORD-BASED KEY DERIVATION (PBKDF2)
// ===============================

// Derive an encryption key from the user's password using PBKDF2
export async function deriveKeyFromPassword(password: string, salt: Uint8Array | ArrayBuffer) {
  const enc = new TextEncoder()
  
  // Import password as raw key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Derive AES-GCM key using PBKDF2
  // Ensure salt is a BufferSource (Uint8Array) to satisfy WebCrypto TS types
  const saltBuffer = salt instanceof Uint8Array ? salt : new Uint8Array(salt as ArrayBuffer)

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 250000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// ===============================
// 4. ENCRYPT / DECRYPT PRIVATE KEY
// ===============================

// Encrypt private key with password before storing on device
export async function encryptPrivateKey(privateKeyBase64: string, password: string) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  
  const derivedKey = await deriveKeyFromPassword(password, salt)
  const enc = new TextEncoder()
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    enc.encode(privateKeyBase64)
  )

  // Return salt, iv, and encrypted data as base64
  return {
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  }
}

// Decrypt private key with password
export async function decryptPrivateKey(
  encryptedData: string,
  password: string,
  saltBase64: string,
  ivBase64: string
) {
  // Convert base64 to Uint8Array
  const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0))
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0))
  const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))

  const derivedKey = await deriveKeyFromPassword(password, salt)

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    encrypted
  )

  return new TextDecoder().decode(decrypted)
}

// ===============================
// 5. SIGN CHALLENGE WITH PRIVATE KEY
// ===============================

// Sign a challenge using the private key
export async function signChallenge(challengeText: string, privateKeyBase64: string) {
  // Convert base64 to ArrayBuffer
  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0))
  
  // Import private key
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  // Sign the challenge
  const enc = new TextEncoder()
  const signature = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    enc.encode(challengeText)
  )

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

// ===============================
// 6. VERIFY SIGNATURE WITH PUBLIC KEY
// ===============================

// Verify a signature using the public key
export async function verifySignature(
  challengeText: string,
  signatureBase64: string,
  publicKeyBase64: string
) {
  // Convert base64 to ArrayBuffer
  const publicKeyBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0))
  const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0))

  // Import public key
  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    publicKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  )

  // Verify signature
  const enc = new TextEncoder()
  return window.crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    signatureBytes,
    enc.encode(challengeText)
  )
}

// ===============================
// 7. HELPER: BASE64 UTILITIES
// ===============================

// Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

// Convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}