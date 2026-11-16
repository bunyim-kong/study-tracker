import { describe, expect, it } from 'vitest'
import { buildAttentionList, DASHBOARD_STATUSES, getDashboardStatus } from './adminDashboard.js'

describe('admin dashboard logic', () => {
  it('chooses each learner status in priority order', () => {
    expect(getDashboardStatus({ assignment: null })).toBe(DASHBOARD_STATUSES.waiting)
    expect(getDashboardStatus({ assignment: {}, dayNumber: 0 })).toBe(DASHBOARD_STATUSES.notStarted)
    expect(getDashboardStatus({ assignment: {}, dayNumber: 3, todayDone: 4, todayTotal: 4, missedYesterday: true })).toBe(DASHBOARD_STATUSES.done)
    expect(getDashboardStatus({ assignment: {}, dayNumber: 3, todayDone: 1, todayTotal: 4, missedYesterday: true })).toBe(DASHBOARD_STATUSES.missed)
    expect(getDashboardStatus({ assignment: {}, dayNumber: 3, todayDone: 1, todayTotal: 4, missedYesterday: false })).toBe(DASHBOARD_STATUSES.onTrack)
  })

  it('builds attention items for missing plans, missed days, and unanswered questions', () => {
    const items = buildAttentionList([
      { id: 'a', name: 'Ari', active: true, assignment: null, missedYesterday: false, unansweredQuestions: [] },
      { id: 'b', name: 'Bea', active: true, assignment: {}, missedYesterday: true, unansweredQuestions: [{ dayId: 'd1', question: 'Why?' }] },
      { id: 'c', name: 'Cal', active: false, assignment: null, missedYesterday: true, unansweredQuestions: [] },
    ])
    expect(items.map((item) => item.type)).toEqual(['no-plan', 'missed', 'question'])
  })
})
