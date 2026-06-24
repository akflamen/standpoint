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
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  if (loading) {
    return (
      <div className="sp-page min-h-screen flex items-center justify-center">
        <p className="text-[var(--sp-text-muted)]">Loading profile...</p>
      </div>
    )
  }

  if (!profile) return null

  // Calculate influence percentage (0-100)
  const influencePercent = Math.min(Math.max((profile.voteWeight / 10) * 100, 0), 100)

  return (
    <div className="sp-page min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header Card */}
        <div className="rounded-2xl border border-[var(--sp-border)] bg-gradient-to-br from-[var(--sp-card)] to-[var(--sp-bg-soft)] p-8 mb-8 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest font-semibold text-[var(--sp-accent)]">
                Account Profile
              </p>
              <h1 className="mt-3 text-3xl font-bold text-[var(--sp-text)]">
                @{profile.username}
              </h1>
              <p className="mt-2 text-[var(--sp-text-body)]">
                Your anonymous identity is secure. Only your username is visible in debates.
              </p>
            </div>
            {profile.premium && (
              <div className="shrink-0 rounded-xl bg-gradient-to-br from-[var(--sp-highlight)] to-amber-600 px-4 py-3 text-white text-center">
                <p className="text-xs font-semibold">✨ Premium</p>
                <p className="text-xs mt-1 opacity-90">Subscriber</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Vote Influence Card - Premium Styling */}
          <div className="rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm uppercase tracking-wider font-bold text-[var(--sp-accent)]">
                Vote Influence
              </h3>
              <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-[var(--sp-accent)]/10 text-[var(--sp-accent)]">
                {profile.voteWeightLabel}
              </span>
            </div>

            <p className="text-3xl font-bold text-[var(--sp-text)] mb-4">
              {(profile.voteWeight * 10).toFixed(0)}%
            </p>

            {/* Visual Progress Bar */}
            <div className="mb-6">
              <div className="h-3 rounded-full bg-[var(--sp-bg-soft)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--sp-accent)] to-[var(--sp-secondary)] transition-all duration-500"
                  style={{ width: `${influencePercent}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--sp-text-muted)]">
                <span>Low</span>
                <span className="text-center">Moderate</span>
                <span className="text-right">High</span>
              </div>
            </div>

            <p className="text-sm text-[var(--sp-text-body)] leading-relaxed">
              Your vote influence grows as you engage regularly with debates. Inactive accounts gradually lose influence over time.
            </p>
          </div>

          {/* Last Topic Visited Card */}
          <div className="rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-6 shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-sm uppercase tracking-wider font-bold text-[var(--sp-accent)] mb-4">
              Last Topic
            </h3>

            {profile.lastTopic ? (
              <>
                <Link
                  href={`/topic/${profile.lastTopic.id}`}
                  className="block group"
                >
                  <p className="text-2xl font-bold text-[var(--sp-text)] group-hover:text-[var(--sp-accent)] transition-colors line-clamp-2">
                    {profile.lastTopic.title}
                  </p>
                </Link>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/topic/${profile.lastTopic.id}`}
                    className="sp-btn-primary px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Continue Reading
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-[var(--sp-text-muted)] mb-4">
                  You haven't visited any topics yet
                </p>
                <Link
                  href="/"
                  className="sp-btn-primary px-4 py-2 rounded-lg text-sm font-semibold inline-block"
                >
                  Browse Topics
                </Link>
              </div>
            )}
          </div>

          {/* Theme Toggle Card */}
          <div className="rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-6 shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-sm uppercase tracking-wider font-bold text-[var(--sp-accent)] mb-4">
              Appearance
            </h3>

            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-[var(--sp-text)]">
                {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="w-full sp-btn-secondary px-4 py-2.5 rounded-lg font-semibold text-sm"
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
          </div>

          {/* Premium/Subscription Card */}
          <div className="rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-6 shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-sm uppercase tracking-wider font-bold text-[var(--sp-accent)] mb-4">
              Subscription
            </h3>

            <div className="mb-4">
              <p className="text-lg font-bold text-[var(--sp-text)]">
                {profile.premium ? '✨ Premium Active' : 'Free Tier'}
              </p>
              <p className="text-sm text-[var(--sp-text-muted)] mt-1">
                {profile.premium 
                  ? 'Thank you for supporting Standpoint!' 
                  : 'Unlock premium features'}
              </p>
            </div>

            {!profile.premium && (
              <Link
                href="/premium"
                className="sp-btn-premium w-full px-4 py-2.5 rounded-lg font-semibold text-sm text-center block"
              >
                Upgrade to Premium
              </Link>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="sp-btn-secondary px-6 py-2.5 rounded-lg font-semibold text-sm"
          >
            ← Back to Debates
          </Link>
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              router.push('/auth/login')
              router.refresh()
            }}
            className="px-6 py-2.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}
