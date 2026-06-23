// app/topic/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getClientSession } from '@/lib/auth' // Use this for client-side

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

export default function TopicPage() {
  const params = useParams()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSession() {
      const sessionData = await getClientSession()
      setSession(sessionData)
      setLoading(false)
    }
    loadSession()
  }, [])

  // Rest of your component logic...
}