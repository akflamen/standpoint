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

  // --- GATEWAY LOCK STATE ---
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-[#fff7ed] text-amber-950 border border-[#fed7aa] p-8 shadow-[6px_6px_20px_rgba(0,0,0,0.4)] relative rounded-sm transform rotate-1">
          {/* Top Red Security Pin */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
            <div className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
            <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
          </div>

          <div className="text-center mb-6">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded bg-red-950/10 border border-red-900/20 inline-block text-red-900 mb-3">
              RESTRICTED PERIMETER COMMAND
            </span>
            <h1 className="text-3xl font-serif font-black tracking-tight text-amber-950">Admin Console</h1>
            <p className="mt-1 text-xs font-mono opacity-60 uppercase tracking-wide">Provide Master Token Token to Authorize Access</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); fetchTopics(secret); }} className="space-y-4 font-mono">
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="CLEARANCE SECRET KEY..."
              className="w-full bg-[#fafaf9] border border-amber-900/20 rounded px-3 py-2.5 text-sm text-amber-950 focus:outline-none focus:border-amber-800 shadow-inner"
              autoFocus
            />
            {error && (
              <div className="rounded border-l-4 border-red-600 bg-red-950/5 p-3 text-xs text-red-900">
                <span className="font-bold">[REJECTED]:</span> {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !secret}
              className="w-full bg-red-950 hover:bg-red-900 disabled:bg-red-950/40 text-red-50 py-3.5 rounded font-bold text-xs uppercase tracking-widest transition-all shadow-md"
            >
              {loading ? 'VALIDATING CREDS...' : 'INITIALIZE CONSOLE LINK'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const pending = topics.filter(t => t.status === 'pending')
  const approved = topics.filter(t => t.status === 'approved')
  const rejected = topics.filter(t => t.status === 'rejected')

  // --- AUTHENTICATED BOARD PANEL ---
  return (
    <div className="min-h-screen bg-[#3e2723] bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] pb-12">
      {/* Dossier Header */}
      <header className="bg-[#fff7ed] border-b border-[#fed7aa] shadow-sm font-mono">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-sm relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/40 after:rounded-full"></div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-red-800">Root Directory</p>
              <p className="text-sm font-serif font-black text-amber-950">Terminal Moderation Ledger</p>
            </div>
          </div>
          <button
            onClick={() => fetchTopics(secret)}
            className="border border-amber-900/30 hover:bg-amber-900/5 text-amber-900 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
          >
            ↻ Sync Registry
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid gap-10">
          
          {/* MANILA SHEET 1: TOPIC MODERATION */}
          <section className="bg-[#fff7ed] text-amber-950 border border-[#fed7aa] p-6 md:p-8 shadow-[4px_4px_15px_rgba(0,0,0,0.3)] relative rounded-sm">
            <h2 className="text-xl font-serif font-black tracking-tight border-b-2 border-amber-900/10 pb-2 mb-6">
              📁 Queue Item Manifest (Topics)
            </h2>

            {/* Micro Counter Indexes */}
            <div className="grid grid-cols-3 gap-4 mb-8 font-mono text-xs">
              <div className="rounded border border-amber-900/10 bg-amber-50/50 p-3">
                <p className="font-bold uppercase tracking-wider text-amber-700">Awaiting Action</p>
                <p className="mt-1 text-2xl font-black">{pending.length}</p>
              </div>
              <div className="rounded border border-green-900/10 bg-green-950/5 p-3">
                <p className="font-bold uppercase tracking-wider text-green-700">Passed Index</p>
                <p className="mt-1 text-2xl font-black text-green-800">{approved.length}</p>
              </div>
              <div className="rounded border border-red-900/10 bg-red-950/5 p-3">
                <p className="font-bold uppercase tracking-wider text-red-700">Purged Array</p>
                <p className="mt-1 text-2xl font-black text-red-800">{rejected.length}</p>
              </div>
            </div>

            {/* Target Pending Items */}
            {pending.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-mono font-black uppercase tracking-wider text-amber-900/70 mb-3">
                  Unprocessed Entry Arrays ({pending.length})
                </h3>
                <div className="space-y-3 font-mono">
                  {pending.map(topic => (
                    <div key={topic.id} className="rounded border border-amber-900/10 bg-[#fafaf9] p-4 shadow-sm">
                      <div className="mb-3">
                        <p className="font-bold text-amber-950 text-sm">» {topic.title}</p>
                        {topic.description && (
                          <p className="mt-1 text-xs opacity-70 bg-amber-900/5 p-2 rounded border border-dashed border-amber-900/10">{topic.description}</p>
                        )}
                        <p className="mt-2 text-[10px] opacity-50 uppercase tracking-wider">
                          Timestamp Array: {new Date(topic.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-amber-900/5">
                        <button
                          onClick={() => handleAction(topic.id, 'approve')}
                          className="flex-1 px-3 py-1.5 bg-green-800 hover:bg-green-700 text-green-50 rounded font-bold text-xs uppercase tracking-widest transition-colors"
                        >
                          ✓ Authorize
                        </button>
                        <button
                          onClick={() => handleAction(topic.id, 'reject')}
                          className="flex-1 px-3 py-1.5 bg-red-800 hover:bg-red-700 text-red-50 rounded font-bold text-xs uppercase tracking-widest transition-colors"
                        >
                          ✕ Purge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pending.length === 0 && (
              <div className="rounded border-2 border-dashed border-amber-900/10 p-8 text-center font-mono text-xs opacity-50 uppercase tracking-widest">
                No backlog data logs remaining. Registry clean.
              </div>
            )}

            {/* Approved Feed */}
            {approved.length > 0 && (
              <div className="mt-6 font-mono">
                <h3 className="text-xs font-black uppercase tracking-wider text-green-800/80 mb-2">Authorized Node Records</h3>
                <div className="grid gap-1.5 text-xs">
                  {approved.map(topic => (
                    <div key={topic.id} className="rounded border border-green-900/15 bg-green-950/5 px-3 py-2 flex items-center justify-between">
                      <span className="opacity-90 font-medium truncate max-w-md">{topic.title}</span>
                      <button
                        onClick={() => handleAction(topic.id, 'reject')}
                        className="text-[10px] text-red-800 hover:underline font-bold uppercase tracking-wider ml-2"
                      >
                        [Revoke]
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Feed */}
            {rejected.length > 0 && (
              <div className="mt-6 font-mono">
                <h3 className="text-xs font-black uppercase tracking-wider text-red-800/80 mb-2">Purged / Quarantined Elements</h3>
                <div className="grid gap-1.5 text-xs opacity-60">
                  {rejected.map(topic => (
                    <div key={topic.id} className="rounded border border-red-900/15 bg-red-950/5 px-3 py-2 flex items-center justify-between">
                      <span className="line-through truncate max-w-md">{topic.title}</span>
                      <button
                        onClick={() => handleAction(topic.id, 'approve')}
                        className="text-[10px] text-green-800 hover:underline font-bold uppercase tracking-wider ml-2"
                      >
                        [Restore]
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* MANILA SHEET 2: INTERCEPT / PERIMETER EXCLUSIONS */}
          <section className="bg-[#fff7ed] text-amber-950 border border-[#fed7aa] p-6 md:p-8 shadow-[4px_4px_15px_rgba(0,0,0,0.3)] relative rounded-sm transform rotate-0.5">
            {/* Top Blue Pushpin to distinguish sections */}
            <div className="absolute -top-3 left-8 z-10 flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-md relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1 after:h-1 after:bg-white/60 after:rounded-full"></div>
              <div className="w-[1px] h-2 bg-gray-400/80 shadow-sm"></div>
            </div>

            <h2 className="text-xl font-serif font-black tracking-tight border-b-2 border-amber-900/10 pb-2 mb-6">
              🚫 Perimeter Exclusions & Intercepts (Users)
            </h2>
            
            <div className="font-mono">
              <div className="grid md:grid-cols-2 gap-4 mb-5 text-xs">
                <div>
                  <label className="block uppercase font-black tracking-wider text-amber-900/80 mb-1.5">
                    Target Handle Unique Identity
                  </label>
                  <input
                    type="text"
                    value={banUsername}
                    onChange={(e) => setBanUsername(e.target.value)}
                    placeholder="Enter unique handle..."
                    className="w-full bg-[#fafaf9] border border-amber-900/20 rounded px-3 py-2 text-sm text-amber-950 focus:outline-none focus:border-amber-800 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block uppercase font-black tracking-wider text-amber-900/80 mb-1.5">
                    Exclusion Reason Directive
                  </label>
                  <input
                    type="text"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="e.g., MALICIOUS_SPAM, CODE_INJECTION..."
                    className="w-full bg-[#fafaf9] border border-amber-900/20 rounded px-3 py-2 text-sm text-amber-950 focus:outline-none focus:border-amber-800 shadow-inner"
                  />
                </div>
              </div>

              {/* Identity State Inspection Deck */}
              {lookupUser && (
                <div className={`rounded p-4 mb-5 text-xs ${
                  lookupUser.banned
                    ? 'border border-red-900/20 bg-red-950/5 text-red-900'
                    : 'border border-green-900/20 bg-green-950/5 text-green-900'
                }`}>
                  <p className="font-black text-sm uppercase tracking-wide">
                    Identity Trace: @{lookupUser.username}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-mono uppercase tracking-wider">
                    <div>
                      <p className="opacity-50">Perimeter</p>
                      <p className="font-black">{lookupUser.banned ? '🚫 EXCLUDED / BANNED' : '✓ CLEAR / ACTIVE'}</p>
                    </div>
                    <div>
                      <p className="opacity-50">Directive</p>
                      <p className="font-black truncate">{lookupUser.ban_reason || 'NONE_RECORDED'}</p>
                    </div>
                    <div>
                      <p className="opacity-50">Account Tier</p>
                      <p className="font-black">{lookupUser.premium ? '✨ SPECIAL_CLEARANCE' : 'STANDARD'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Execution Feedback Alerts */}
              {banMessage && (
                <div className="rounded border border-amber-900/20 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 mb-5">
                  <span className="font-bold uppercase mr-1">[PIPELINE FEEDBACK]:</span> {banMessage}
                </div>
              )}

              {/* Operation Switches */}
              <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
                <button
                  onClick={lookupBanUser}
                  disabled={!banUsername.trim() || banLoading}
                  className="px-4 py-2.5 rounded border border-amber-900/30 text-amber-900 hover:bg-amber-900/5 disabled:opacity-40 transition-all"
                >
                  🔍 Query Handle Status
                </button>
                <button
                  onClick={() => handleBanAction('ban')}
                  disabled={!banUsername.trim() || banLoading}
                  className="px-4 py-2.5 rounded bg-red-950 hover:bg-red-900 text-red-50 disabled:opacity-40 transition-all shadow"
                >
                  🚫 Enforce Blacklist Exclusion
                </button>
                <button
                  onClick={() => handleBanAction('unban')}
                  disabled={!banUsername.trim() || banLoading}
                  className="px-4 py-2.5 rounded bg-green-950 hover:bg-green-900 text-green-50 disabled:opacity-40 transition-all shadow"
                >
                  ✓ Purge Exclusion Record
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}