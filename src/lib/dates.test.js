import { describe, expect, it } from 'vitest'
import {
  addDays,
  differenceInCalendarDays,
  getPlanDayNumber,
  parseLocalDateKey,
  toLocalDateKey,
} from './dates.js'

describe('date helpers', () => {
  it('uses the browser-local calendar date', () => {
    expect(toLocalDateKey(new Date(2026, 10, 16, 23, 59))).toBe('2026-11-16')
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('measures calendar days without daylight-saving-hour math', () => {
    expect(differenceInCalendarDays('2026-03-07', '2026-03-10')).toBe(3)
    expect(differenceInCalendarDays('2026-03-10', '2026-03-07')).toBe(-3)
  })

  it('maps a local date to a one-based plan day', () => {
    expect(getPlanDayNumber('2026-11-14', new Date(2026, 10, 16))).toBe(3)
  })

  it('rejects malformed and impossible dates', () => {
    expect(() => parseLocalDateKey('2026-02-30')).toThrow('Invalid local date')
    expect(() => parseLocalDateKey('11/16/2026')).toThrow('Invalid local date')
  })
})
