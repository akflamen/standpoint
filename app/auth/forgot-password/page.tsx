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

      // ✅ Only move forward if phrase is valid
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

  if (step === 'done') {
    return (
      <div className="sp-page min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-8 md:p-10 shadow-xl text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">✓</span>
          </div>
          <h2 className="text-3xl font-bold text-[var(--sp-text)]">Password Reset</h2>
          <p className="mt-3 text-[var(--sp-text-body)]">
            Your password has been successfully reset. You can now log in with your new password.
          </p>

          <Link
            href="/auth/login"
            className="mt-6 w-full sp-btn-primary py-3 rounded-lg font-semibold text-base inline-block"
          >
            Return to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="sp-page min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-8 md:p-10 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">🔑</span>
          </div>
          <h2 className="text-3xl font-bold text-[var(--sp-text)]">
            {step === 'credentials' ? 'Reset Password' : 'New Password'}
          </h2>
          <p className="mt-2 text-[var(--sp-text-muted)]">
            {step === 'credentials'
              ? 'Enter your username and recovery phrase'
              : 'Create a new password for your account'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-2 mb-6">
          <div className={`flex-1 h-2 rounded-full ${step === 'credentials' ? 'bg-[var(--sp-accent)]' : 'bg-[var(--sp-bg-soft)]'}`} />
          <div className={`flex-1 h-2 rounded-full ${step === 'newPassword' ? 'bg-[var(--sp-accent)]' : 'bg-[var(--sp-bg-soft)]'}`} />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Step 1: Credentials */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--sp-text)] mb-2">
                Recovery Phrase
              </label>
              <textarea
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                className="w-full sp-input sp-input-glow rounded-lg px-4 py-3 font-mono text-sm resize-none"
                placeholder="Paste your 12-word recovery phrase..."
                rows={3}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sp-btn-primary py-3 rounded-lg font-semibold text-base disabled:opacity-50 mt-6"
            >
              {loading ? 'Verifying...' : 'Verify Recovery Phrase'}
            </button>
          </form>
        )}

        {/* Step 2: New Password */}
        {step === 'newPassword' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--sp-text)] mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full sp-input sp-input-glow rounded-lg px-4 py-3"
                placeholder="••••••••"
                required
                minLength={6}
                autoFocus
              />
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <p className="mt-6 text-center text-sm text-[var(--sp-text-muted)]">
          Remember your password?{' '}
          <Link href="/auth/login" className="text-[var(--sp-accent)] hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
