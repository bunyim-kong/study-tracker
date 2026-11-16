import { describe, expect, it } from 'vitest'
import { canOpenStudyDay, getStudyDayStatus, isUpcomingDay } from './planDays.js'

describe('study day lock rules', () => {
  it('locks every day after the current plan day', () => {
    expect(isUpcomingDay(4, 3)).toBe(true)
    expect(canOpenStudyDay(4, 3)).toBe(false)
  })

  it('allows today and previous days to be opened', () => {
    expect(canOpenStudyDay(3, 3)).toBe(true)
    expect(canOpenStudyDay(1, 3)).toBe(true)
  })

  it('labels complete, current, missed and upcoming days', () => {
    expect(getStudyDayStatus({ dayNumber: 1, currentDayNumber: 3, complete: true })).toBe('done')
    expect(getStudyDayStatus({ dayNumber: 2, currentDayNumber: 3, complete: false })).toBe('missed')
    expect(getStudyDayStatus({ dayNumber: 3, currentDayNumber: 3, complete: false })).toBe('today')
    expect(getStudyDayStatus({ dayNumber: 4, currentDayNumber: 3, complete: false })).toBe('upcoming')
  })
})
