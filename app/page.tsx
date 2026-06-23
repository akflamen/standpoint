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
      <header className="sp-header border-b border-[var(--sp-border)]">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#c4a882]">
              Anonymous debate
            </p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">Standpoint</h1>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {session ? (
              <>
                <Link
                  href="/profile"
                  className="hidden sm:inline text-[#f5f0e8] hover:text-[#c4a882] transition-colors"
                >
                  {session.username}
                  {session.premium ? ' · Premium' : ''}
                </Link>
                {!session.premium && (
                  <Link
                    href="/premium"
                    className="rounded-full bg-[#c4a882] text-[#2c1810] px-3 py-1.5 font-medium hover:bg-[#d4c4a8] transition-colors"
                  >
                    Go Premium
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hover:text-[#c4a882] transition-colors">
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-full bg-[#f5f0e8] text-[#2c1810] px-3 py-1.5 font-medium hover:bg-[#d4c4a8] transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <section className="rounded-2xl border sp-card p-6 md:p-8 shadow-sm">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Real ideas. No identity.
          </h2>
          <p className="mt-3 max-w-2xl sp-body leading-relaxed">
            Browse every topic without an account. Sign in only when you want to
            write, vote, or suggest a new debate for admin approval.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                if (!session) {
                  setMessage('Sign in to suggest a topic.')
                  return
                }
                setShowSuggest((value) => !value)
              }}
              className="rounded-lg bg-[#2c1810] text-[#f5f0e8] px-4 py-2.5 text-sm font-medium hover:bg-[#4a2c1a] transition-colors"
            >
              Suggest a topic
            </button>
            {!session && (
              <Link
                href="/auth/signup"
                className="rounded-lg border border-[#2c1810] px-4 py-2.5 text-sm font-medium hover:bg-[#faf8f4] transition-colors"
              >
                Create anonymous account
              </Link>
            )}
          </div>

          {message && (
            <p className="mt-4 text-sm text-[#4a2c1a] bg-[#faf8f4] border border-[#d4c4a8] rounded-lg px-4 py-3">
              {message}
            </p>
          )}

          {showSuggest && session && (
            <form onSubmit={handleSuggestTopic} className="mt-6 space-y-3 border-t border-[#d4c4a8] pt-6">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Topic title"
                className="w-full rounded-lg border border-[#d4c4a8] bg-[#faf8f4] px-3 py-2.5 focus:outline-none focus:border-[#2c1810]"
                required
                minLength={5}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why should people debate this?"
                rows={3}
                className="w-full rounded-lg border border-[#d4c4a8] bg-[#faf8f4] px-3 py-2.5 focus:outline-none focus:border-[#2c1810]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#2c1810] text-[#f5f0e8] px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Send to admin'}
              </button>
            </form>
          )}
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h3 className="text-xl font-semibold">Live topics</h3>
              <p className="text-sm text-[#8b7355] mt-1">
                Open any topic without signing in
              </p>
            </div>
            <span className="text-sm text-[#8b7355]">{topics.length} topics</span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#d4c4a8] bg-white p-10 text-center text-[#8b7355]">
              Loading topics...
            </div>
          ) : topics.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d4c4a8] bg-white/60 p-10 text-center text-[#8b7355]">
              No approved topics yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topic/${topic.id}`}
                  className="group rounded-2xl border sp-card p-5 md:p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold group-hover:text-[#4a2c1a]">
                        {topic.title}
                      </h4>
                      {topic.description && (
                        <p className="mt-2 text-[#4a2c1a] leading-relaxed">
                          {topic.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-[#faf8f4] border border-[#d4c4a8] px-3 py-1 text-xs text-[#8b7355]">
                      Open
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-[#8b7355]">
                    <span>{topic.note_count || 0} notes</span>
                    <span>{new Date(topic.created_at).toLocaleDateString()}</span>
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
