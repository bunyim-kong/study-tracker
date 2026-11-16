export const PLAN_LIMITS = Object.freeze({
  title: 120,
  description: 2000,
  topic: 160,
  resourceLabel: 100,
  url: 1000,
  practicePath: 500,
  exercise: 4000,
})

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const HTTP_URL_PATTERN = /^https?:\/\//i
const SESSION_TYPES = new Set(['research', 'practice', 'quiz', 'note'])

export class PlanValidationError extends Error {
  constructor(errors) {
    super(errors.join(' '))
    this.name = 'PlanValidationError'
    this.errors = errors
  }
}

function requiredText(value, label, maxLength, errors) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) errors.push(`${label} is required.`)
  else if (text.length > maxLength) errors.push(`${label} must be ${maxLength} characters or fewer.`)
}

function optionalText(value, label, maxLength, errors) {
  if (typeof value === 'string' && value.length > maxLength) {
    errors.push(`${label} must be ${maxLength} characters or fewer.`)
  }
}

export function validatePlanDetails(plan) {
  const errors = []
  requiredText(plan?.title, 'Plan title', PLAN_LIMITS.title, errors)
  optionalText(plan?.description, 'Plan description', PLAN_LIMITS.description, errors)
  return errors
}

export function validateDay(day) {
  const errors = []
  if (!Number.isInteger(Number(day?.dayNumber)) || Number(day.dayNumber) < 1 || Number(day.dayNumber) > 365) {
    errors.push('Day number must be a whole number from 1 to 365.')
  }
  requiredText(day?.topic, 'Day topic', PLAN_LIMITS.topic, errors)
  return errors
}

export function validateSession(session) {
  const errors = []
  if (!SESSION_TYPES.has(session?.type)) errors.push('Session type is invalid.')
  requiredText(session?.title, 'Session title', PLAN_LIMITS.title, errors)

  if (!TIME_PATTERN.test(session?.startTime || '')) errors.push('Start time must use HH:MM.')
  if (!TIME_PATTERN.test(session?.endTime || '')) errors.push('End time must use HH:MM.')
  if (TIME_PATTERN.test(session?.startTime || '') && TIME_PATTERN.test(session?.endTime || '') && session.endTime <= session.startTime) {
    errors.push('End time must be after start time.')
  }

  optionalText(session?.practicePath, 'Practice path', PLAN_LIMITS.practicePath, errors)
  optionalText(session?.exercise, 'Exercise', PLAN_LIMITS.exercise, errors)
  const resources = Array.isArray(session?.resources) ? session.resources : []
  resources.forEach((resource, index) => {
    requiredText(resource?.label, `Resource ${index + 1} label`, PLAN_LIMITS.resourceLabel, errors)
    if (!HTTP_URL_PATTERN.test(resource?.url || '')) {
      errors.push(`Resource ${index + 1} URL must start with http:// or https://.`)
    } else {
      optionalText(resource.url, `Resource ${index + 1} URL`, PLAN_LIMITS.url, errors)
    }
  })
  return errors
}

export function validatePlan(plan) {
  const errors = validatePlanDetails(plan)
  const days = Array.isArray(plan?.days) ? plan.days : []
  const dayNumbers = new Set()

  days.forEach((day) => {
    errors.push(...validateDay(day))
    if (dayNumbers.has(Number(day.dayNumber))) errors.push(`Day number ${day.dayNumber} is duplicated.`)
    dayNumbers.add(Number(day.dayNumber))
    ;(day.sessions || []).forEach((session) => errors.push(...validateSession(session)))
  })
  return errors
}

export function assertValid(errors) {
  if (errors.length > 0) throw new PlanValidationError(errors)
}
