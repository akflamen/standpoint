'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Step = 'credentials' | 'newPassword' | 'done'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('credentials')
  const [username, setUsername] = useState('')
  const [phrase, setPhrase] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Verify phrase
  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !phrase.trim()) {
      setError('Username and recovery phrase are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-phrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phrase }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Phrase verification failed')
      }

      setStep('newPassword')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Phrase verification failed')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Reset password
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phrase, newPassword }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not reset password')
      }

      setStep('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  // Render Success Note Card
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center px-4 py-10 select-none">
        <div className="w-full max-w-md bg-[#ecfccb] text-lime-950 border border-[#d9f99d] p-8 md:p-10 shadow-[6px_6px_20px_rgba(0,0,0,0.4)] text-center relative rounded-sm transform rotate-1">
          {/* Green Pushpin */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
            <div className="w-3.5 h-3.5 rounded-full bg-green-600 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
            <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
          </div>

          <div className="w-12 h-12 rounded-xl bg-lime-900 flex items-center justify-center mx-auto mb-4 text-lime-50 font-black text-xl shadow-md">
            ✓
          </div>
          <h2 className="text-2xl font-mono font-black uppercase tracking-tight">Access Granted</h2>
          <p className="mt-3 font-serif text-sm opacity-80 leading-relaxed">
            Your keypair credentials have successfully synchronized. The prior network authorization hash has been overridden.
          </p>

          <Link
            href="/auth/login"
            className="mt-6 w-full bg-lime-900 hover:bg-lime-800 text-lime-50 font-mono text-xs uppercase py-3 rounded font-bold shadow tracking-widest inline-block transition-all"
          >
            Authenticate Session Login →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center px-4 py-10">
      
      {/* Manila Index Card Container Form */}
      <div className="w-full max-w-md bg-[#fff7ed] text-amber-950 border border-[#fed7aa] p-8 md:p-10 shadow-[6px_6px_20px_rgba(0,0,0,0.4)] relative rounded-sm transform -rotate-1">
        
        {/* Blue Pushpin Top Anchor */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
          <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
        </div>

        {/* Header Block */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-900/10 border border-amber-900/10 inline-block text-amber-900 mb-3">
            Identity Override Terminal
          </span>
          <h2 className="text-2xl font-serif font-black tracking-tight text-amber-950">
            {step === 'credentials' ? 'Credentials Recovery' : 'Rewrite Key Token'}
          </h2>
          <p className="mt-1 text-xs font-mono opacity-60 uppercase tracking-wide">
            {step === 'credentials'
              ? 'Enter network token context variables'
              : 'Affix updated secure secret string'}
          </p>
        </div>

        {/* Tactical Ledger Step Timeline Track */}
        <div className="flex gap-1.5 mb-6">
          <div className={`flex-1 h-1.5 rounded-sm ${step === 'credentials' ? 'bg-amber-800' : 'bg-amber-900/10'}`} />
          <div className={`flex-1 h-1.5 rounded-sm ${step === 'newPassword' ? 'bg-amber-800' : 'bg-amber-900/10'}`} />
        </div>

        {/* Error Feed Log */}
        {error && (
          <div className="mb-5 rounded border-l-4 border-red-600 bg-red-950/5 p-3 text-xs font-mono text-red-900 leading-normal">
            <span className="font-bold uppercase mr-1">[OVERRIDE REJECTED]:</span> {error}
          </div>
        )}

        {/* Step 1 Form Payload: Verification parameters */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4 font-mono">
            <div>
              <label className="block text-xs uppercase font-black tracking-wider text-amber-900/80 mb-1.5">
                Target Operative Handle
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#fafaf9] border border-amber-900/20 rounded px-3 py-2.5 text-sm text-amber-950 focus:outline-none focus:border-amber-800 shadow-inner"
                placeholder="codename_alias"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-black tracking-wider text-amber-900/80 mb-1.5">
                12-Word Recovery Token Phrase
              </label>
              <textarea
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                className="w-full bg-[#fafaf9] border border-amber-900/20 rounded px-3 py-2.5 text-xs text-amber-950 focus:outline-none focus:border-amber-800 font-mono resize-none shadow-inner leading-relaxed"
                placeholder="word1 word2 word3..."
                rows={3}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-900 hover:bg-amber-800 disabled:bg-amber-900/40 text-amber-50 py-3 rounded font-bold text-xs uppercase tracking-widest transition-all shadow mt-2"
            >
              {loading ? 'CROSS-CHECKING SHA-256...' : 'VALIDATE RECOVERY MATRICES'}
            </button>
          </form>
        )}

        {/* Step 2 Form Payload: Modifying structural hash */}
        {step === 'newPassword' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 font-mono">
            <div>
              <label className="block text-xs uppercase font-black tracking-wider text-amber-900/80 mb-1.5">
                Injected Password String
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#fafaf9] border border-amber-900/20 rounded px-3 py-2.5 text-sm text-amber-950 focus:outline-none focus:border-amber-800 shadow-inner"
                placeholder="••••••••"
                required
                minLength={6}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-black tracking-wider text-amber-900/80 mb-1.5">
                Re-verify Password Alignment
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#fafaf9] border border-amber-900/20 rounded px-3 py-2.5 text-sm text-amber-950 focus:outline-none focus:border-amber-800 shadow-inner"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-900 hover:bg-amber-800 disabled:bg-amber-900/40 text-amber-50 py-3 rounded font-bold text-xs uppercase tracking-widest transition-all shadow mt-2"
            >
              {loading ? 'OVERWRITING CREDENTIAL BLOCK...' : 'INJECT REWRITTEN KEY'}
            </button>
          </form>
        )}

        {/* Bottom Backtrack Navigation Footer block */}
        <p className="mt-6 text-center text-xs font-mono opacity-70 tracking-wide border-t border-amber-900/10 pt-4">
          Remember authentication vectors?{' '}
          <Link href="/auth/login" className="text-amber-800 hover:underline font-bold uppercase ml-1">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}