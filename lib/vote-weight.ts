export const VOTE_WEIGHT = {
  MIN: 25,
  MAX: 100,
  NEW_USER: 30,
  PREMIUM_MIN: 35,
  PREMIUM_NEW: 40,
  VOTE_BOOST: 4,
  PREMIUM_VOTE_BOOST: 6,
  GRACE_DAYS: 14,
  DECAY_PER_DAY: 3,
} as const

export function applyInactivityDecay(
  storedWeight: number,
  lastVoteAt: string | null,
  premium: boolean
): number {
  const floor = premium ? VOTE_WEIGHT.PREMIUM_MIN : VOTE_WEIGHT.MIN
  let weight = storedWeight || (premium ? VOTE_WEIGHT.PREMIUM_NEW : VOTE_WEIGHT.NEW_USER)

  if (!lastVoteAt) {
    return clamp(weight, floor, VOTE_WEIGHT.MAX)
  }

  const daysIdle =
    (Date.now() - new Date(lastVoteAt).getTime()) / (1000 * 60 * 60 * 24)

  if (daysIdle > VOTE_WEIGHT.GRACE_DAYS) {
    weight -= (daysIdle - VOTE_WEIGHT.GRACE_DAYS) * VOTE_WEIGHT.DECAY_PER_DAY
  }

  return clamp(weight, floor, VOTE_WEIGHT.MAX)
}

export function boostWeightAfterVote(
  currentWeight: number,
  premium: boolean
): number {
  const boost = premium ? VOTE_WEIGHT.PREMIUM_VOTE_BOOST : VOTE_WEIGHT.VOTE_BOOST
  return clamp(currentWeight + boost, premium ? VOTE_WEIGHT.PREMIUM_MIN : VOTE_WEIGHT.MIN, VOTE_WEIGHT.MAX)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function formatVoteWeight(weight: number) {
  return `${weight}%`
}
