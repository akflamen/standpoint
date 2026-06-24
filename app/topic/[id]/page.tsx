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

export default function TopicPage() {
  const params = useParams()
  const topicId = params.id as string

  const [notes, setNotes] = useState<Note[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)

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
        body: JSON.stringify({ topicId, content, parentNoteId: replyingToId }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not post note')
      }

      setContent('')
      setIsPopupOpen(false)
      setReplyingToId(null)
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

  const openNewNotePopup = () => {
    setReplyingToId(null)
    setContent('')
    setError('')
    setIsPopupOpen(true)
  }

  const openReplyPopup = (parentNoteId: string) => {
    setReplyingToId(parentNoteId)
    setContent('')
    setError('')
    setIsPopupOpen(true)
  }

  // Helper to re-arrange flat array into grouped threads for the chat UI
  const getThreadedNotes = (): Note[] => {
    const rootNotes = notes.filter(n => !n.parent_note_id)
    const replyNotes = notes.filter(n => n.parent_note_id)
    const orderedThreads: Note[] = []

    rootNotes.forEach(root => {
      orderedThreads.push(root)
      // Grab all direct replies to this specific note
      const directReplies = replyNotes.filter(reply => reply.parent_note_id === root.id)
      orderedThreads.push(...directReplies)
    })

    // Fallback: If any detached replies exist, put them at the end
    replyNotes.forEach(reply => {
      if (!orderedThreads.find(n => n.id === reply.id)) {
        orderedThreads.push(reply)
      }
    })

    return orderedThreads
  }

  const threadedNotes = getThreadedNotes()
  const parentNoteContext = notes.find(n => n.id === replyingToId)

  return (
    <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] pb-24 relative overflow-x-hidden">
      
      {/* Top Header Panel */}
      <header className="bg-[#2d1a12] border-b-4 border-[#1a0e0a] text-[#d7ccc8] shadow-2xl relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="text-sm font-mono tracking-wider text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-2 uppercase font-bold"
          >
            ← [ Return to Case Files ]
          </Link>
          {session ? (
            <div className="flex items-center gap-3 font-mono text-sm bg-[#1a0e0a] px-4 py-1.5 rounded border border-amber-900">
              <span className="text-amber-600 animate-pulse">● ACTIVE AGENT:</span>
              <span className="font-bold text-white">@{session.username}</span>
            </div>
          ) : (
            <Link 
              href="/auth/login" 
              className="text-sm font-mono font-bold text-red-400 border border-red-900/60 bg-red-950/40 px-4 py-1.5 rounded hover:bg-red-900/30 transition-all"
            >
              Authorization Required [ Sign In ]
            </Link>
          )}
        </div>
      </header>

      {/* Main Corkboard Area */}
      <main className="max-w-3xl mx-auto px-4 py-12 relative min-h-screen">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-amber-100/60 font-mono gap-3">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Unrolling Evidence Board...</span>
          </div>
        ) : (
          <div className="space-y-16 relative">
            
            <div className="text-center font-mono mb-12">
              <h2 className="text-amber-500/40 uppercase tracking-widest text-xs font-bold">Investigation Thread</h2>
              <p className="text-amber-100/80 text-xl font-bold mt-1">Total Evidence Items: {notes.length}</p>
            </div>

            {threadedNotes.length === 0 ? (
              <div className="rounded-2xl border-4 border-dashed border-[#5d4037] bg-[#2d1a12]/40 p-16 text-center text-amber-100/40 max-w-md mx-auto relative backdrop-blur-sm">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full shadow-md"></div>
                <p className="font-mono text-lg font-bold uppercase tracking-wider text-amber-600">Board Clear</p>
                <p className="text-sm font-mono mt-2">No standpoints pinned onto this case file yet.</p>
                <button 
                  onClick={openNewNotePopup}
                  className="mt-6 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 font-mono text-xs rounded uppercase font-bold shadow-lg transition-all"
                >
                  Pin First Clue
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-12 relative">
                {threadedNotes.map((note) => {
                  const stickyColor = getDeterministicStyle(note.id, STICKY_COLORS)
                  const pinColor = getDeterministicStyle(note.id, PIN_COLORS)
                  const rotation = (note.content.length % 7) - 3.5
                  
                  // Shift replies to the right slightly to visual look like a nested chat feed
                  const isReply = !!note.parent_note_id
                  const xOffset = isReply 
                    ? 32 + ((note.content.length % 3) * 4) // Shifted right for reply nesting
                    : ((note.content.length % 5) * 4 - 8)  // Normal center shuffle
                  
                  return (
                    <div 
                      key={note.id} 
                      className="relative w-full flex flex-col items-center"
                      style={{ transform: `translateX(${xOffset}px)` }}
                    >
                      {/* Red line connecting threads context */}
                      {isReply && (
                        <div className="absolute pointer-events-none -left-4 bottom-1/2 w-12 h-24 z-0">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path 
                              d="M 0 0 L 50 100" 
                              fill="none" 
                              stroke="#dc2626" 
                              strokeWidth="4" 
                              strokeDasharray="4 3"
                              className="opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" 
                            />
                          </svg>
                        </div>
                      )}

                      <article
                        style={{ transform: `rotate(${rotation}deg)` }}
                        className={`w-full max-w-md ${stickyColor} border p-6 relative shadow-[5px_5px_15px_rgba(0,0,0,0.4)] hover:shadow-[10px_10px_20px_rgba(0,0,0,0.6)] transition-all group rounded-sm`}
                      >
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full ${pinColor} relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full shadow-md`}></div>
                          <div className="w-[1px] h-2.5 bg-gray-400 shadow-sm"></div>
                        </div>

                        <div className="flex items-start justify-between border-b border-black/10 pb-2 mb-3 font-mono text-xs opacity-75">
                          <div className="flex items-center gap-2">
                            <span className="font-bold underline">@{note.username}</span>
                            {isReply && <span className="bg-red-800 text-red-50 text-[10px] px-1 rounded uppercase tracking-tighter">Reply</span>}
                          </div>
                          <span>
                            {new Date(note.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="font-serif text-base leading-relaxed whitespace-pre-wrap break-words tracking-wide">
                          {note.content}
                        </p>

                        <div className="mt-6 pt-3 border-t border-black/10 flex items-center justify-between">
                          <div className="flex items-center gap-1 bg-black/5 rounded px-2 py-0.5">
                            <button
                              type="button"
                              onClick={() => handleVote(note.id, 1)}
                              disabled={!session}
                              className="text-black/50 hover:text-green-700 disabled:opacity-30 transition-colors p-1"
                            >
                              ▲
                            </button>
                            <span className="text-xs font-mono font-bold min-w-[1.5rem] text-center">
                              {note.score}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleVote(note.id, -1)}
                              disabled={!session}
                              className="text-black/50 hover:text-red-700 disabled:opacity-30 transition-colors p-1"
                            >
                              ▼
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => openReplyPopup(note.id)}
                            className="text-xs font-mono font-bold text-black/60 hover:text-black hover:underline flex items-center gap-1 uppercase"
                          >
                            📍 Connect Thread
                          </button>
                        </div>
                      </article>
                    </div>
                  )
                })}
              </div>
            )}

          </div>
        )}
      </main>

      {/* Floating Error Box */}
      {error && !isPopupOpen && (
        <div className="fixed bottom-6 left-6 max-w-xs bg-red-950/90 text-red-200 text-xs font-mono p-4 rounded border border-red-700 shadow-2xl z-40 animate-bounce">
          ⚠️ ERROR: {error}
        </div>
      )}

      {/* Floating Action Create Plus Button */}
      <button
        onClick={openNewNotePopup}
        className="fixed bottom-8 right-8 w-14 h-14 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center justify-center text-3xl transform hover:scale-110 active:scale-95 transition-all z-30 border-2 border-amber-950"
      >
        ＋
      </button>

      {/* Popup Overlay Composition Modal Form */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#fffbeb] border-2 border-amber-900/40 p-8 rounded shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-md relative transform rotate-1">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full shadow-md z-10"></div>
            
            <div className="flex items-center justify-between border-b border-amber-900/20 pb-3 mb-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-900">
                {replyingToId ? '📌 Drafting Thread Link Reply' : '📝 Pin Independent Standpoint'}
              </h3>
              <button 
                onClick={() => setIsPopupOpen(false)}
                className="w-6 h-6 rounded-full bg-amber-950/10 hover:bg-red-200 hover:text-red-800 flex items-center justify-center font-bold font-mono text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {replyingToId && parentNoteContext && (
              <div className="bg-amber-900/5 p-3 rounded text-xs font-serif italic text-amber-950/70 mb-4 border-l-2 border-amber-800 max-h-16 overflow-y-auto">
                Replying to @{parentNoteContext.username}: &ldquo;{parentNoteContext.content}&rdquo;
              </div>
            )}

            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your claim onto the board... (Up to 128 words limit)"
                  rows={5}
                  className="w-full bg-transparent border-none focus:ring-0 resize-none font-serif text-base text-stone-900 placeholder-stone-400/80 leading-relaxed outline-none"
                  maxLength={1000} 
                />
                
                <div className="mt-3 pt-2 border-t border-amber-900/10 flex items-center justify-between text-xs font-mono text-amber-900/60">
                  <span>
                    {content.trim() === '' ? 0 : content.trim().split(/\s+/).length} / 128 words
                  </span>
                  <span>{content.length} / 1000 chars</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-950/10 border border-red-900/30 text-red-900 text-xs font-mono p-2.5 rounded">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                {!session ? (
                  <div className="text-xs font-mono text-red-800 font-bold bg-red-100 p-2 rounded w-full text-center">
                    🔒 You must sign in to pin evidence here.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={posting || !content.trim() || (content.trim().split(/\s+/).length > 128)}
                    className="w-full bg-amber-800 hover:bg-amber-700 text-amber-50 font-mono text-xs uppercase py-2.5 rounded font-bold shadow transition-all disabled:opacity-40"
                  >
                    {posting ? 'Pinning Core Data...' : '📌 Pin to Board'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}