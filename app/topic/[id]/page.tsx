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
      <header className="sp-header border-b border-(--sp-border)">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm hover:text-[#c4a882] transition-colors">
            ← Back to topics
          </Link>
          {session ? (
            <span className="text-sm">{session.username}</span>
          ) : (
            <Link href="/auth/login" className="text-sm hover:text-[#c4a882]">
              Sign in to write
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-[#8b7355]">Loading discussion...</p>
        ) : (
          <>
            <div className="rounded-2xl border border-[#d4c4a8] bg-white p-5 mb-6">
              {session ? (
                <form onSubmit={handlePost} className="space-y-3">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your standpoint..."
                    rows={4}
                    className="w-full rounded-lg border border-[#d4c4a8] bg-[#faf8f4] px-3 py-2.5 focus:outline-none focus:border-[#2c1810]"
                    maxLength={1000}
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={posting}
                    className="rounded-lg bg-[#2c1810] text-[#f5f0e8] px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {posting ? 'Posting...' : 'Post note'}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-[#4a2c1a]">
                  You can read this topic without signing in.{' '}
                  <Link href="/auth/login" className="font-medium underline">
                    Log in
                  </Link>{' '}
                  to post or vote.
                </p>
              )}
            </div>

            <div className="space-y-3">
              {notes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d4c4a8] bg-white/70 p-8 text-center text-[#8b7355]">
                  No notes yet. Be the first to write.
                </div>
              ) : (
                notes.map((note) => (
                  <article
                    key={note.id}
                    className="rounded-2xl border border-[#d4c4a8] bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[#8b7355]">
                          {note.username}
                        </p>
                        <p className="mt-2 leading-relaxed">{note.content}</p>
                        <p className="mt-2 text-xs text-[#8b7355]">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleVote(note.id, 1)}
                          className="text-sm hover:text-green-700"
                        >
                          ▲
                        </button>
                        <span className="text-sm font-semibold">{note.score}</span>
                        <button
                          type="button"
                          onClick={() => handleVote(note.id, -1)}
                          className="text-sm hover:text-red-700"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
