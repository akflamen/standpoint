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
    <div className="max-w-md w-full bg-white border border-[#d4c4a8] rounded-2xl shadow-lg p-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#2c1810]">Standpoint</h2>
        <p className="mt-2 text-[#8b7355]">Log in with username and password</p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#4a2c1a]">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#d4c4a8] bg-[#faf8f4] px-3 py-2.5 text-[#2c1810] focus:outline-none focus:border-[#2c1810]"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4a2c1a]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#d4c4a8] bg-[#faf8f4] px-3 py-2.5 text-[#2c1810] focus:outline-none focus:border-[#2c1810]"
            required
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-[#4a2c1a]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          <Link href="/auth/forgot-password" className="text-[#2c1810] hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[#2c1810] text-[#f5f0e8] font-medium disabled:opacity-50 hover:bg-[#4a2c1a] transition-colors"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#8b7355]">
        No account yet?{' '}
        <Link href="/auth/signup" className="text-[#2c1810] font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] px-4">
      <Suspense fallback={<div className="text-[#8b7355]">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
