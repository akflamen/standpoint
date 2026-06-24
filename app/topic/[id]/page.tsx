'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Note {
  id: string
  content: string
  username: string
  parent_note_id: string | null
  created_at: string
  score: number
}

interface Session {
  username: string
  premium: boolean
}

export default function TopicPage() {
  const params = useParams()
  const topicId = params.id as string

  const [notes, setNotes] = useState<Note[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  async function loadNotes() {
    const response = await fetch(`/api/notes?topicId=${topicId}`)
    if (response.ok) {
      const data = await response.json()
      setNotes(data.notes || [])
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch('/api/auth/session')
        if (sessionRes.ok) {
          const data = await sessionRes.json()
          setSession(data.session)
          if (data.session) {
            await fetch('/api/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ topicId }),
            })
          }
        }
        await loadNotes()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [topicId])

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!session) {
      setError('Sign in to write in this topic.')
      return
    }

    setPosting(true)
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, content }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not post note')
      }

      setContent('')
      await loadNotes()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not post note')
    } finally {
      setPosting(false)
    }
  }

  const handleVote = async (noteId: string, voteValue: 1 | -1) => {
    if (!session) {
      setError('Sign in to vote.')
      return
    }

    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId, voteValue }),
    })
    await loadNotes()
  }

  return (
    <div className="sp-page min-h-screen">
      {/* Header */}
      <header className="sp-header border-b border-[var(--sp-border)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="text-sm font-medium text-[var(--sp-text)] hover:text-[var(--sp-accent)] transition-colors flex items-center gap-2"
          >
            ← Back to debates
          </Link>
          {session ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-[var(--sp-text-muted)]">@</span>
              <span className="text-sm font-semibold text-[var(--sp-text)]">{session.username}</span>
            </div>
          ) : (
            <Link 
              href="/auth/login" 
              className="text-sm font-medium text-[var(--sp-accent)] hover:underline"
            >
              Sign in to post
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--sp-text-muted)]">
            Loading debate thread...
          </div>
        ) : (
          <>
            {/* Post Form */}
            {session && (
              <section className="rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-6 mb-8 shadow-md">
                <h3 className="text-lg font-bold text-[var(--sp-text)] mb-4">Share Your Standpoint</h3>
                <form onSubmit={handlePost} className="space-y-4">
                  <div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="What's your perspective on this topic?"
                      rows={4}
                      className="w-full sp-input sp-input-glow rounded-lg px-4 py-3 resize-none"
                      maxLength={1000}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-[var(--sp-text-muted)]">
                      <span>{content.length} / 1000 characters</span>
                    </div>
                  </div>
                  {error && (
                    <div className="alert-info">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={posting || !content.trim()}
                    className="sp-btn-primary px-6 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
                  >
                    {posting ? 'Posting...' : 'Post Standpoint'}
                  </button>
                </form>
              </section>
            )}

            {!session && (
              <div className="alert-info mb-8">
                You can read this debate without an account.{' '}
                <Link href="/auth/login" className="font-semibold underline hover:no-underline">
                  Sign in
                </Link>{' '}
                to post or vote on standpoints.
              </div>
            )}

            {/* Standpoints Thread */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--sp-text)] mb-6">
                Standpoints ({notes.length})
              </h2>

              {notes.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[var(--sp-border)] bg-[var(--sp-bg-soft)] p-12 text-center text-[var(--sp-text-muted)]">
                  <p className="text-lg font-medium">No standpoints yet</p>
                  <p className="text-sm mt-1">
                    {session ? 'Be the first to share your perspective.' : 'Sign in to be the first to contribute.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <article
                      key={note.id}
                      className="rounded-xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-6 hover:border-[var(--sp-accent)]/30 hover:shadow-md transition-all"
                    >
                      <div className="flex gap-5">
                        {/* Voting Column */}
                        <div className="flex flex-col items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleVote(note.id, 1)}
                            disabled={!session}
                            className="group relative p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={session ? 'Upvote' : 'Sign in to vote'}
                          >
                            <svg
                              className="w-5 h-5 text-[var(--sp-text-muted)] group-hover:text-green-600 group-active:scale-90 transition-all"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M2 10.5a1.5 1.5 0 113 0v-7a1.5 1.5 0 01-3 0v7zM14.98 4.374c.47 1.45 1.02 3.742 1.02 6.126 0 1.657-.327 3.207-.986 4.585A4.5 4.5 0 1113.5 3.5c.823.023 1.626.088 2.48.177z" />
                            </svg>
                          </button>

                          <span className="text-sm font-bold text-[var(--sp-text)] min-w-[2rem] text-center">
                            {note.score}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleVote(note.id, -1)}
                            disabled={!session}
                            className="group relative p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={session ? 'Downvote' : 'Sign in to vote'}
                          >
                            <svg
                              className="w-5 h-5 text-[var(--sp-text-muted)] group-hover:text-red-600 group-active:scale-90 transition-all"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M2 10.5a1.5 1.5 0 113 0v7a1.5 1.5 0 01-3 0v-7zM14.98 15.626c.47-1.45 1.02-3.742 1.02-6.126 0-1.657-.327-3.207-.986-4.585A4.5 4.5 0 1113.5 16.5c.823-.023 1.626-.088 2.48-.177z" />
                            </svg>
                          </button>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--sp-accent)] to-[var(--sp-secondary)] opacity-60 flex items-center justify-center text-white text-xs font-bold">
                              {note.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--sp-text)]">
                                {note.username}
                              </p>
                              <p className="text-xs text-[var(--sp-text-muted)]">
                                {new Date(note.created_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 text-[var(--sp-text-body)] leading-relaxed whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
