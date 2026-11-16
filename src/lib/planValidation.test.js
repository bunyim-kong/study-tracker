import { describe, expect, it } from 'vitest'
import { PLAN_LIMITS, validateDay, validatePlan, validatePlanDetails, validateSession } from './planValidation.js'

const validSession = {
  type: 'research',
  startTime: '20:00',
  endTime: '20:30',
  title: 'Read the guide',
  resources: [{ label: 'Guide', url: 'https://example.com/guide' }],
  practicePath: '',
  exercise: '',
}

describe('plan validation', () => {
  it('accepts valid plan, day and session values', () => {
    expect(validatePlanDetails({ title: 'React Basics', description: 'A short plan' })).toEqual([])
    expect(validateDay({ dayNumber: 1, topic: 'Components' })).toEqual([])
    expect(validateSession(validSession)).toEqual([])
  })

  it('requires HH:MM times with an end after the start', () => {
    expect(validateSession({ ...validSession, startTime: '8pm', endTime: '20:30' })).toContain('Start time must use HH:MM.')
    expect(validateSession({ ...validSession, startTime: '21:00', endTime: '20:30' })).toContain('End time must be after start time.')
  })

  it('rejects unsafe resource URLs and overlong text', () => {
    const errors = validateSession({
      ...validSession,
      title: 'x'.repeat(PLAN_LIMITS.title + 1),
      resources: [{ label: 'Bad', url: 'javascript:alert(1)' }],
    })
    expect(errors).toContain(`Session title must be ${PLAN_LIMITS.title} characters or fewer.`)
    expect(errors).toContain('Resource 1 URL must start with http:// or https://.')
  })

  it('requires unique day numbers inside a plan', () => {
    const errors = validatePlan({
      title: 'Repeated days',
      description: '',
      days: [
        { dayNumber: 1, topic: 'One', sessions: [] },
        { dayNumber: 1, topic: 'Again', sessions: [] },
      ],
    })
    expect(errors).toContain('Day number 1 is duplicated.')
  })
})
