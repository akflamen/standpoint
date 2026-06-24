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

  if (step === 'phrase') {
    return (
      <div className="sp-page min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-8 md:p-10 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">✓</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--sp-text)]">Save Your Recovery Phrase</h2>
            <p className="mt-2 text-[var(--sp-text-muted)]">
              This is the only way to reset your password
            </p>
          </div>

          {/* Security Warning */}
          <div className="mb-6 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-4">
            <p className="text-sm text-amber-900 dark:text-amber-200 font-semibold">
              🔐 Critical: Save this phrase safely
            </p>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
              We never store this phrase and cannot show it again. Anyone with this phrase can reset your password.
            </p>
          </div>

          {/* Recovery Phrase Display */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[var(--sp-text)] mb-3">
              Your 12-Word Recovery Phrase
            </label>
            <div className="rounded-xl border-2 border-[var(--sp-border)] bg-[var(--sp-bg-soft)] p-6">
              <div className="grid grid-cols-3 gap-4">
                {recoveryPhrase.split(' ').map((word, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--sp-text-muted)] min-w-[1.5rem]">
                      {index + 1}.
                    </span>
                    <span className="font-mono text-sm font-semibold text-[var(--sp-text)]">
                      {word}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyPhrase}
            className={`w-full py-3 rounded-lg font-semibold text-sm mb-4 transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'sp-btn-secondary'
            }`}
          >
            {copied ? '✓ Copied to Clipboard' : '📋 Copy Phrase'}
          </button>

          {/* Checkbox */}
          <label className="flex items-start gap-3 p-4 rounded-lg border border-[var(--sp-border)] bg-[var(--sp-bg-soft)]">
            <input
              type="checkbox"
              checked={copied}
              onChange={(e) => setCopied(e.target.checked)}
              className="mt-1 w-4 h-4 rounded"
            />
            <span className="text-sm text-[var(--sp-text)]">
              I have saved this recovery phrase in a secure location
            </span>
          </label>

          {/* Continue Button */}
          <button
            type="button"
            disabled={!copied}
            onClick={() => router.push('/')}
            className="w-full mt-6 sp-btn-primary py-3 rounded-lg font-semibold text-base disabled:opacity-50"
          >
            Continue to Standpoint
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sp-page min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-8 md:p-10 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--sp-accent)] to-[var(--sp-secondary)] flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h2 className="text-3xl font-bold text-[var(--sp-text)]">Create Account</h2>
          <p className="mt-2 text-[var(--sp-text-muted)]">Join Standpoint anonymously</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--sp-text)] mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full sp-input sp-input-glow rounded-lg px-4 py-3"
              placeholder="your_username"
              required
              minLength={3}
              autoFocus
            />
            <p className="mt-1 text-xs text-[var(--sp-text-muted)]">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--sp-text)] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full sp-input sp-input-glow rounded-lg px-4 py-3"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <p className="mt-1 text-xs text-[var(--sp-text-muted)]">
              Minimum 6 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--sp-text)] mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full sp-input sp-input-glow rounded-lg px-4 py-3"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sp-btn-primary py-3 rounded-lg font-semibold text-base disabled:opacity-50 mt-6"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--sp-border)]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-[var(--sp-card)] text-[var(--sp-text-muted)]">or</span>
          </div>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-[var(--sp-text-muted)]">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[var(--sp-accent)] hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
