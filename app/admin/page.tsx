'use client'

import { useState } from 'react'

interface Topic {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [banUsername, setBanUsername] = useState('')
  const [banReason, setBanReason] = useState('')
  const [banMessage, setBanMessage] = useState('')
  const [banLoading, setBanLoading] = useState(false)
  const [lookupUser, setLookupUser] = useState<{
    username: string
    banned: boolean
    ban_reason: string | null
    premium: boolean
  } | null>(null)

  async function fetchTopics(s: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/topics', {
        headers: { 'x-admin-secret': s },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTopics(data.topics)
      setAuthed(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
      setAuthed(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(topicId: string, action: 'approve' | 'reject') {
    try {
      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({ topicId, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTopics(prev =>
        prev.map(t =>
          t.id === topicId
            ? { ...t, status: action === 'approve' ? 'approved' : 'rejected' }
            : t
        )
      )
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function lookupBanUser() {
    if (!banUsername.trim()) return
    try {
      const res = await fetch(
        `/api/admin/ban?username=${encodeURIComponent(banUsername.trim())}`,
        { headers: { 'x-admin-secret': secret } }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLookupUser(data.account)
    } catch {
      setLookupUser(null)
    }
  }

  async function handleBanAction(action: 'ban' | 'unban') {
    setBanLoading(true)
    setBanMessage('')
    try {
      const res = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({
          username: banUsername,
          action,
          reason: banReason,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBanMessage(data.message)
      await lookupBanUser()
    } catch (err: unknown) {
      setBanMessage(err instanceof Error ? err.message : 'Ban action failed')
    } finally {
      setBanLoading(false)
    }
  }

  if (!authed) {
    return (
      <div className="sp-page min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-(--sp-border) bg-(--sp-card) p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">⚙️</span>
            </div>
            <h1 className="text-3xl font-bold text-(--sp-text)">Admin Console</h1>
            <p className="mt-2 text-(--sp-text-muted)">Authenticate to access moderation tools</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); fetchTopics(secret); }} className="space-y-4">
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Admin secret key"
              className="w-full sp-input sp-input-glow rounded-lg px-4 py-3"
              autoFocus
            />
            {error && <div className="alert-info">{error}</div>}
            <button
              type="submit"
              disabled={loading || !secret}
              className="w-full sp-btn-primary py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const pending = topics.filter(t => t.status === 'pending')
  const approved = topics.filter(t => t.status === 'approved')
  const rejected = topics.filter(t => t.status === 'rejected')

  return (
    <div className="sp-page min-h-screen">
      {/* Header */}
      <header className="sp-header border-b border-(--sp-border)">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <span className="text-white font-bold">⚙️</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold text-red-600 dark:text-red-400">
                Admin Panel
              </p>
              <p className="text-sm font-bold text-(--sp-text)">Moderation Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => fetchTopics(secret)}
            className="sp-btn-secondary px-4 py-2 rounded-lg text-sm font-semibold"
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid gap-8">
          {/* Topic Moderation */}
          <section>
            <h2 className="text-2xl font-bold text-(--sp-text) mb-6">Topic Moderation</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl border border-(--sp-border) bg-[var(--sp-card)] p-4">
                <p className="text-xs uppercase tracking-widest font-semibold text-amber-600">Pending</p>
                <p className="mt-2 text-3xl font-bold text-(--sp-text)">{pending.length}</p>
              </div>
              <div className="rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 p-4">
                <p className="text-xs uppercase tracking-widest font-semibold text-green-700 dark:text-green-300">Approved</p>
                <p className="mt-2 text-3xl font-bold text-green-700 dark:text-green-300">{approved.length}</p>
              </div>
              <div className="rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 p-4">
                <p className="text-xs uppercase tracking-widest font-semibold text-red-700 dark:text-red-300">Rejected</p>
                <p className="mt-2 text-3xl font-bold text-red-700 dark:text-red-300">{rejected.length}</p>
              </div>
            </div>

            {/* Pending Topics */}
            {pending.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[var(--sp-text)] mb-4">
                  Awaiting Review ({pending.length})
                </h3>
                <div className="space-y-3">
                  {pending.map(topic => (
                    <div
                      key={topic.id}
                      className="rounded-xl border border-(--sp-border) bg-[var(--sp-card)] p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-[var(--sp-text)]">{topic.title}</p>
                          {topic.description && (
                            <p className="mt-1 text-sm text-[var(--sp-text-muted)]">{topic.description}</p>
                          )}
                          <p className="mt-2 text-xs text-[var(--sp-text-muted)]">
                            📅 {new Date(topic.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-[var(--sp-border)]">
                        <button
                          onClick={() => handleAction(topic.id, 'approve')}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleAction(topic.id, 'reject')}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pending.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-[var(--sp-border)] bg-[var(--sp-bg-soft)] p-8 text-center text-[var(--sp-text-muted)]">
                No pending topics. All submissions have been reviewed.
              </div>
            )}

            {/* Approved Topics */}
            {approved.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-[var(--sp-text)] mb-4">
                  Approved ({approved.length})
                </h3>
                <div className="grid gap-2">
                  {approved.map(topic => (
                    <div
                      key={topic.id}
                      className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 p-4 flex items-center justify-between"
                    >
                      <p className="text-sm font-medium text-[var(--sp-text)]">{topic.title}</p>
                      <button
                        onClick={() => handleAction(topic.id, 'reject')}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Topics */}
            {rejected.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-[var(--sp-text)] mb-4">
                  Rejected ({rejected.length})
                </h3>
                <div className="grid gap-2">
                  {rejected.map(topic => (
                    <div
                      key={topic.id}
                      className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 p-4 flex items-center justify-between opacity-70"
                    >
                      <p className="text-sm font-medium text-[var(--sp-text)]">{topic.title}</p>
                      <button
                        onClick={() => handleAction(topic.id, 'approve')}
                        className="text-xs text-green-600 hover:text-green-800 font-semibold"
                      >
                        Re-approve
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* User Moderation */}
          <section>
            <h2 className="text-2xl font-bold text-[var(--sp-text)] mb-6">User Moderation</h2>
            <div className="rounded-2xl border border-[var(--sp-border)] bg-[var(--sp-card)] p-6 shadow-md">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--sp-text)] mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={banUsername}
                    onChange={(e) => setBanUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="w-full sp-input sp-input-glow rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--sp-text)] mb-2">
                    Ban Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="e.g., Spam, Abuse..."
                    className="w-full sp-input sp-input-glow rounded-lg px-4 py-3"
                  />
                </div>
              </div>

              {lookupUser && (
                <div className={`rounded-lg p-4 mb-4 ${
                  lookupUser.banned
                    ? 'border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
                    : 'border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20'
                }`}>
                  <p className="text-sm font-semibold text-[var(--sp-text)]">
                    @{lookupUser.username}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-[var(--sp-text-muted)]">Status</p>
                      <p className="font-semibold">{lookupUser.banned ? '🚫 Banned' : '✓ Active'}</p>
                    </div>
                    <div>
                      <p className="text-[var(--sp-text-muted)]">Reason</p>
                      <p className="font-semibold">{lookupUser.ban_reason || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[var(--sp-text-muted)]">Premium</p>
                      <p className="font-semibold">{lookupUser.premium ? '✨ Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              )}

              {banMessage && (
                <div className="alert-info mb-4">
                  {banMessage}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={lookupBanUser}
                  disabled={!banUsername.trim() || banLoading}
                  className="sp-btn-secondary px-6 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  🔍 Look Up User
                </button>
                <button
                  onClick={() => handleBanAction('ban')}
                  disabled={!banUsername.trim() || banLoading}
                  className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  🚫 Ban User
                </button>
                <button
                  onClick={() => handleBanAction('unban')}
                  disabled={!banUsername.trim() || banLoading}
                  className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  ✓ Unban User
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}