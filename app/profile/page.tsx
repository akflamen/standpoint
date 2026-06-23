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
      <div className="sp-page min-h-screen flex items-center justify-center sp-muted">
        Loading profile...
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="sp-page min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto sp-card border rounded-2xl p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] sp-muted">Profile</p>
            <h1 className="mt-2 text-2xl font-bold">{profile.username}</h1>
          </div>
          {profile.premium && (
            <span className="rounded-full px-3 py-1 text-xs font-medium bg-[var(--sp-highlight)] text-[var(--sp-accent-text)]">
              Premium
            </span>
          )}
        </div>

        <p className="mt-3 text-sm sp-body">
          Anonymous by design. Only your username appears in debates.
        </p>

        <div className="mt-8 space-y-5">
          <div className="rounded-xl border sp-card p-4">
            <p className="text-xs uppercase tracking-wide sp-muted">Vote influence</p>
            <p className="mt-1 text-lg font-semibold">{profile.voteWeightLabel}</p>
            <p className="mt-2 text-sm sp-body leading-relaxed">
              New accounts start lower. Your influence grows when you vote regularly
              and slowly fades if you stay away for a long time.
            </p>
          </div>

          <div className="rounded-xl border sp-card p-4">
            <p className="text-xs uppercase tracking-wide sp-muted">Last topic seen</p>
            {profile.lastTopic ? (
              <Link
                href={`/topic/${profile.lastTopic.id}`}
                className="mt-2 inline-block text-base font-medium hover:underline"
              >
                {profile.lastTopic.title}
              </Link>
            ) : (
              <p className="mt-2 text-sm sp-muted">No topic visited yet</p>
            )}
          </div>

          <div className="rounded-xl border sp-card p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide sp-muted">Appearance</p>
              <p className="mt-1 text-sm sp-body">
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border px-4 py-2 text-sm font-medium sp-input hover:opacity-90 transition-opacity"
            >
              Toggle theme
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {!profile.premium && (
            <Link
              href="/premium"
              className="rounded-lg sp-btn-primary px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Upgrade to Premium
            </Link>
          )}
          <Link
            href="/"
            className="rounded-lg border px-4 py-2 text-sm font-medium sp-input hover:opacity-90 transition-opacity"
          >
            Back home
          </Link>
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              router.push('/auth/login')
              router.refresh()
            }}
            className="rounded-lg border border-red-300 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
