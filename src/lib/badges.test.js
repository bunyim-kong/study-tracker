import { describe, expect, it } from 'vitest'
import { deriveBadges } from './badges.js'

const plan = {
  days: [1, 2, 3].map((dayNumber) => ({
    dayNumber,
    sessions: [{ id: `${dayNumber}-a` }, { id: `${dayNumber}-b` }],
  })),
}

function completedProgress(sessionIds) {
  return sessionIds.map((sessionId) => ({ sessionId, done: true }))
}

describe('badge derivation', () => {
  it('starts with every badge locked', () => {
    expect(deriveBadges({ plan, progress: [] }).every((badge) => !badge.unlocked)).toBe(true)
  })

  it('unlocks session and full-day badges from progress', () => {
    const badges = deriveBadges({ plan, progress: completedProgress(['1-a', '1-b']) })
    expect(badges.find((badge) => badge.id === 'first-lesson').unlocked).toBe(true)
    expect(badges.find((badge) => badge.id === 'perfect-day').unlocked).toBe(true)
    expect(badges.find((badge) => badge.id === 'finished-plan').unlocked).toBe(false)
  })

  it('unlocks a three-day streak and completed plan', () => {
    const progress = completedProgress(['1-a', '1-b', '2-a', '2-b', '3-a', '3-b'])
    const badges = deriveBadges({
      plan,
      progress,
      startDate: '2026-11-14',
      today: new Date(2026, 10, 16),
    })
    expect(badges.find((badge) => badge.id === 'three-day-streak').unlocked).toBe(true)
    expect(badges.find((badge) => badge.id === 'finished-plan').unlocked).toBe(true)
  })
})
