export const DASHBOARD_STATUSES = Object.freeze({
  waiting: 'Waiting for plan',
  notStarted: 'Not started',
  missed: 'Missed yesterday',
  done: 'Done tonight',
  onTrack: 'On track',
})

export function getDashboardStatus(overview) {
  if (!overview.assignment) return DASHBOARD_STATUSES.waiting
  if (overview.dayNumber < 1) return DASHBOARD_STATUSES.notStarted
  if (overview.todayTotal > 0 && overview.todayDone === overview.todayTotal) return DASHBOARD_STATUSES.done
  if (overview.missedYesterday) return DASHBOARD_STATUSES.missed
  return DASHBOARD_STATUSES.onTrack
}

export function buildAttentionList(overviews) {
  const items = []
  for (const overview of overviews) {
    if (!overview.active) continue
    if (!overview.assignment) {
      items.push({ id: `${overview.id}-plan`, learnerId: overview.id, type: 'no-plan', message: `${overview.name} is waiting for a plan.` })
    }
    if (overview.missedYesterday) {
      items.push({ id: `${overview.id}-missed`, learnerId: overview.id, type: 'missed', message: `${overview.name} missed yesterday’s sessions.` })
    }
    for (const note of overview.unansweredQuestions || []) {
      items.push({ id: `${overview.id}-${note.dayId}`, learnerId: overview.id, type: 'question', message: `${overview.name} asked: ${note.question}` })
    }
  }
  return items
}
