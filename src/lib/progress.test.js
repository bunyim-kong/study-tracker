import { describe, expect, it } from 'vitest'
import {
  countStars,
  getCompletedSessionCount,
  getDayProgress,
  getPlanProgress,
  isDayComplete,
} from './progress.js'

const day = { id: 'day-1', sessions: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }] }

describe('progress helpers', () => {
  it('counts only completed sessions that belong to the day', () => {
    const progress = [
      { sessionId: 'a', done: true },
      { sessionId: 'b', done: false },
      { sessionId: 'outside', done: true },
    ]
    expect(getCompletedSessionCount(day.sessions, progress)).toBe(1)
    expect(getDayProgress(day, progress)).toEqual({ completed: 1, total: 4, percent: 25 })
  })

  it('requires at least one session before a day can be complete', () => {
    expect(isDayComplete({ sessions: [] }, [])).toBe(false)
    expect(isDayComplete(day, day.sessions.map(({ id }) => ({ sessionId: id, done: true })))).toBe(true)
  })

  it('calculates plan completion and handles an empty plan', () => {
    const plan = { days: [day, { id: 'day-2', sessions: [{ id: 'e' }] }] }
    expect(getPlanProgress(plan, [{ sessionId: 'a', done: true }])).toEqual({
      completed: 1,
      total: 5,
      percent: 20,
    })
    expect(getPlanProgress({ days: [] }, [])).toEqual({ completed: 0, total: 0, percent: 0 })
  })

  it('awards one star per unique completed session', () => {
    expect(
      countStars([
        { sessionId: 'a', done: true },
        { sessionId: 'a', done: true },
        { sessionId: 'b', done: false },
      ]),
    ).toBe(1)
  })
})
