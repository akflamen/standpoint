// proxy.ts - New file for Next.js 16
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/session',
]

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicPath = PUBLIC_PATHS.some(p => path.startsWith(p))
  
  // Get session token from cookie
  const sessionToken = request.cookies.get('session_token')?.value

  // If no session token and trying to access protected route
  if (!sessionToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If session token exists, validate it
  if (sessionToken) {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('token', sessionToken)
      .single()

    // If session invalid or expired
    if (error || !session) {
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      response.cookies.delete('session_token')
      return response
    }

    // Check if session has expired
    const expiresAt = new Date(session.expires_at)
    if (expiresAt < new Date()) {
      // Session expired - clean up
      await supabase
        .from('sessions')
        .delete()
        .eq('token', sessionToken)
      
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      response.cookies.delete('session_token')
      return response
    }

    // If user is on public auth path but has valid session, redirect to profile
    if (isPublicPath && path.startsWith('/auth/') && path !== '/auth/login' && path !== '/auth/signup') {
      if (path === '/auth/forgot-password') {
        return NextResponse.redirect(new URL('/profile', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}