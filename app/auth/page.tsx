'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signup, login, hasLocalKey } from '@/lib/auth'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recoveryPhrase, setRecoveryPhrase] = useState('')

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { recoveryPhrase: phrase } = await signup(username.trim(), password)
        setRecoveryPhrase(phrase)
      } else {
        await login(username.trim(), password)
        router.push('/')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Show recovery phrase screen after successful signup
  if (recoveryPhrase) {
    return (
      <main className="min-h-screen bg-[#f5f0e8] flex items-center justify-center px-4">
        <div className="bg-white border border-[#d4c4a8] rounded-lg p-6 max-w-md w-full shadow-md">
          <h2 className="text-lg font-bold text-[#2c1810] mb-2">Save Your Recovery Phrase</h2>
          <p className="text-sm text-[#8b7355] mb-4">
            Write these 12 words down and keep them somewhere safe. This is the
            only way to recover your account if you lose access to this device.
            We will never show this again.
          </p>
          <div className="bg-[#faf8f4] border border-[#d4c4a8] rounded p-4 mb-4">
            <p className="text-sm font-mono text-[#2c1810] leading-relaxed break-words">
              {recoveryPhrase}
            </p>
          </div>
          <p className="text-xs text-red-600 mb-4 font-medium">
            ⚠ Do not share this phrase with anyone. Anyone with these words can access your account.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-[#2c1810] text-[#f5f0e8] py-2.5 rounded font-medium hover:bg-[#4a2c1a] transition-colors text-sm"
          >
            I have saved my phrase — Continue
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8] flex items-center justify-center px-4">
      <div className="bg-white border border-[#d4c4a8] rounded-lg p-6 max-w-sm w-full shadow-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#2c1810]">Standpoint</h1>
          <p className="text-xs text-[#8b7355] mt-1">Anonymous debate. Real ideas.</p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-[#f5f0e8] rounded p-1 mb-5">
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-[#2c1810] text-[#f5f0e8]'
                : 'text-[#8b7355] hover:text-[#2c1810]'
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => { setMode('signup'); setError('') }}
            className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${
              mode === 'signup'
                ? 'bg-[#2c1810] text-[#f5f0e8]'
                : 'text-[#8b7355] hover:text-[#2c1810]'
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Username */}
        <div className="mb-3">
          <label className="text-xs font-medium text-[#2c1810] block mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="letters, numbers, underscores"
            className="w-full border border-[#d4c4a8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#2c1810] bg-[#faf8f4]"
          />
          {mode === 'login' && username && !hasLocalKey(username) && (
            <p className="text-xs text-amber-600 mt-1">
              No key found on this device for that username.
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[#2c1810] block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="choose a strong password"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full border border-[#d4c4a8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#2c1810] bg-[#faf8f4]"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 mb-3">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#2c1810] text-[#f5f0e8] py-2.5 rounded font-medium hover:bg-[#4a2c1a] transition-colors text-sm disabled:opacity-50"
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Log in'}
        </button>

        {/* Signup note */}
        {mode === 'signup' && (
          <p className="text-xs text-[#8b7355] mt-4 text-center">
            No email or phone needed. Your username and password are all we ask for.
          </p>
        )}

        {/* Login hint */}
        {mode === 'login' && (
          <p className="text-xs text-[#8b7355] mt-4 text-center">
            Your private key stays on this device only. Logging in from a new device requires your recovery phrase.
          </p>
        )}
      </div>
    </main>
  )
}