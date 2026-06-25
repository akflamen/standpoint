'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Step = 'form' | 'phrase' | 'done'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [recoveryPhrase, setRecoveryPhrase] = useState('')
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      setRecoveryPhrase(data.recoveryPhrase)
      setStep('phrase')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPhrase = async () => {
    await navigator.clipboard.writeText(recoveryPhrase)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // --- Step 2: Display Generated 12-Word Secret Token Card ---
  if (step === 'phrase') {
    return (
      <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center px-4 py-10 select-none">
        
        {/* Lime/Green Success Note Card */}
        <div className="w-full max-w-2xl bg-[#ecfccb] text-lime-950 border border-[#d9f99d] p-8 md:p-10 shadow-[6px_6px_20px_rgba(0,0,0,0.4)] relative rounded-sm transform rotate-1">
          
          {/* Green Pushpin Top Anchor */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
            <div className="w-3.5 h-3.5 rounded-full bg-green-600 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
            <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setStep('form')}
            className="absolute top-4 left-4 text-xs font-mono text-lime-900/60 hover:text-lime-900 transition-colors flex items-center gap-1"
          >
            ← Back
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded bg-lime-900/10 border border-lime-900/10 inline-block text-lime-900 mb-3">
              GENERATE SECURE ENTITY BLOCK
            </span>
            <h2 className="text-2xl font-mono font-black uppercase tracking-tight">Save Recovery Phrase</h2>
            <p className="mt-1 text-xs font-mono opacity-70 uppercase tracking-wide">
              The sole cryptographic anchor allowed for account override
            </p>
          </div>

          {/* Warning Block */}
          <div className="mb-6 rounded border-l-4 border-amber-600 bg-amber-950/5 p-4 text-xs font-mono text-amber-900 leading-relaxed">
            <p className="font-black uppercase tracking-wider mb-1">
              ⚠️ CRITICAL PROTOCOL WARNING:
            </p>
            <p>
              This string is completely un-indexed on our centralized database network. If misplaced, account recovery is mathematically impossible. Anyone possessing this key block can override your active password string.
            </p>
          </div>

          {/* Recovery Phrase Text Deck */}
          <div className="mb-6 font-mono">
            <label className="block text-xs uppercase font-black tracking-wider text-lime-900/80 mb-2">
              Generated Secure Seed Array
            </label>
            <div className="rounded border border-lime-900/20 bg-lime-50/50 p-5 shadow-inner">
              <p className="font-mono text-sm tracking-wide text-lime-950 leading-relaxed break-words text-center select-text selection:bg-lime-200">
                {recoveryPhrase || "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"}
              </p>
            </div>
          </div>

          {/* Copy Button Trigger */}
          <button
            type="button"
            onClick={handleCopyPhrase}
            className={`w-full font-mono text-xs uppercase tracking-widest py-3.5 rounded font-bold shadow transition-all ${
              copied
                ? 'bg-green-700 text-green-50'
                : 'bg-lime-900 hover:bg-lime-800 text-lime-50'
            }`}
          >
            {copied ? '✓ SYNCED TO SYSTEM CLIPBOARD' : '📋 COPY SECRET TOKEN ARRAY'}
          </button>

          {/* Compliance Checkbox */}
          <label className="flex items-start gap-3 p-4 rounded border border-lime-900/10 bg-lime-50/30 mt-4 font-mono text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-lime-800 rounded"
            />
            <span className="text-lime-900/80 leading-normal">
              I certify that I have physically recorded or safely committed this secret phrase matrix to an offline medium.
            </span>
          </label>

          {/* Execution Pipeline Submit */}
          <button
            type="button"
            disabled={!confirmed}
            onClick={() => router.push('/')}
            className="w-full mt-6 bg-lime-950 hover:bg-lime-900 disabled:bg-lime-950/20 text-lime-50 font-mono text-xs uppercase py-3.5 rounded font-bold tracking-widest transition-all shadow-md"
          >
            INITIALIZE STANDPOINT SESSION →
          </button>
        </div>
      </div>
    )
  }

  // --- Step 1: Base Identifier Credentials Form ---
  return (
    <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center px-4 py-10">
      
      {/* Manila Index Card Wrapper */}
      <div className="w-full max-w-md bg-[#fff7ed] text-amber-950 border border-[#fed7aa] p-8 md:p-10 shadow-[6px_6px_20px_rgba(0,0,0,0.4)] relative rounded-sm transform -rotate-1">
        
        {/* Blue Pushpin Top Anchor */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
          <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
        </div>

        {/* Back Button to Homepage */}
        <Link
          href="/"
          className="absolute top-4 left-4 text-xs font-mono text-amber-900/60 hover:text-amber-900 transition-colors flex items-center gap-1"
        >
          ← Home
        </Link>

        {/* Header Block */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-900/10 border border-amber-900/10 inline-block text-amber-900 mb-3">
            IDENTIFIER DISCOVERY MANIFEST
          </span>
          <h2 className="text-3xl font-serif font-black tracking-tight text-amber-950">
            Create Account
          </h2>
          <p className="mt-1 text-xs font-mono opacity-60 uppercase tracking-wide">
            Provision an anonymous cryptographic alias
          </p>
        </div>

        {/* Error Notification Desk */}
        {error && (
          <div className="mb-5 rounded border-l-4 border-red-600 bg-red-950/5 p-3 text-xs font-mono text-red-900 leading-normal">
            <span className="font-bold uppercase mr-1">[MANIFEST REJECTED]:</span> {error}
          </div>
        )}

        {/* Form Inputs Data Track */}
        <form onSubmit={handleSignup} className="space-y-4 font-mono">
          <div>
            <label className="block text-xs uppercase font-black tracking-wider text-amber-900/80 mb-1.5">
              Operative Handle Alias
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#fafaf9] border border-amber-900/20 rounded px-3 py-2.5 text-sm text-amber-950 focus:outline-none focus:border-amber-800 shadow-inner"
              placeholder="your_username"
              required
              minLength={3}
              maxLength={20}
              autoFocus
            />
            <p className="mt-1 text-[10px] opacity-60 lowercase leading-tight">
              * 3-20 strings using characters, integers, or underscore tokens only
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase font-black tracking-wider text-amber-900/80 mb-1.5">
              Secure Cipher Key
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#fafaf9] border border-amber-900/20 rounded px-3 py-2.5 text-sm text-amber-950 focus:outline-none focus:border-amber-800 shadow-inner"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <p className="mt-1 text-[10px] opacity-60 lowercase leading-tight">
              * minimum length allocation must equal 6 characters
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase font-black tracking-wider text-amber-900/80 mb-1.5">
              Re-verify Key Alignment
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
            className="w-full bg-amber-900 hover:bg-amber-800 disabled:bg-amber-900/40 text-amber-50 py-3.5 rounded font-bold text-xs uppercase tracking-widest transition-all shadow-md mt-6"
          >
            {loading ? 'COMPILING ALLOCATION ROUTINE...' : 'GENERATE ROOT COMPONENT'}
          </button>
        </form>

        {/* Visual Partition Line */}
        <div className="my-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-amber-900/10" />
          </div>
          <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest">
            <span className="px-3 bg-[#fff7ed] text-amber-900/40 font-bold">OR</span>
          </div>
        </div>

        {/* Footer Navigation Link */}
        <p className="text-center text-xs font-mono opacity-70 tracking-wide">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-amber-800 hover:underline font-bold uppercase ml-1">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}