'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Topic {
  id: string
  title: string
  description: string
  created_at: string
  note_count: number
}

interface Session {
  username: string
  premium: boolean
}

export default function HomePage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [showSuggest, setShowSuggest] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const sessionRes = await fetch('/api/auth/session')
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          setSession(sessionData.session)
        }

        const topicsRes = await fetch('/api/topics')
        if (topicsRes.ok) {
          const data = await topicsRes.json()
          setTopics(data.topics || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSuggestTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!session) {
      setMessage('Sign in to suggest a topic.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not submit topic')
      }

      setTitle('')
      setDescription('')
      setShowSuggest(false)
      setMessage('Topic sent for admin review.')
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Could not submit topic')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sp-page min-h-screen">
      {/* Modern Glassmorphic Header */}
      <header className="sp-header border-b border-[var(--sp-border)]">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--sp-accent)] to-[var(--sp-secondary)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold text-[var(--sp-accent)]">
                Standpoint
              </p>
              <p className="text-xs text-[var(--sp-text-muted)]">Anonymous Debate</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {session ? (
              <>
                <Link
                  href="/profile"
                  className="hidden sm:inline text-[var(--sp-text)] hover:text-[var(--sp-accent)] transition-colors font-medium"
                >
                  {session.username}
                  {session.premium && (
                    <span className="ml-2 inline-block px-2 py-1 rounded-full bg-[var(--sp-highlight)] text-[var(--sp-accent-text)] text-xs font-semibold">
                      Premium ⭐
                    </span>
                  )}
                </Link>
                {!session.premium && (
                  <Link
                    href="/premium"
                    className="sp-btn-premium px-4 py-2 rounded-lg text-xs font-semibold"
                  >
                    Upgrade
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-[var(--sp-text)] hover:text-[var(--sp-accent)] transition-colors">
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="sp-btn-primary px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Premium Hero Section */}
        <section className="rounded-2xl border border-[var(--sp-border)] bg-gradient-to-br from-[var(--sp-card)] to-[var(--sp-bg-soft)] p-8 md:p-12 mb-12 shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--sp-accent)]/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight text-gradient mb-4">
              Real ideas. Pure anonymity.
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-[var(--sp-text-body)] leading-relaxed">
              Debate ideas without revealing your identity. Browse thousands of topics, cast weighted votes, and share your standpoint on anything that matters.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {!session && (
                <Link
                  href="/auth/signup"
                  className="sp-btn-primary px-6 py-3 rounded-lg font-semibold text-base hover:shadow-lg transition-all"
                >
                  Create Account
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!session) {
                    setMessage('Sign in to suggest a topic.')
                    return
                  }
                  setShowSuggest((v) => !v)
                }}
                className="sp-btn-secondary px-6 py-3 rounded-lg font-semibold text-base"
              >
                Suggest Topic
              </button>
            </div>

            {message && (
              <div className="mt-6 alert-info">
                {message}
              </div>
            )}
          </div>
        </section>

        {/* Suggest Topic Form - Smooth Slide Down */}
        {showSuggest && session && (
          <section className="rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-8 mb-8 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-xl font-bold mb-6">Propose a new debate topic</h3>
            <form onSubmit={handleSuggestTopic} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--sp-text)] mb-2">
                  Topic Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What should people debate?"
                  className="w-full sp-input sp-input-glow rounded-lg px-4 py-3"
                  required
                  minLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--sp-text)] mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why should people debate this topic?"
                  rows={3}
                  className="w-full sp-input sp-input-glow rounded-lg px-4 py-3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="sp-btn-primary px-6 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Send to Admin Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuggest(false)}
                  className="px-6 py-2.5 rounded-lg border border-[var(--sp-border)] font-semibold text-sm hover:bg-[var(--sp-bg-soft)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Live Topics Section */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="pulse-dot" />
              <div>
                <h3 className="text-2xl font-bold">Live Topics</h3>
                <p className="text-sm text-[var(--sp-text-muted)]">
                  Active debates happening now
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold bg-[var(--sp-bg-soft)] text-[var(--sp-text)] px-4 py-2 rounded-full">
              {topics.length} topics
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-12 text-center text-[var(--sp-text-muted)]">
              Loading topics...
            </div>
          ) : topics.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--sp-border)] bg-[var(--sp-bg-soft)] p-12 text-center text-[var(--sp-text-muted)]">
              No approved topics yet. Be the first to suggest one!
            </div>
          ) : (
            <div className="grid gap-4">
              {topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topic/${topic.id}`}
                  className="group rounded-xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-5 hover:border-[var(--sp-accent)]/50 hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-[var(--sp-text)] group-hover:text-[var(--sp-accent)] transition-colors">
                        {topic.title}
                      </h4>
                      {topic.description && (
                        <p className="mt-2 text-[var(--sp-text-body)] line-clamp-2">
                          {topic.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 inline-block px-3 py-1.5 rounded-lg bg-[var(--sp-accent)]/10 text-[var(--sp-accent)] text-xs font-semibold">
                      Active
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-[var(--sp-text-muted)]">
                    <span className="flex items-center gap-1">
                      💬 {topic.note_count || 0} standpoints
                    </span>
                    <span>
                      📅 {new Date(topic.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
