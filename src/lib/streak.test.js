import { describe, expect, it } from 'vitest'
import { calculatePlanStreak, calculateStreak, getCompletedPlanDates } from './streak.js'

const today = new Date(2026, 10, 16, 9)

describe('streak helpers', () => {
  it('counts consecutive completed days ending today', () => {
    expect(calculateStreak(['2026-11-14', '2026-11-15', '2026-11-16'], today)).toBe(3)
  })

  it('keeps a streak alive when the last completed day was yesterday', () => {
    expect(calculateStreak(['2026-11-13', '2026-11-14', '2026-11-15'], today)).toBe(3)
  })

  it('returns zero when neither today nor yesterday is complete', () => {
    expect(calculateStreak(['2026-11-12', '2026-11-13'], today)).toBe(0)
  })

  it('derives completed calendar dates from a plan start date', () => {
    const plan = {
      days: [
        { dayNumber: 1, sessions: [{ id: 'a' }] },
        { dayNumber: 2, sessions: [{ id: 'b' }] },
      ],
    }
    const progress = [
      { sessionId: 'a', done: true },
      { sessionId: 'b', done: true },
    ]
    expect(getCompletedPlanDates(plan, progress, '2026-11-15')).toEqual(['2026-11-15', '2026-11-16'])
    expect(calculatePlanStreak({ plan, progress, startDate: '2026-11-15', today })).toBe(2)
  })
})
