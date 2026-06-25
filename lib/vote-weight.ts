// lib/vote-weight.ts

export const VOTE_WEIGHT = {
  MIN: 0,                    // Start at 0
  MAX: 100,
  INCREMENT_PER_VOTE: 2,     // Each vote adds 2% weight
  DECAY_PER_DAY: 1,          // Lose 1% per day after grace period
  GRACE_DAYS: 7,            // 7 days grace before decay starts
  PREMIUM_BOOST: 1.5,       // Premium users get 1.5x increment
} as const

export function calculateUserWeight(
  voteCount: number,
  lastVoteAt: string | null,
  isPremium: boolean
): number {
  // Calculate base weight from vote count
  const increment = isPremium ? VOTE_WEIGHT.PREMIUM_BOOST : VOTE_WEIGHT.INCREMENT_PER_VOTE
  let weight = Math.min(voteCount * increment, VOTE_WEIGHT.MAX)

  // Apply inactivity decay
  if (lastVoteAt) {
    const daysIdle = (Date.now() - new Date(lastVoteAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysIdle > VOTE_WEIGHT.GRACE_DAYS) {
      weight -= (daysIdle - VOTE_WEIGHT.GRACE_DAYS) * VOTE_WEIGHT.DECAY_PER_DAY
    }
  }

  return clamp(weight, VOTE_WEIGHT.MIN, VOTE_WEIGHT.MAX)
}

// User always sees their own vote as 100% (1)
export function getUserDisplayWeight(actualWeight: number): number {
  if (actualWeight === 0) return 0
  return 100 // Always show 100% for own votes
}

// Other users see the actual calculated weight
export function getActualWeightForOthers(actualWeight: number): number {
  return Math.round(actualWeight)
}

// Calculate combined vote from multiple users
export function calculateCombinedVote(weights: number[]): {
  fullVotes: number
  remainder: number
  totalWeight: number
} {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const fullVotes = Math.floor(totalWeight / 100) // Each 100% = 1 full vote
  const remainder = totalWeight - (fullVotes * 100)
  
  return { 
    fullVotes, 
    remainder, 
    totalWeight: Math.round(totalWeight * 100) / 100 
  }
}

// Increment vote count after voting
export function incrementWeightAfterVote(
  currentVoteCount: number,
  isPremium: boolean
): number {
  return currentVoteCount + 1 // Each vote adds 1 to count
}

// Get display weight for a user (for other users)
export function formatVoteWeight(weight: number, isOwnView: boolean = false): string {
  if (isOwnView && weight > 0) {
    return "100%" // Own votes always show as 100%
  }
  return `${Math.round(weight)}%`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}