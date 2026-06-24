'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/lib/theme-provider'

interface Profile {
  username: string
  premium: boolean
  voteWeight: number
  voteWeightLabel: string
  lastTopic: { id: string; title: string } | null
}

export default function ProfilePage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) {
          router.push('/auth/login?next=/profile')
          return
        }
        const data = await response.json()
        setProfile(data.profile)
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center text-amber-100/60 font-mono gap-3">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Decrypting System Identity...</span>
      </div>
    )
  }

  if (!profile) return null

  // Calculate influence percentage (0-100)
  const influencePercent = Math.min(Math.max((profile.voteWeight / 10) * 100, 0), 100)

  return (
    <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] px-4 py-12 pb-24 relative overflow-x-hidden">
      <div className="max-w-3xl mx-auto">
        
        {/* Top Header Panel - Styled like a Classified Folder Header */}
        <header className="bg-[#2d1a12] border-4 border-[#1a0e0a] text-[#d7ccc8] shadow-2xl p-6 mb-12 rounded-xl relative z-10 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-amber-600 flex items-center justify-center text-[#1a0e0a] font-black text-xl shadow-md">
                ID
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-black text-amber-500">
                  STANDPOINT INTEL OPERATIVE
                </p>
                <p className="text-[11px] uppercase tracking-wider text-amber-100/40">Identity Protection Secured</p>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs bg-amber-950/60 hover:bg-amber-900 border border-amber-800/40 px-4 py-2 rounded text-amber-400 font-bold uppercase transition-all tracking-wider text-center"
            >
              ← Master Board
            </Link>
          </div>
        </header>

        {/* Main Case File Dossier Layout Wrapper */}
        <div className="bg-[#2d1a12]/60 border-4 border-[#2d1a12] rounded-2xl p-6 md:p-10 shadow-2xl backdrop-blur-sm relative">
          
          {/* Operative Core Profile Badge */}
          <div className="border-b-2 border-amber-900/40 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900/60">
                ACTIVE CODENAME
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white mt-1">
                @{profile.username}
              </h1>
              <p className="text-xs text-amber-100/50 mt-1 font-serif max-w-md">
                Your cryptographic handle is active. Only your network alias is mirrored into ongoing community boards.
              </p>
            </div>
            
            <div className="shrink-0 flex items-center gap-2 bg-[#1a0e0a] px-4 py-2 rounded border border-amber-950">
              <span className="pulse-dot"></span>
              <span className="text-xs font-bold text-green-500 uppercase tracking-wider">SECURE CONNECTION</span>
            </div>
          </div>

          {/* Grid Layout of pinned visual components */}
          <div className="grid gap-8 sm:grid-cols-2 items-start">
            
            {/* Vote Influence Card - Styled like a Manila Document clipping */}
            <div className="bg-[#ffedd5] text-orange-950 border border-[#fed7aa] p-6 relative shadow-[4px_4px_12px_rgba(0,0,0,0.3)] transform -rotate-1 rounded-sm">
              {/* Top Pushpin */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
                <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
              </div>

              <div className="flex items-center justify-between mb-4 font-mono">
                <h3 className="text-xs uppercase tracking-wider font-black opacity-70">
                  ⚡ Impact Metric
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-900/10 border border-orange-900/20 uppercase">
                  {profile.voteWeightLabel}
                </span>
              </div>

              <p className="text-4xl font-mono font-black tracking-tight text-orange-950 mb-2">
                {(profile.voteWeight * 10).toFixed(0)}%
              </p>
              <p className="text-xs font-mono font-bold opacity-60 uppercase mb-4 tracking-wide">
                Current Matrix Authority Weight
              </p>

              {/* Visual Progress Track Meter */}
              <div className="mb-4">
                <div className="h-2 rounded-full bg-orange-950/10 overflow-hidden p-[1px] border border-orange-950/10">
                  <div
                    className="h-full bg-orange-800 rounded-full transition-all duration-500"
                    style={{ width: `${influencePercent}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-mono opacity-60 font-bold">
                  <span>LOW INFLUENCE</span>
                  <span>MAX BASELINE</span>
                </div>
              </div>

              <p className="font-serif text-xs leading-relaxed opacity-80 border-t border-orange-950/10 pt-3">
                Your standpoint node weight scales automatically based on consecutive community interactions. Idle credentials slowly experience clearance dampening.
              </p>
            </div>

            {/* Last Topic Visited Card - Styled like an Index Card file */}
            <div className="bg-[#fff7ed] text-amber-950 border border-[#fed7aa] p-6 relative shadow-[4px_4px_12px_rgba(0,0,0,0.3)] transform rotate-1 rounded-sm">
              {/* Top Pushpin */}
              <div className="absolute -top-3 left-1/3 -translate-x-1/2 z-10 flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
                <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
              </div>

              <h3 className="text-xs font-mono uppercase tracking-wider font-black opacity-70 mb-4">
                📂 Active Tracking Target
              </h3>

              {profile.lastTopic ? (
                <div className="flex flex-col justify-between h-full min-h-[140px]">
                  <div>
                    <span className="text-[9px] font-mono bg-amber-900/10 px-1.5 py-0.5 rounded border border-amber-900/10 font-bold uppercase tracking-wider">
                      Target File Registry
                    </span>
                    <Link href={`/topic/${profile.lastTopic.id}`} className="block group mt-2">
                      <p className="text-xl font-serif font-black leading-tight text-amber-950 group-hover:underline line-clamp-3">
                        "{profile.lastTopic.title}"
                      </p>
                    </Link>
                  </div>
                  <div className="pt-4 mt-2 border-t border-amber-950/10">
                    <Link
                      href={`/topic/${profile.lastTopic.id}`}
                      className="w-full bg-amber-900 hover:bg-amber-800 text-amber-50 font-mono text-xs uppercase text-center py-2 rounded font-bold shadow block tracking-wider"
                    >
                      Resume Transmission →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 font-mono">
                  <p className="text-xs text-amber-900/60 font-serif italic mb-4">
                    No directory records indexed in your session history.
                  </p>
                  <Link
                    href="/"
                    className="bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs uppercase px-4 py-2 rounded font-bold shadow tracking-wider inline-block"
                  >
                    Scan Open Directories
                  </Link>
                </div>
              )}
            </div>

            {/* Security Clearance Hierarchy Card (Old Subscription Card) */}
            <div className="bg-[#fee2e2] text-red-950 border border-[#fecaca] p-6 relative shadow-[4px_4px_12px_rgba(0,0,0,0.3)] transform rotate-2 rounded-sm">
              {/* Top Pushpin */}
              <div className="absolute -top-3 left-2/3 -translate-x-1/2 z-10 flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-green-600 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
                <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
              </div>

              <h3 className="text-xs font-mono uppercase tracking-wider font-black opacity-70 mb-4">
                🛡️ Clearances Matrix
              </h3>

              <div className="mb-4">
                <p className="text-xl font-mono font-black uppercase tracking-tight">
                  {profile.premium ? '★ ADMIN VERIFIED' : 'GENERAL ACCESS'}
                </p>
                <p className="text-xs font-serif opacity-75 mt-1">
                  {profile.premium 
                    ? 'Extended structural tracking parameters authorized for this account node.' 
                    : 'System capabilities operating on global node parameters.'}
                </p>
              </div>

              {!profile.premium && (
                <Link
                  href="/premium"
                  className="bg-red-800 hover:bg-red-700 text-red-50 font-mono text-xs uppercase text-center py-2.5 rounded font-bold shadow block tracking-widest transition-all"
                >
                  REQUEST ELEVATED ACCESS
                </Link>
              )}
            </div>

            {/* Matrix Visual Configuration Card (Old Appearance Card) */}
            <div className="bg-[#ecfccb] text-lime-950 border border-[#d9f99d] p-6 relative shadow-[4px_4px_12px_rgba(0,0,0,0.3)] transform -rotate-2 rounded-sm">
              {/* Top Pushpin */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
                <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
              </div>

              <h3 className="text-xs font-mono uppercase tracking-wider font-black opacity-70 mb-4">
                👁️ Canvas Parameter
              </h3>

              <div className="mb-4 font-mono">
                <span className="text-xs font-bold uppercase opacity-60 block">Current Array Rendering</span>
                <span className="text-base font-black tracking-wide block mt-1">
                  {theme === 'dark' ? '📡 Obsidian Dark-Mode' : '🗂️ Timber Board Classic'}
                </span>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-full border border-lime-800/40 bg-lime-900/10 hover:bg-lime-900/20 font-mono text-xs uppercase py-2 rounded font-bold tracking-wider transition-colors text-lime-900"
              >
                Invert Interface Filter
              </button>
            </div>

          </div>

          {/* Bottom Security Access Termination Terminal Actions */}
          <div className="mt-12 pt-6 border-t-2 border-amber-900/40 flex flex-wrap items-center justify-between gap-4 font-mono">
            <Link
              href="/"
              className="text-xs font-bold text-amber-500/70 hover:text-amber-400 transition-colors"
            >
              ← Terminate Session View & Exit
            </Link>
            
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                router.push('/auth/login')
                router.refresh()
              }}
              className="bg-red-950/60 hover:bg-red-950 border border-red-900 text-red-400 px-5 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              Purge Authorization Tokens (Log Out)
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}