// Generate a new keypair for a new account
export async function generateKeypair() {
  const keypair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true, // extractable so we can export and encrypt it for storage
    ['sign', 'verify']
  )

  const publicKeyRaw = await window.crypto.subtle.exportKey(
    'spki',
    keypair.publicKey
  )

  const privateKeyRaw = await window.crypto.subtle.exportKey(
    'pkcs8',
    keypair.privateKey
  )

  return {
    publicKeyBase64: btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw))),
    privateKeyBase64: btoa(String.fromCharCode(...new Uint8Array(privateKeyRaw))),
  }
}

// Derive an encryption key from the user's password using PBKDF2
async function deriveKeyFromPassword(password: string, salt: Uint8Array) {
  const enc = new TextEncoder()
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 250000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

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

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
  }
}

// Decrypt private key using password when user logs in
export async function decryptPrivateKey(
  encryptedBase64: string,
  saltBase64: string,
  ivBase64: string,
  password: string
) {
  const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))
  const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0))
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0))

  const derivedKey = await deriveKeyFromPassword(password, salt)

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    encrypted
  )

  return new TextDecoder().decode(decrypted)
}

// Sign a challenge string with the private key (used for login)
export async function signChallenge(challengeText: string, privateKeyBase64: string) {
  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0))
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  const enc = new TextEncoder()
  const signature = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    enc.encode(challengeText)
  )

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

// Generate a 12-word BIP39-style recovery phrase (uses first 12 words from entropy)
export function generateRecoveryPhrase(): string {
  const words = [
    'apple','bridge','canal','dance','eagle','flame','grace','honor',
    'ivory','jewel','karma','light','magic','noble','ocean','prism',
    'quest','river','solar','tower','ultra','vivid','water','xenon',
    'yield','zonal','amber','blaze','coral','drift','ember','frost',
    'glint','haven','inlet','joust','knack','lunar','mirth','nexus',
    'orbit','pilot','quill','realm','stead','tidal','unity','vapor',
    'whirl','xylem','young','zesty','arise','bloom','crisp','delta',
    'equip','focus','grasp','helix','image','joins','kinetic','latch',
    'mount','novel','onset','patch','quiet','revel','swift','trace',
    'urban','verge','width','exact','yarns','zones','atlas','brace',
    'chunk','depot','epoch','flank','grove','hinge','indie','joker',
    'kneel','lapse','medal','nerve','oxide','plank','quote','ridge',
    'shelf','trait','umbra','voice','waltz','xerus','yacht','zippy'
  ]
  const array = window.crypto.getRandomValues(new Uint8Array(12))
  return Array.from(array).map(n => words[n % words.length]).join(' ')
}