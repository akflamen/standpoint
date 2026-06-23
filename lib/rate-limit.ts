// lib/rate-limit.ts
import { supabase } from './supabase'

interface RateLimitOptions {
  interval: number
  uniqueTokenPerInterval: number
}

export function rateLimit(options: RateLimitOptions) {
  return {
    check: async (token: string, limit: number) => {
      const now = Date.now()
      const windowStart = now - options.interval

      // Get count for this token in the time window
      const { count, error } = await supabase
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('token', token)
        .gte('timestamp', windowStart)

      if (error) {
        console.error('Rate limit error:', error)
        // If table doesn't exist, allow the request
        return true
      }

      if (count && count >= limit) {
        throw new Error('Rate limit exceeded')
      }

      // Add new entry
      await supabase
        .from('rate_limits')
        .insert({
          token,
          timestamp: now,
        })

      return true
    }
  }
}