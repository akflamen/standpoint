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
      setError(err instanceof Error ? err.message : 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] px-4">
      <div className="max-w-md w-full bg-white border border-[#d4c4a8] rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-[#2c1810] text-center">
          Reset password
        </h2>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4a2c1a]">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d4c4a8] bg-[#faf8f4] px-3 py-2.5 text-[#2c1810] focus:outline-none focus:border-[#2c1810]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a2c1a]">
                Recovery phrase
              </label>
              <textarea
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-[#d4c4a8] bg-[#faf8f4] px-3 py-2.5 text-[#2c1810] focus:outline-none focus:border-[#2c1810]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#2c1810] text-[#f5f0e8] font-medium hover:bg-[#4a2c1a] transition-colors"
            >
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'newPassword' && (
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4a2c1a]">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d4c4a8] bg-[#faf8f4] px-3 py-2.5 text-[#2c1810] focus:outline-none focus:border-[#2c1810]"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a2c1a]">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d4c4a8] bg-[#faf8f4] px-3 py-2.5 text-[#2c1810] focus:outline-none focus:border-[#2c1810]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-green-700 text-white font-medium disabled:opacity-50 hover:bg-green-800 transition-colors"
            >
              {loading ? 'Updating...' : 'Reset password'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="mt-6 text-center space-y-4">
            <p className="text-sm text-[#4a2c1a]">
              Your password has been updated. You can log in now.
            </p>
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="w-full py-2.5 rounded-lg bg-[#2c1810] text-[#f5f0e8] font-medium hover:bg-[#4a2c1a] transition-colors"
            >
              Go to login
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-[#8b7355]">
          <Link href="/auth/login" className="text-[#2c1810] hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
