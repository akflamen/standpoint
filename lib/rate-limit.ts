import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'

interface RateLimitOptions {
  intervalMs: number
  action: string
}

export function getRequestIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous'
  )
}

export function rateLimit(options: RateLimitOptions) {
  return {
    check: async (identifier: string, limit: number) => {
      const now = new Date().toISOString()
      const windowStart = new Date(Date.now() - options.intervalMs).toISOString()
      const token = `${options.action}:${identifier}`

      const { count, error } = await supabaseAdmin
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('token', token)
        .gte('timestamp', windowStart)

      if (error) {
        console.error('Rate limit error:', error)
        throw error
      }

      if (count && count >= limit) {
        throw new Error('Rate limit exceeded')
      }

      await supabaseAdmin.from('rate_limits').insert({
        token,
        timestamp: now,
      })

      return true
    },
  }
}

export async function enforceRateLimit(
  req: NextRequest,
  action: string,
  identifier: string,
  limit: number,
  intervalMs: number
) {
  const limiter = rateLimit({ action, intervalMs })
  await limiter.check(identifier, limit)
}
