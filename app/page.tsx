'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSession, clearSession } from '@/lib/auth'

interface Topic {
  id: string
  title: string
  description: string | null
  created_at: string
}

export default function HomePage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<{ username: string; token: string } | null>(null)
  const [showSuggest, setShowSuggest] = useState(false)
  const [suggestionTitle, setSuggestionTitle] = useState('')
  const [suggestionDesc, setSuggestionDesc] = useState('')
  const [suggestionMsg, setSuggestionMsg] = useState('')

  useEffect(() => {
    setSession(getSession())
    fetchTopics()
  }, [])

  async function fetchTopics() {
    try {
      const res = await fetch('/api/topics')
      const data = await res.json()
      setTopics(data.topics || [])
    } catch {
      console.error('Failed to fetch topics')
    } finally {
      setLoading(false)
    }
  }

  async function submitSuggestion() {
    if (!session) return
    setSuggestionMsg('')
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: suggestionTitle,
          description: suggestionDesc,
          token: session.token,
          username: session.username,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuggestionMsg('Topic submitted for review!')
      setSuggestionTitle('')
      setSuggestionDesc('')
    } catch (err: unknown) {
      setSuggestionMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8]">
      {/* Header */}
      <header className="bg-[#2c1810] text-[#f5f0e8] px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Standpoint</h1>
          <p className="text-xs text-[#c4a882] mt-0.5">Anonymous debate. Real ideas.</p>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="text-sm text-[#c4a882]">@{session.username}</span>
              <button
                onClick={() => { clearSession(); setSession(null) }}
                className="text-xs bg-[#f5f0e8] text-[#2c1810] px-3 py-1.5 rounded hover:bg-[#c4a882] transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="text-xs bg-[#f5f0e8] text-[#2c1810] px-3 py-1.5 rounded hover:bg-[#c4a882] transition-colors font-medium"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Topics heading */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#2c1810]">Open Topics</h2>
          {session && (
            <button
              onClick={() => setShowSuggest(!showSuggest)}
              className="text-sm bg-[#2c1810] text-[#f5f0e8] px-4 py-2 rounded hover:bg-[#4a2c1a] transition-colors"
            >
              + Suggest Topic
            </button>
          )}
        </div>

        {/* Suggest topic form */}
        {showSuggest && session && (
          <div className="bg-white border border-[#d4c4a8] rounded-lg p-4 mb-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#2c1810] mb-3">Suggest a Topic</h3>
            <input
              type="text"
              placeholder="Topic title (5-100 characters)"
              value={suggestionTitle}
              onChange={e => setSuggestionTitle(e.target.value)}
              className="w-full border border-[#d4c4a8] rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:border-[#2c1810] bg-[#faf8f4]"
            />
            <textarea
              placeholder="Optional description..."
              value={suggestionDesc}
              onChange={e => setSuggestionDesc(e.target.value)}
              rows={2}
              className="w-full border border-[#d4c4a8] rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:border-[#2c1810] bg-[#faf8f4] resize-none"
            />
            {suggestionMsg && (
              <p className="text-xs text-[#2c1810] mb-2">{suggestionMsg}</p>
            )}
            <button
              onClick={submitSuggestion}
              className="text-sm bg-[#2c1810] text-[#f5f0e8] px-4 py-2 rounded hover:bg-[#4a2c1a] transition-colors"
            >
              Submit
            </button>
          </div>
        )}

        {/* Topic list */}
        {loading ? (
          <p className="text-sm text-[#8b7355] text-center py-12">Loading topics...</p>
        ) : topics.length === 0 ? (
          <p className="text-sm text-[#8b7355] text-center py-12">No topics yet. Be the first to suggest one.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {topics.map(topic => (
              <Link
                key={topic.id}
                href={`/topic/${topic.id}`}
                className="block bg-white border border-[#d4c4a8] rounded-lg p-4 shadow-sm hover:shadow-md hover:border-[#2c1810] transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-[#2c1810] group-hover:underline">{topic.title}</h3>
                    {topic.description && (
                      <p className="text-sm text-[#8b7355] mt-1">{topic.description}</p>
                    )}
                  </div>
                  <span className="text-[#c4a882] text-lg mt-0.5">→</span>
                </div>
                <p className="text-xs text-[#c4a882] mt-2">
                  {new Date(topic.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}