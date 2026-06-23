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
  }

  if (step === 'phrase') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] px-4">
        <div className="max-w-lg w-full bg-white border border-[#d4c4a8] rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2c1810] text-center">
            Save your recovery phrase
          </h2>
          <p className="mt-3 text-sm text-[#8b7355] text-center leading-relaxed">
            This 12-word phrase is the only way to reset your password. We never
            store it in plain text and cannot show it again.
          </p>

          <div className="mt-6 rounded-xl bg-[#faf8f4] border border-[#d4c4a8] p-5">
            <p className="text-[#2c1810] font-mono text-sm leading-7 tracking-wide">
              {recoveryPhrase}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyPhrase}
            className="mt-4 w-full py-2.5 rounded-lg border border-[#2c1810] text-[#2c1810] text-sm font-medium hover:bg-[#f5f0e8] transition-colors"
          >
            {copied ? 'Copied to clipboard' : 'Copy phrase'}
          </button>

          <label className="mt-5 flex items-start gap-3 text-sm text-[#4a2c1a]">
            <input
              type="checkbox"
              checked={copied}
              onChange={(e) => setCopied(e.target.checked)}
              className="mt-1"
            />
            <span>I have saved this phrase somewhere safe</span>
          </label>

          <button
            type="button"
            disabled={!copied}
            onClick={() => router.push('/')}
            className="mt-6 w-full py-2.5 rounded-lg bg-[#2c1810] text-[#f5f0e8] font-medium disabled:opacity-40 hover:bg-[#4a2c1a] transition-colors"
          >
            Continue to homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] px-4">
      <div className="max-w-md w-full bg-white border border-[#d4c4a8] rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#2c1810]">Standpoint</h2>
          <p className="mt-2 text-[#8b7355]">Create your anonymous account</p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
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
              minLength={3}
              autoFocus
            />
            <p className="mt-1 text-xs text-[#8b7355]">3-20 characters, letters/numbers/_</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4a2c1a]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            className="w-full py-2.5 rounded-lg bg-[#2c1810] text-[#f5f0e8] font-medium disabled:opacity-50 hover:bg-[#4a2c1a] transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#8b7355]">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#2c1810] font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
