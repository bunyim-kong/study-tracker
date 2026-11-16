import { addDays, toLocalDateKey } from './dates.js'
import { isDayComplete } from './progress.js'

export function calculateStreak(completedDateKeys = [], today = new Date()) {
  const completed = new Set(completedDateKeys)
  const todayKey = toLocalDateKey(today)
  const yesterdayKey = addDays(todayKey, -1)
  let cursor = completed.has(todayKey) ? todayKey : completed.has(yesterdayKey) ? yesterdayKey : null
  let streak = 0

  while (cursor && completed.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

export function getCompletedPlanDates(plan, progress = [], startDate) {
  if (!startDate) return []

  return (plan?.days || [])
    .filter((day) => isDayComplete(day, progress))
    .map((day) => addDays(startDate, day.dayNumber - 1))
}

export function calculatePlanStreak({ plan, progress = [], startDate, today = new Date() }) {
  return calculateStreak(getCompletedPlanDates(plan, progress, startDate), today)
}
