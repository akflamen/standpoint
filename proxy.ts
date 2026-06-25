import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'

const PUBLIC_PAGE_PREFIXES = [
  '/', 
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/topic',
]

const PROTECTED_PAGE_PREFIXES = ['/profile', '/premium']

function isPublicPage(path: string) {
  return PUBLIC_PAGE_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))
}

function isProtectedPage(path: string) {
  return PROTECTED_PAGE_PREFIXES.some((prefix) => path.startsWith(prefix))
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Always allow static, API, admin, or asset requests
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/admin') ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  // Handle logout - redirect to homepage
  if (path === '/auth/logout') {
    const response = NextResponse.redirect(new URL('/', request.url))
    // Clear session cookie
    response.cookies.delete('session')
    return response
  }

  // Public pages never redirect
  if (isPublicPage(path)) {
    return NextResponse.next()
  }

  // Protected pages require session
  if (isProtectedPage(path)) {
    const session = await getSessionFromRequest(request)
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', path)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}