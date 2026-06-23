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
      <main className="min-h-screen bg-[#f5f0e8] flex items-center justify-center px-4">
        <div className="bg-white border border-[#d4c4a8] rounded-lg p-6 max-w-sm w-full shadow-md">
          <h1 className="text-lg font-bold text-[#2c1810] mb-4">Admin Access</h1>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Admin password"
            onKeyDown={e => e.key === 'Enter' && fetchTopics(secret)}
            className="w-full border border-[#d4c4a8] rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:border-[#2c1810] bg-[#faf8f4]"
          />
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <button
            onClick={() => fetchTopics(secret)}
            disabled={loading || !secret}
            className="w-full bg-[#2c1810] text-[#f5f0e8] py-2 rounded text-sm hover:bg-[#4a2c1a] transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </div>
      </main>
    )
  }

  const pending = topics.filter(t => t.status === 'pending')
  const approved = topics.filter(t => t.status === 'approved')
  const rejected = topics.filter(t => t.status === 'rejected')

  return (
    <main className="min-h-screen bg-[#f5f0e8]">
      <header className="bg-[#2c1810] text-[#f5f0e8] px-6 py-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">Standpoint Admin</h1>
          <button
            onClick={() => fetchTopics(secret)}
            className="text-xs bg-[#f5f0e8] text-[#2c1810] px-3 py-1.5 rounded hover:bg-[#c4a882] transition-colors"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Pending */}
        <div>
          <h2 className="text-sm font-semibold text-[#2c1810] mb-3">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-xs text-[#8b7355]">No pending topics.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map(topic => (
                <div
                  key={topic.id}
                  className="bg-white border border-[#d4c4a8] rounded-lg p-4 shadow-sm"
                >
                  <p className="font-medium text-sm text-[#2c1810]">{topic.title}</p>
                  {topic.description && (
                    <p className="text-xs text-[#8b7355] mt-1">{topic.description}</p>
                  )}
                  <p className="text-xs text-[#c4a882] mt-1">
                    {new Date(topic.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAction(topic.id, 'approve')}
                      className="text-xs bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(topic.id, 'reject')}
                      className="text-xs bg-red-600 text-white px-4 py-1.5 rounded hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved */}
        <div>
          <h2 className="text-sm font-semibold text-[#2c1810] mb-3">
            Approved ({approved.length})
          </h2>
          <div className="flex flex-col gap-2">
            {approved.map(topic => (
              <div
                key={topic.id}
                className="bg-white border border-green-200 rounded-lg p-3 shadow-sm flex items-center justify-between"
              >
                <p className="text-sm text-[#2c1810]">{topic.title}</p>
                <button
                  onClick={() => handleAction(topic.id, 'reject')}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rejected */}
        {rejected.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[#2c1810] mb-3">
              Rejected ({rejected.length})
            </h2>
            <div className="flex flex-col gap-2">
              {rejected.map(topic => (
                <div
                  key={topic.id}
                  className="bg-white border border-red-100 rounded-lg p-3 shadow-sm flex items-center justify-between opacity-60"
                >
                  <p className="text-sm text-[#2c1810]">{topic.title}</p>
                  <button
                    onClick={() => handleAction(topic.id, 'approve')}
                    className="text-xs text-green-600 hover:text-green-800 transition-colors"
                  >
                    Re-approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[#d4c4a8] pt-6">
          <h2 className="text-sm font-semibold text-[#2c1810] mb-3">
            User moderation
          </h2>
          <div className="bg-white border border-[#d4c4a8] rounded-lg p-4 shadow-sm space-y-3">
            <input
              type="text"
              value={banUsername}
              onChange={(e) => setBanUsername(e.target.value)}
              placeholder="Username to ban or unban"
              className="w-full border border-[#d4c4a8] rounded px-3 py-2 text-sm bg-[#faf8f4] focus:outline-none focus:border-[#2c1810]"
            />
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Ban reason (optional)"
              className="w-full border border-[#d4c4a8] rounded px-3 py-2 text-sm bg-[#faf8f4] focus:outline-none focus:border-[#2c1810]"
            />

            {lookupUser && (
              <div className="rounded border border-[#d4c4a8] bg-[#faf8f4] px-3 py-2 text-xs text-[#4a2c1a]">
                <p>Status: {lookupUser.banned ? 'Banned' : 'Active'}</p>
                {lookupUser.banned && lookupUser.ban_reason && (
                  <p>Reason: {lookupUser.ban_reason}</p>
                )}
                <p>Premium: {lookupUser.premium ? 'Yes' : 'No'}</p>
              </div>
            )}

            {banMessage && (
              <p className="text-xs text-[#4a2c1a]">{banMessage}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={lookupBanUser}
                disabled={!banUsername.trim() || banLoading}
                className="text-xs border border-[#2c1810] px-4 py-1.5 rounded hover:bg-[#faf8f4] transition-colors disabled:opacity-50"
              >
                Look up user
              </button>
              <button
                onClick={() => handleBanAction('ban')}
                disabled={!banUsername.trim() || banLoading}
                className="text-xs bg-red-600 text-white px-4 py-1.5 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Ban user
              </button>
              <button
                onClick={() => handleBanAction('unban')}
                disabled={!banUsername.trim() || banLoading}
                className="text-xs bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Unban user
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}