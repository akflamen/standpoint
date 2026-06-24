'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      const next = searchParams.get('next') || '/'
      router.push(next)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--sp-accent)] to-[var(--sp-secondary)] flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">S</span>
        </div>
        <h2 className="text-3xl font-bold text-[var(--sp-text)]">Welcome back</h2>
        <p className="mt-2 text-[var(--sp-text-muted)]">Sign in to your Standpoint account</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full sp-input sp-input-glow rounded-lg px-4 py-3"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-[var(--sp-text)]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded"
            />
            <span>Remember me</span>
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-[var(--sp-accent)] hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sp-btn-primary py-3 rounded-lg font-semibold text-base disabled:opacity-50 mt-6"
        >
          {loading ? 'Signing in...' : 'Sign In'}
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

      {/* Sign Up Link */}
      <p className="text-center text-sm text-[var(--sp-text-muted)]">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-[var(--sp-accent)] hover:underline font-semibold">
          Create one now
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="sp-page min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-8 md:p-10 shadow-xl">
        <Suspense fallback={<div className="text-center text-[var(--sp-text-muted)]">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
