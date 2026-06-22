'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, clearSession } from '@/lib/auth'
import Link from 'next/link'

interface AccountInfo {
  username: string
  tier: string
  created_at: string
  premium: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const [session, setSession] = useState<{ username: string; token: string } | null>(null)
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [premiumCode, setPremiumCode] = useState('')
  const [premiumMsg, setPremiumMsg] = useState('')
  const [premiumLoading, setPremiumLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  useEffect(() => {
    const s = getSession()
    if (!s) {
      router.push('/auth')
      return
    }
    setSession(s)
    fetchAccount(s.username, s.token)
  }, [])

  async function fetchAccount(username: string, token: string) {
    try {
      const res = await fetch(`/api/profile?username=${username}&token=${token}`)
      const data = await res.json()
      if (res.ok) setAccount(data.account)
    } catch {
      console.error('Failed to fetch account')
    } finally {
      setLoading(false)
    }
  }

  async function redeemPremium() {
    if (!session || !premiumCode.trim()) return
    setPremiumLoading(true)
    setPremiumMsg('')
    try {
      const res = await fetch('/api/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: premiumCode.trim(),
          token: session.token,
          username: session.username,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPremiumMsg('Premium activated!')
      setPremiumCode('')
      if (account) setAccount({ ...account, premium: true })
    } catch (err: unknown) {
      setPremiumMsg(err instanceof Error ? err.message : 'Failed to redeem')
    } finally {
      setPremiumLoading(false)
    }
  }

  function handleLogout() {
    clearSession()
    router.push('/')
  }

  const tierColors: Record<string, string> = {
    New: 'bg-gray-100 text-gray-600',
    Established: 'bg-amber-100 text-amber-700',
    Trusted: 'bg-green-100 text-green-700',
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8]">
      {/* Header */}
      <header className="bg-[#2c1810] text-[#f5f0e8] px-6 py-4 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="text-xs text-[#c4a882] hover:text-[#f5f0e8] transition-colors">
              ← Back to topics
            </Link>
            <h1 className="text-lg font-bold mt-1">Your Account</h1>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        {loading ? (
          <p className="text-sm text-[#8b7355] text-center py-12">Loading...</p>
        ) : (
          <div className="flex flex-col gap-4">

            {/* Account info card */}
            <div className="bg-white border border-[#d4c4a8] rounded-lg p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-[#2c1810] mb-4">Account Info</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8b7355]">Username</span>
                  <span className="text-sm font-medium text-[#2c1810]">
                    @{account?.username}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8b7355]">Member since</span>
                  <span className="text-sm text-[#2c1810]">
                    {account?.created_at
                      ? new Date(account.created_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8b7355]">Trust tier</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tierColors[account?.tier || 'New']}`}>
                    {account?.tier || 'New'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8b7355]">Premium</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    account?.premium
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {account?.premium ? 'Active' : 'Free'}
                  </span>
                </div>
              </div>
            </div>

            {/* Premium redemption card */}
            {!account?.premium && (
              <div className="bg-white border border-[#d4c4a8] rounded-lg p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-[#2c1810] mb-1">Activate Premium</h2>
                <p className="text-xs text-[#8b7355] mb-3">
                  Paste the code you received after payment to activate premium membership.
                </p>
                <input
                  type="text"
                  value={premiumCode}
                  onChange={e => setPremiumCode(e.target.value)}
                  placeholder="Paste your code here"
                  className="w-full border border-[#d4c4a8] rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:border-[#2c1810] bg-[#faf8f4] font-mono"
                />
                {premiumMsg && (
                  <p className={`text-xs mb-2 ${premiumMsg.includes('!') ? 'text-green-600' : 'text-red-600'}`}>
                    {premiumMsg}
                  </p>
                )}
                <button
                  onClick={redeemPremium}
                  disabled={premiumLoading || !premiumCode.trim()}
                  className="w-full bg-[#2c1810] text-[#f5f0e8] py-2 rounded text-sm hover:bg-[#4a2c1a] transition-colors disabled:opacity-50"
                >
                  {premiumLoading ? 'Activating...' : 'Activate'}
                </button>
              </div>
            )}

            {/* Change password card */}
            <div className="bg-white border border-[#d4c4a8] rounded-lg p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-[#2c1810] mb-1">Change Password</h2>
              <p className="text-xs text-[#8b7355] mb-3">
                This re-encrypts your private key on this device with the new password.
                Make sure you have your recovery phrase saved before changing it.
              </p>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full border border-[#d4c4a8] rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:border-[#2c1810] bg-[#faf8f4]"
              />
              {passwordMsg && (
                <p className="text-xs text-[#8b7355] mb-2">{passwordMsg}</p>
              )}
              <button
                onClick={() => setPasswordMsg('Coming in V2 — recovery phrase required to re-encrypt safely')}
                className="w-full bg-[#f5f0e8] text-[#2c1810] border border-[#d4c4a8] py-2 rounded text-sm hover:bg-[#e8e0d0] transition-colors"
              >
                Change Password
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full bg-white border border-[#d4c4a8] text-[#8b7355] py-3 rounded-lg text-sm hover:text-red-600 hover:border-red-300 transition-colors shadow-sm"
            >
              Log out
            </button>

          </div>
        )}
      </div>
    </main>
  )
}