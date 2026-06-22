import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabase'
import crypto from 'crypto'

// Verify ECDSA signature using the stored public key
async function verifySignature(
  challenge: string,
  signatureBase64: string,
  publicKeyBase64: string
): Promise<boolean> {
  try {
    const publicKeyBytes = Buffer.from(publicKeyBase64, 'base64')
    const signatureBytes = Buffer.from(signatureBase64, 'base64')
    const challengeBytes = Buffer.from(challenge, 'utf8')

    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBytes,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    )

    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signatureBytes,
      challengeBytes
    )
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, challengeId, signature } = await req.json()

    if (!username || !challengeId || !signature) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Fetch the challenge — must exist, match username, and not be expired
    const { data: challengeRow } = await supabaseAdmin
      .from('login_challenges')
      .select('id, challenge, expires_at, username')
      .eq('id', challengeId)
      .single()

    if (!challengeRow) {
      return NextResponse.json({ error: 'Invalid challenge' }, { status: 401 })
    }

    if (challengeRow.username !== username) {
      return NextResponse.json({ error: 'Invalid challenge' }, { status: 401 })
    }

    if (new Date(challengeRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 401 })
    }

    // Delete challenge immediately — one use only, prevents replay attacks
    await supabaseAdmin
      .from('login_challenges')
      .delete()
      .eq('id', challengeId)

    // Fetch account public key
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('id, public_key')
      .eq('username', username)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Verify the signature
    const valid = await verifySignature(
      challengeRow.challenge,
      signature,
      account.public_key
    )

    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Signature valid — issue session token
    const token = crypto.randomBytes(32).toString('hex')

    // Store session token in login_challenges table
    await supabaseAdmin.from('login_challenges').insert({
      username,
      challenge: `session_${token}`,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })

    return NextResponse.json({ token })
  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
