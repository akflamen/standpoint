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
      <header className="sp-header border-b border-(--sp-border)">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-(--sp-highlight)">
              Anonymous debate
            </p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">Standpoint</h1>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {session ? (
              <>
                <Link
                  href="/profile"
                  className="hidden sm:inline text-(--sp-accent-text) hover:text-(--sp-highlight) transition-colors"
                >
                  {session.username}
                  {session.premium ? ' · Premium' : ''}
                </Link>
                {!session.premium && (
                  <Link
                    href="/premium"
                    className="rounded-full bg-(--sp-highlight) text-(--sp-bg) px-3 py-1.5 font-medium hover:bg-(--sp-border) transition-colors"
                  >
                    Go Premium
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hover:text-(--sp-highlight) transition-colors">
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-full bg-(--sp-accent-text) text-(--sp-accent) px-3 py-1.5 font-medium hover:bg-(--sp-border) transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* rest of your file unchanged */}
      {/* ... */}
    </div>
  )
}
