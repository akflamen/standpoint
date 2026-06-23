'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
// Replace the old placeholder import with this:
import { generateKeypair } from '@/lib/crypto'

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Basic Validations
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
  // 2. Generate the keypair from your crypto engine
  setLoading(true)
  const { publicKeyBase64, privateKeyBase64 } = await generateKeypair()

  // 3. Send the payload with the required publicKey to the backend
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      username, 
      password, 
      publicKey: publicKeyBase64 // This satisfies the backend requirement!
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Signup failed')
  }

  // OPTIONAL: If you want to store the private key locally in the browser 
  // so the user can sign things later without downloading it again:
  // localStorage.setItem('standpoint_privkey', privateKeyBase64)

  setSuccess(true)
  setTimeout(() => {
    router.push('/auth/login')
  }, 3000)

} catch (err: any) {
  setError(err.message)
} finally {
  setLoading(false)
}
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Standpoint
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Create your account
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
              autoFocus
              minLength={3}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 3 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 font-medium"
          >
            {loading ? 'Generating Identity keys...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}