import { getPlanProgress, isDayComplete, countStars } from './progress.js'
import { calculatePlanStreak } from './streak.js'

export const BADGE_DEFINITIONS = Object.freeze([
  { id: 'first-lesson', name: 'First Flight', description: 'Finish your first study session.' },
  { id: 'three-day-streak', name: 'On a Roll', description: 'Complete three study days in a row.' },
  { id: 'perfect-day', name: 'Full Focus', description: 'Finish every session in one day.' },
  { id: 'finished-plan', name: 'Plan Champion', description: 'Finish the whole study plan.' },
])

export function deriveBadges({ plan, progress = [], startDate, today = new Date() }) {
  const planProgress = getPlanProgress(plan, progress)
  const statusById = {
    'first-lesson': countStars(progress) >= 1,
    'three-day-streak': startDate
      ? calculatePlanStreak({ plan, progress, startDate, today }) >= 3
      : false,
    'perfect-day': (plan?.days || []).some((day) => isDayComplete(day, progress)),
    'finished-plan': planProgress.total > 0 && planProgress.completed === planProgress.total,
  }

  return BADGE_DEFINITIONS.map((badge) => ({ ...badge, unlocked: statusById[badge.id] }))
}
