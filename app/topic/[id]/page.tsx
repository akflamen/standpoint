'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

interface Note {
  id: string
  content: string
  username: string
  parent_note_id: string | null
  created_at: string
  score: number
  voteCount: number
}

interface Session {
  username: string
  token: string
}

// Pin component — red 3D-style pin
function Pin() {
  return (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
      <div
        className="w-4 h-4 rounded-full shadow-md"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
        }}
      />
      <div
        className="w-0.5 h-3 bg-[#8b0000] mx-auto"
        style={{ marginTop: '-2px' }}
      />
    </div>
  )
}

// Thread connector between reply and parent using SVG
function ThreadConnector({ fromId, toId }: { fromId: string; toId: string }) {
  const [path, setPath] = useState('')

  useEffect(() => {
    function calcPath() {
      const from = document.getElementById(`note-${fromId}`)
      const to = document.getElementById(`note-${toId}`)
      if (!from || !to) return

      const fromRect = from.getBoundingClientRect()
      const toRect = to.getBoundingClientRect()
      const container = document.getElementById('board-container')
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      const x1 = fromRect.left + fromRect.width / 2 - containerRect.left
      const y1 = fromRect.top - containerRect.top
      const x2 = toRect.left + toRect.width / 2 - containerRect.left
      const y2 = toRect.bottom - containerRect.top

      const midY = (y1 + y2) / 2
      setPath(`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`)
    }

    calcPath()
    window.addEventListener('resize', calcPath)
    return () => window.removeEventListener('resize', calcPath)
  }, [fromId, toId])

  if (!path) return null

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ overflow: 'visible' }}
    >
      <path
        d={path}
        fill="none"
        stroke="#c0392b"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.7"
      />
    </svg>
  )
}

// Single note card
function NoteCard({
  note,
  session,
  onReply,
  onVote,
  depth,
}: {
  note: Note
  session: Session | null
  onReply: (noteId: string) => void
  onVote: (noteId: string, value: 1 | -1) => void
  depth: number
}) {
  const colors = ['#fefce8', '#f0fdf4', '#eff6ff', '#fdf4ff', '#fff7ed']
  const bgColor = colors[depth % colors.length]

  return (
    <div
      id={`note-${note.id}`}
      className="relative pt-4"
      style={{ marginLeft: depth > 0 ? `${Math.min(depth * 24, 72)}px` : '0' }}
    >
      <Pin />
      <div
        className="rounded border border-[#d4c4a8] p-3 shadow-sm relative z-10"
        style={{
          backgroundColor: bgColor,
          boxShadow: '2px 2px 6px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#2c1810]">@{note.username}</span>
          <span className="text-xs text-[#c4a882]">
            {new Date(note.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-[#2c1810] leading-relaxed mb-3 whitespace-pre-wrap">
          {note.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {session && (
            <>
              <button
                onClick={() => onVote(note.id, 1)}
                className="text-xs text-[#2c1810] hover:text-green-700 font-medium transition-colors"
              >
                ▲
              </button>
              <span className="text-xs font-semibold text-[#2c1810] min-w-5 text-center">
                {note.score}
              </span>
              <button
                onClick={() => onVote(note.id, -1)}
                className="text-xs text-[#2c1810] hover:text-red-700 font-medium transition-colors"
              >
                ▼
              </button>
              <button
                onClick={() => onReply(note.id)}
                className="text-xs text-[#8b7355] hover:text-[#2c1810] ml-2 transition-colors"
              >
                Reply
              </button>
            </>
          )}
          {!session && (
            <span className="text-xs text-[#8b7355]">
              Score: {note.score}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TopicPage() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.id as string

  const [notes, setNotes] = useState<Note[]>([])
  const [topicTitle, setTopicTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setSession(getSession())
    fetchTopic()
    fetchNotes()
  }, [topicId])

  async function fetchTopic() {
    try {
      const res = await fetch('/api/topics')
      const data = await res.json()
      const topic = data.topics?.find((t: { id: string; title: string }) => t.id === topicId)
      if (topic) setTopicTitle(topic.title)
    } catch {
      console.error('Failed to fetch topic')
    }
  }

  async function fetchNotes() {
    try {
      const res = await fetch(`/api/notes?topicId=${topicId}`)
      const data = await res.json()
      setNotes(data.notes || [])
    } catch {
      console.error('Failed to fetch notes')
    } finally {
      setLoading(false)
    }
  }

  async function postNote() {
    if (!session || !newNote.trim()) return
    setPosting(true)
    setPostError('')
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          content: newNote.trim(),
          parentNoteId: replyingTo,
          token: session.token,
          username: session.username,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNotes(prev => [...prev, data.note])
      setNewNote('')
      setReplyingTo(null)
      setShowForm(false)
    } catch (err: unknown) {
      setPostError(err instanceof Error ? err.message : 'Failed to post')
    } finally {
      setPosting(false)
    }
  }

  async function handleVote(noteId: string, value: 1 | -1) {
    if (!session) return
    try {
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          voteValue: value,
          token: session.token,
          username: session.username,
        }),
      })
      // Optimistic update
      setNotes(prev =>
        prev.map(n =>
          n.id === noteId ? { ...n, score: n.score + value } : n
        )
      )
    } catch {
      console.error('Vote failed')
    }
  }

  function handleReply(noteId: string) {
    setReplyingTo(noteId)
    setShowForm(true)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  // Build nested tree structure
  function buildTree(notes: Note[], parentId: string | null = null, depth = 0): React.ReactNode[] {
    return notes
      .filter(n => n.parent_note_id === parentId)
      .map(note => (
        <div key={note.id} className="relative">
          {parentId && (
            <ThreadConnector fromId={note.id} toId={parentId} />
          )}
          <NoteCard
            note={note}
            session={session}
            onReply={handleReply}
            onVote={handleVote}
            depth={depth}
          />
          <div className="mt-2">
            {buildTree(notes, note.id, depth + 1)}
          </div>
        </div>
      ))
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8]">
      {/* Header */}
      <header className="bg-[#2c1810] text-[#f5f0e8] px-6 py-4 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="text-xs text-[#c4a882] hover:text-[#f5f0e8] transition-colors">
              ← Back to topics
            </Link>
            <h1 className="text-lg font-bold mt-1">{topicTitle || 'Loading...'}</h1>
          </div>
          {!session && (
            <Link
              href="/auth"
              className="text-xs bg-[#f5f0e8] text-[#2c1810] px-3 py-1.5 rounded hover:bg-[#c4a882] transition-colors font-medium"
            >
              Sign in to participate
            </Link>
          )}
          {session && (
            <span className="text-xs text-[#c4a882]">@{session.username}</span>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6" id="board-container">
        {/* Notes board */}
        {loading ? (
          <p className="text-sm text-[#8b7355] text-center py-12">Loading board...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-[#8b7355] text-center py-12">
            No notes yet. Be the first to post your angle.
          </p>
        ) : (
          <div className="flex flex-col gap-4 relative">
            {buildTree(notes)}
          </div>
        )}

        {/* Floating + button */}
        {session && !showForm && (
          <button
            onClick={() => { setReplyingTo(null); setShowForm(true) }}
            className="fixed bottom-6 right-6 w-12 h-12 bg-[#2c1810] text-[#f5f0e8] rounded-full text-2xl shadow-lg hover:bg-[#4a2c1a] transition-colors flex items-center justify-center z-50"
          >
            +
          </button>
        )}

        {/* Note form */}
        {showForm && session && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#d4c4a8] p-4 shadow-lg z-50">
            <div className="max-w-3xl mx-auto">
              {replyingTo && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#8b7355]">
                    Replying to a note — your reply will be pinned with a thread
                  </span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-xs text-[#c4a882] hover:text-[#2c1810]"
                  >
                    × Remove reply
                  </button>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder={replyingTo ? 'Write your reply...' : 'Write your angle on this topic...'}
                rows={3}
                maxLength={1000}
                className="w-full border border-[#d4c4a8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#2c1810] bg-[#faf8f4] resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#c4a882]">{newNote.length}/1000</span>
                  {postError && <span className="text-xs text-red-600">{postError}</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowForm(false); setReplyingTo(null); setNewNote('') }}
                    className="text-xs text-[#8b7355] px-3 py-1.5 hover:text-[#2c1810] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={postNote}
                    disabled={posting || !newNote.trim()}
                    className="text-xs bg-[#2c1810] text-[#f5f0e8] px-4 py-1.5 rounded hover:bg-[#4a2c1a] transition-colors disabled:opacity-50"
                  >
                    {posting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}