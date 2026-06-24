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

  // Fetches from your session handler checked by your proxy file middleware
  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/auth/session')
        if (!response.ok) {
          router.push('/auth/login?next=/premium')
          return
        }
        const data = await response.json()
        setSession(data.session)
      } catch (err) {
        console.error('Session handshaking fault:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  // Hits your POST router at `/api/premium/create-order`
  const startCheckout = async () => {
    setPaying(true)
    setMessage('')
    try {
      const response = await fetch('/api/premium/create-order', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not initialize payment matrix record.')
      }

      setDisplayAmount(data.displayAmount || '$4.99')

      // If Razorpay environment variables exist on backend, your route flags 'razorpay'
      if (data.mode === 'razorpay') {
        setMessage('Razorpay execution channel active. Connect webhook listeners to intercept live tokens.')
        return
      }

      // Dev Mode fallback block from your create-order response
      setDevOrderId(data.orderId)
      setMessage(
        'Dev execution sequence ready: Simulate backend records bypass execution ledger below.'
      )
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Dossier payment link failed')
    } finally {
      setPaying(false)
    }
  }

  // Hits your POST verification endpoint at `/api/premium/verify`
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
        throw new Error(data.error || 'Identity confirmation verification failed')
      }

      setMessage('Premium status authorized! Erasing ledger trails for tracking privacy... Redirecting to Home board.')
      
      if (session) {
        setSession({ ...session, premium: true })
      }
      setDevOrderId(null)
      
      // Forces immediate baseline sync straight to home directory index page `/`
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1300)
      
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'System elevation error')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center text-amber-100/60 font-mono gap-3">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Mapping System Access Rights...</span>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] px-4 py-12 pb-24 relative overflow-x-hidden">
      <div className="max-w-2xl mx-auto">
        
        {/* Overhead Context Section */}
        <div className="text-center mb-10 font-mono">
          <p className="text-xs uppercase tracking-widest font-black text-amber-500 bg-[#2d1a12] border border-amber-950 inline-block px-3 py-1 rounded shadow-md">
            CRITICAL ACCESS HUB
          </p>
          <h1 className="mt-4 text-3xl md:text-5xl font-serif font-black tracking-tight text-white">
            ELEVATED MATRIX MANIFEST
          </h1>
          <p className="mt-2 text-sm text-amber-100/60 font-serif max-w-md mx-auto">
            Authorize your unique network profile handle to expand debate footprint weight options instantly.
          </p>
        </div>

        {/* Checked via updated Database accounts relation column */}
        {session.premium ? (
          <div className="bg-[#ecfccb] text-lime-950 border border-[#d9f99d] p-8 text-center rounded-sm shadow-xl relative mb-8 transform -rotate-1">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
              <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
            </div>
            
            <p className="text-2xl font-mono font-black uppercase tracking-tight">
              ★ ELEVATION MATRIX LIVE
            </p>
            <p className="mt-2 font-serif text-sm opacity-80">
              Verified credentials synchronized to system memory cluster headers.
            </p>
            <Link
              href="/"
              className="mt-5 inline-block bg-lime-900 hover:bg-lime-800 text-lime-50 font-mono text-xs uppercase px-5 py-2.5 rounded font-bold tracking-wider shadow"
            >
              Enter Main Debate Board
            </Link>
          </div>
        ) : (
          
          /* Manila Paper Ledger Pricing Manifest Card */
          <div className="bg-[#fff7ed] text-amber-950 border border-[#fed7aa] p-6 md:p-10 mb-8 shadow-[6px_6px_20px_rgba(0,0,0,0.4)] relative rounded-sm transform rotate-1">
            <div className="absolute -top-3 left-1/4 -translate-x-1/2 z-10 flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
              <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
            </div>

            <div className="flex items-center justify-between font-mono border-b border-amber-900/10 pb-4 mb-6">
              <span className="text-xs uppercase tracking-wider font-black opacity-60">
                REGISTRY SPECIFICATION
              </span>
              <span className="text-[10px] font-bold bg-amber-900/10 px-2 py-0.5 rounded uppercase tracking-wide">
                Single Token Issuance
              </span>
            </div>

            <div className="mb-8 font-mono">
              <p className="text-5xl md:text-6xl font-black tracking-tight text-amber-950 leading-none">
                {displayAmount}
              </p>
              <p className="text-xs font-bold opacity-60 uppercase tracking-wider mt-2">
                Lifetime Verification · Asset Indexation · Worldwide Mirroring
              </p>
            </div>

            {/* Tactical Features Manifest Checklist */}
            <div className="space-y-3.5 border-t border-b border-amber-900/10 py-6 mb-8 font-serif text-xs md:text-sm leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="text-amber-700 font-bold select-none">[✓]</span>
                <span className="text-amber-950/90 font-medium">Affix **★ Admin Verified** badge token next to your public codename handle.</span>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-amber-700 font-bold select-none">[✓]</span>
                <span className="text-amber-950/90 font-medium">Elevate baseline traction tracking footprint (Updates node capacity limits up to **35% baseline** natively).</span>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-amber-700 font-bold select-none">[✓]</span>
                <span className="text-amber-950/90 font-medium">Accelerate profile matrix tracking response times during standard community events.</span>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-amber-700 font-bold select-none">[✓]</span>
                <span className="text-amber-950/90 font-medium">One-off computational database initialization payment with permanent benefits.</span>
              </div>
            </div>

            {/* Execution Buttons System linked to endpoints */}
            <div className="space-y-3 font-mono">
              <button
                type="button"
                onClick={startCheckout}
                disabled={paying}
                className="w-full bg-amber-900 hover:bg-amber-800 disabled:bg-amber-900/40 text-amber-50 py-3.5 rounded font-black text-sm md:text-base uppercase tracking-wider transition-all shadow-md"
              >
                {paying ? 'REQUESTING LEDGER SLOTS...' : `INITIALIZE REGISTRY ELEVATION — ${displayAmount}`}
              </button>

              {devOrderId && (
                <button
                  type="button"
                  onClick={simulatePayment}
                  disabled={paying}
                  className="w-full border-2 border-dashed border-amber-800/60 bg-amber-900/5 hover:bg-amber-900/10 text-amber-900 py-3 rounded font-bold text-xs uppercase tracking-widest transition-colors"
                >
                  {paying ? 'CONFIRMING ROUTE ACCESS...' : 'SIMULATE REGISTRY VERIFICATION (DEV INJECTION)'}
                </button>
              )}
            </div>

            {/* Micro Privacy Disclaimer */}
            <div className="mt-6 pt-5 border-t border-amber-900/10 text-[11px] font-mono opacity-50 flex items-center gap-1.5 leading-none">
              <span>🔒 Verification logs purge permanently from database clusters right after pipeline activation.</span>
            </div>
          </div>
        )}

        {/* System Logs Feed */}
        {message && (
          <div className="rounded border border-amber-900/40 bg-[#2d1a12] text-amber-200/80 p-4 mb-8 text-xs font-mono shadow-inner leading-relaxed">
            <span className="text-amber-500 font-bold uppercase mr-1">[SYSTEM REPORT]:</span> {message}
          </div>
        )}

        {/* Custom Rerouted Navigation Link straight to Home Board */}
        <div className="text-center font-mono">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-500/70 hover:text-amber-400 uppercase tracking-widest transition-colors"
          >
            ← Discard Authorization & Return to Home Board
          </Link>
        </div>
        
      </div>
    </div>
  )
}