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
      {/* Header Block */}
      <div className="text-center mb-6">
        <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-900/10 border border-amber-900/10 inline-block text-amber-900 mb-3">
          SECURE PERIMETER LOGIN
        </span>
        <h2 className="text-3xl font-serif font-black tracking-tight text-amber-950">
          Account Sign In
        </h2>
        <p className="mt-1 text-xs font-mono opacity-60 uppercase tracking-wide">
          Provide access credentials to authorize entry
        </p>
      </div>

      {/* Error Alert Feed */}
      {error && (
        <div className="mb-5 rounded border-l-4 border-red-600 bg-red-950/5 p-3 text-xs font-mono text-red-900 leading-normal">
          <span className="font-bold uppercase mr-1">[ACCESS REJECTED]:</span> {error}
        </div>
      )}

      {/* Form Interface */}
      <form onSubmit={handleSubmit} className="space-y-4 font-mono">
        <div>
          <label className="block text-xs uppercase font-black tracking-wider text-amber-900/80 mb-1.5">
            Operative Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#fafaf9] border border-amber-900/20 rounded px-3 py-2.5 text-sm text-amber-950 focus:outline-none focus:border-amber-800 shadow-inner"
            placeholder="your_username"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-black tracking-wider text-amber-900/80 mb-1.5">
            Access Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#fafaf9] border border-amber-900/20 rounded px-3 py-2.5 text-sm text-amber-950 focus:outline-none focus:border-amber-800 shadow-inner"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex items-center justify-between text-xs font-bold pt-1">
          <label className="flex items-center gap-2 text-amber-900/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-amber-800 rounded border-amber-900/30"
            />
            <span>Maintain Terminal Handshake</span>
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-amber-800 hover:underline uppercase tracking-wide"
          >
            Recover Credentials?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-900 hover:bg-amber-800 disabled:bg-amber-900/40 text-amber-50 py-3.5 rounded font-bold text-xs uppercase tracking-widest transition-all shadow-md mt-6"
        >
          {loading ? 'AUTHENTICATING TOKEN COMPONENT...' : 'ESTABLISH SECURE LINK'}
        </button>
      </form>

      {/* Visual Separation Line */}
      <div className="my-6 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-amber-900/10" />
        </div>
        <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest">
          <span className="px-3 bg-[#fff7ed] text-amber-900/40 font-bold">OR</span>
        </div>
      </div>

      {/* Navigation Redirect Footer */}
      <p className="text-center text-xs font-mono opacity-70 tracking-wide">
        Lacking registered credentials?{' '}
        <Link href="/auth/signup" className="text-amber-800 hover:underline font-bold uppercase ml-1">
          Generate an Identifier
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center px-4 py-10">
      {/* Manila Index Card Wrapper */}
      <div className="w-full max-w-md bg-[#fff7ed] text-amber-950 border border-[#fed7aa] p-8 md:p-10 shadow-[6px_6px_20px_rgba(0,0,0,0.4)] relative rounded-sm transform rotate-1">
        
        {/* Decorative Top Red Pin */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
          <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
        </div>

        <Suspense fallback={
          <div className="text-center font-mono text-xs text-amber-900/60 py-10 uppercase tracking-widest animate-pulse">
            Syncing Authorization Handshakes...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}