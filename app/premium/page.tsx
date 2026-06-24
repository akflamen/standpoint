'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Session {
  username: string
  premium: boolean
}

export default function PremiumPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [message, setMessage] = useState('')
  const [devOrderId, setDevOrderId] = useState<string | null>(null)
  const [displayAmount, setDisplayAmount] = useState('$4.99')

  useEffect(() => {
    async function load() {
      const response = await fetch('/api/auth/session')
      if (!response.ok) {
        router.push('/auth/login?next=/premium')
        return
      }
      const data = await response.json()
      setSession(data.session)
      setLoading(false)
    }
    load()
  }, [router])

  const startCheckout = async () => {
    setPaying(true)
    setMessage('')
    try {
      const response = await fetch('/api/premium/create-order', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not start checkout')
      }

      setDisplayAmount(data.displayAmount || '$4.99')

      if (data.mode === 'razorpay') {
        setMessage('Razorpay checkout will open here once your keys are connected.')
        return
      }

      setDevOrderId(data.orderId)
      setMessage(
        'Dev mode: simulate a payment below until Razorpay keys are added.'
      )
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setPaying(false)
    }
  }

  const simulatePayment = async () => {
    if (!devOrderId) return
    setPaying(true)
    try {
      const response = await fetch('/api/premium/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: devOrderId, devMode: true }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Payment verification failed')
      }

      setMessage('Premium activated. Payment record deleted for privacy.')
      setSession((current) => (current ? { ...current, premium: true } : current))
      setDevOrderId(null)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="sp-page min-h-screen flex items-center justify-center">
        <p className="text-[var(--sp-text-muted)]">Loading...</p>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="sp-page min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-widest font-semibold text-[var(--sp-accent)]">
            Premium Membership
          </p>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold text-[var(--sp-text)] text-gradient">
            Standpoint Premium
          </h1>
          <p className="mt-3 text-lg text-[var(--sp-text-body)]">
            Unlock exclusive features and become a premium participant in global debates
          </p>
        </div>

        {/* Already Premium */}
        {session.premium ? (
          <div className="rounded-2xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-8 text-center mb-8">
            <p className="text-2xl font-bold text-green-900 dark:text-green-200">
              ✓ You are a Premium Member
            </p>
            <p className="mt-2 text-green-800 dark:text-green-300">
              Thank you for supporting Standpoint's mission
            </p>
          </div>
        ) : (
          /* Pricing Card */
          <div className="rounded-2xl border-2 border-[var(--sp-highlight)] bg-gradient-to-br from-[var(--sp-card)] via-[var(--sp-bg-soft)] to-[var(--sp-card)] p-8 md:p-10 mb-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--sp-highlight)]/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <p className="text-sm uppercase tracking-widest font-semibold text-[var(--sp-text-muted)]">
                One-time payment
              </p>

              <div className="mt-6 mb-8">
                <p className="text-6xl md:text-7xl font-bold text-[var(--sp-highlight)] leading-none">
                  {displayAmount}
                </p>
                <p className="mt-3 text-[var(--sp-text-muted)]">
                  Lifetime access · USD · Worldwide
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[var(--sp-text)]">Premium badge on your public profile</span>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[var(--sp-text)]">Higher vote influence (35% baseline vs 25%)</span>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[var(--sp-text)]">Faster influence growth when participating regularly</span>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[var(--sp-text)]">Early access to premium-only features</span>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[var(--sp-text)]">One-time payment, forever benefits</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={startCheckout}
                  disabled={paying}
                  className="w-full sp-btn-premium py-4 rounded-lg font-bold text-lg disabled:opacity-50 hover:shadow-xl transition-all"
                >
                  {paying ? 'Starting checkout...' : `Upgrade to Premium — ${displayAmount}`}
                </button>

                {devOrderId && (
                  <button
                    type="button"
                    onClick={simulatePayment}
                    disabled={paying}
                    className="w-full sp-btn-secondary py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
                  >
                    {paying ? 'Processing...' : 'Simulate Payment (Dev Mode)'}
                  </button>
                )}
              </div>

              {/* Security Note */}
              <div className="mt-6 pt-6 border-t border-[var(--sp-border)]">
                <p className="text-xs text-[var(--sp-text-muted)]">
                  🔒 Secure payment via Razorpay. Payment records are deleted immediately after verification for privacy.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="rounded-xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-4 mb-8 text-sm text-[var(--sp-text-body)]">
            {message}
          </div>
        )}

        {/* Footer Link */}
        <div className="text-center">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-[var(--sp-accent)] hover:text-[var(--sp-accent-hover)] font-medium transition-colors"
          >
            ← Back to Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
