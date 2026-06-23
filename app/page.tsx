// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Topic {
  id: string
  title: string
  description: string
  created_at: string
  vote_count: number
}

export default function HomePage() {
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // Check session
        const sessionRes = await fetch('/api/auth/session')
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          setSession(sessionData.session)
        }

        // Load topics
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading topics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Standpoint</h1>
          <div className="space-x-4">
            {session ? (
              <Link
                href="/profile"
                className="text-blue-600 hover:text-blue-800"
              >
                Profile ({session.username})
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Anonymous Debate. Real Ideas.</h2>
        
        <div className="grid gap-4">
          {topics.length === 0 ? (
            <p className="text-gray-500">No topics yet. Create one!</p>
          ) : (
            topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topic/${topic.id}`}
                className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition"
              >
                <h3 className="text-lg font-medium text-gray-900">{topic.title}</h3>
                <p className="text-gray-600 mt-1">{topic.description}</p>
                <div className="mt-2 text-sm text-gray-500">
                  {topic.vote_count || 0} votes • {new Date(topic.created_at).toLocaleDateString()}
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  )
}