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
}

const STICKY_COLORS = [
  'bg-[#fff7ed] text-amber-950 border-[#fed7aa]',
  'bg-[#fef08a] text-yellow-950 border-[#fef08a]',
  'bg-[#ffedd5] text-orange-950 border-[#fed7aa]',
  'bg-[#fee2e2] text-red-950 border-[#fecaca]',
  'bg-[#ecfccb] text-lime-950 border-[#d9f99d]',
  'bg-[#e0f2fe] text-sky-950 border-[#bae6fd]'
]

const PIN_COLORS = [
  'bg-red-600 shadow-red-900/50',
  'bg-blue-600 shadow-blue-900/50',
  'bg-green-600 shadow-green-900/50',
  'bg-yellow-500 shadow-yellow-800/50',
  'bg-white border border-gray-300 shadow-black/30'
]

function getDeterministicStyle(id: string, array: string[]): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return array[Math.abs(hash) % array.length]
}

export default function HomePage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [showSuggest, setShowSuggest] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
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
  }, [mounted])

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
    <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] pb-24 relative overflow-x-hidden">
      {!mounted || loading ? (
        <div className="flex flex-col items-center justify-center min-h-screen text-amber-100/60 font-mono gap-3">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Unrolling Master Board...</span>
        </div>
      ) : (
        <>
          {/* Header Panel */}
          <header className="bg-[#2d1a12] border-b-4 border-[#1a0e0a] text-[#d7ccc8] shadow-2xl relative z-10">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 font-mono">
                <div className="w-8 h-8 rounded bg-amber-600 flex items-center justify-center text-[#1a0e0a] font-black shadow-md">
                  ★
                </div>
                <div>
                  <p className="text-sm uppercase tracking-widest font-black text-amber-500">
                    STANDPOINT
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/40">Anonymous Intel Exchange</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm font-mono">
                {session ? (
                  <div className="flex items-center gap-3 bg-[#1a0e0a] px-4 py-1.5 rounded border border-amber-900">
                    <span className="text-amber-600 animate-pulse text-xs hidden sm:inline">● ACTIVE:</span>
                    <span className="font-bold text-white text-xs">@{session.username}</span>
                    
                    {/* Profile Button - navigates to profile page */}
                    <Link
                      href="/profile"
                      className="ml-1 w-8 h-8 rounded-full bg-amber-700 hover:bg-amber-600 text-amber-50 flex items-center justify-center font-bold text-sm transition-all shadow-md hover:scale-105"
                      aria-label="Profile"
                    >
                      {session.username.charAt(0).toUpperCase()}
                    </Link>
                  </div>
                ) : (
                  <>
                    <Link href="/auth/login" className="text-amber-100/70 hover:text-white transition-colors text-xs">
                      [ Log In ]
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="bg-amber-700 hover:bg-amber-600 text-amber-50 px-3 py-1.5 rounded text-xs font-bold uppercase transition-all shadow-md"
                    >
                      Enlist
                    </Link>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-12">
            {/* Immersive Case File Banner */}
            <section className="rounded-2xl border-4 border-[#2d1a12] bg-[#2d1a12]/60 backdrop-blur-sm p-8 md:p-12 mb-16 shadow-2xl relative overflow-hidden text-center sm:text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 font-mono">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-950/80 px-2.5 py-1 rounded border border-amber-900">
                  Global Case Board
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-black text-amber-100 mt-4 leading-tight">
                  Real ideas. Pure anonymity.
                </h2>
                <p className="mt-4 max-w-2xl text-sm text-amber-100/70 leading-relaxed font-serif">
                  Debate perspective parameters without revealing authorization identities. Browse live case tracking topics, cast weighted node reactions, and pin your standalone standpoint to the corkboard canvas.
                </p>

                <div className="mt-8 flex flex-wrap justify-center sm:justify-start gap-4">
                  {!session && (
                    <Link
                      href="/auth/signup"
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-amber-950 font-bold text-sm rounded uppercase tracking-wide shadow-lg transition-all"
                    >
                      Create System Identity
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
                    className="px-6 py-3 border border-amber-600/40 bg-amber-950/20 text-amber-400 hover:bg-amber-950/50 hover:text-amber-300 font-bold text-sm rounded uppercase tracking-wide transition-all"
                  >
                    Suggest New Case File
                  </button>
                </div>

                {message && (
                  <div className="mt-6 text-xs text-amber-400 font-mono bg-amber-950/80 border border-amber-900/60 p-3 rounded text-center">
                    📢 SYSTEM RESPONSE: {message}
                  </div>
                )}
              </div>
            </section>

            {/* Suggest Topic Form Popout Panel */}
            {showSuggest && session && (
              <section className="bg-[#fffbeb] border-2 border-amber-900/40 p-6 md:p-8 rounded shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-xl mx-auto mb-16 relative transform rotate-1">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full shadow-md z-10"></div>
                
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-900 mb-6 border-b border-amber-900/20 pb-2">
                  📝 Propose a New Board File
                </h3>
                
                <form onSubmit={handleSuggestTopic} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-amber-950 uppercase mb-2">
                      Topic Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What field requires immediate deployment?"
                      className="w-full bg-amber-900/5 border border-amber-900/20 focus:border-amber-800 rounded px-4 py-2.5 font-serif text-stone-900 placeholder-stone-400 outline-none focus:ring-1 focus:ring-amber-800"
                      required
                      minLength={5}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-amber-950 uppercase mb-2">
                      Brief Context Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Why should the board track this specific case file baseline context?"
                      rows={3}
                      className="w-full bg-amber-900/5 border border-amber-900/20 focus:border-amber-800 rounded px-4 py-2.5 font-serif text-stone-900 placeholder-stone-400 outline-none focus:ring-1 focus:ring-amber-800 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-amber-800 hover:bg-amber-700 text-amber-50 font-mono text-xs uppercase py-2.5 rounded font-bold shadow transition-all disabled:opacity-50"
                    >
                      {submitting ? 'Transmitting Data...' : 'Submit to Admin Matrix'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSuggest(false)}
                      className="px-4 py-2.5 font-mono text-xs uppercase text-stone-600 hover:bg-black/5 rounded transition-colors"
                    >
                      Abort
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* Live Case Board Track Streams */}
            <section className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono pb-4 border-b border-amber-900/40">
                <div>
                  <h3 className="text-xl font-bold text-amber-500 tracking-wide uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    Live Active Files
                  </h3>
                  <p className="text-xs text-amber-100/40 mt-0.5">
                    Select a core anchor point to review tactical records
                  </p>
                </div>
                <span className="text-xs font-bold bg-[#2d1a12] text-amber-400 px-4 py-2 rounded border border-amber-950/60 self-start sm:self-auto">
                  {topics.length} Total Directories Loaded
                </span>
              </div>

              {topics.length === 0 ? (
                <div className="rounded-2xl border-4 border-dashed border-[#5d4037] bg-[#2d1a12]/40 p-16 text-center text-amber-100/40 max-w-md mx-auto relative backdrop-blur-sm">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full shadow-md"></div>
                  <p className="font-mono text-base font-bold uppercase tracking-wider text-amber-600">Zero Active Files</p>
                  <p className="text-xs font-mono mt-2">No classified discussion vectors have passed verification protocols yet.</p>
                </div>
              ) : (
                <div className="grid gap-8 sm:grid-cols-2">
                  {topics.map((topic) => {
                    const stickyColor = getDeterministicStyle(topic.id, STICKY_COLORS)
                    const pinColor = getDeterministicStyle(topic.id, PIN_COLORS)
                    const rotation = (topic.title.length % 6) - 3

                    return (
                      <Link
                        key={topic.id}
                        href={`/topic/${topic.id}`}
                        style={{ transform: `rotate(${rotation}deg)` }}
                        className={`group ${stickyColor} border p-6 relative shadow-[4px_4px_12px_rgba(0,0,0,0.35)] hover:shadow-[12px_12px_24px_rgba(0,0,0,0.55)] hover:scale-[1.02] transition-all rounded-sm flex flex-col justify-between`}
                      >
                        {/* Hanging Visual Top Centered Pushpin */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full ${pinColor} relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full shadow-md`}></div>
                          <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
                        </div>

                        <div>
                          <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-2 mb-3">
                            <h4 className="text-base font-mono font-black tracking-tight leading-tight group-hover:underline">
                              {topic.title}
                            </h4>
                            <span className="shrink-0 text-[9px] uppercase tracking-wider bg-black/10 px-1.5 py-0.5 rounded font-mono font-bold border border-black/5">
                              Open File
                            </span>
                          </div>

                          {topic.description && (
                            <p className="font-serif text-sm leading-relaxed opacity-80 line-clamp-3 mb-6">
                              {topic.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[11px] font-mono opacity-70">
                          <span className="flex items-center gap-1 font-bold">
                            📂 {topic.note_count || 0} standpoints
                          </span>
                          <span>
                            {new Date(topic.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          </main>
        </>
      )}
    </div>
  )
}