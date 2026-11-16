function completedSessionIds(progress = []) {
  return new Set(progress.filter((item) => item.done).map((item) => item.sessionId))
}

export function getCompletedSessionCount(sessions = [], progress = []) {
  const completedIds = completedSessionIds(progress)
  return sessions.reduce((total, session) => total + (completedIds.has(session.id) ? 1 : 0), 0)
}

export function getDayProgress(day, progress = []) {
  const total = day?.sessions?.length || 0
  const completed = getCompletedSessionCount(day?.sessions, progress)
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  }
}

export function isDayComplete(day, progress = []) {
  const result = getDayProgress(day, progress)
  return result.total > 0 && result.completed === result.total
}

export function getPlanProgress(plan, progress = []) {
  const sessions = (plan?.days || []).flatMap((day) => day.sessions || [])
  const completed = getCompletedSessionCount(sessions, progress)
  const total = sessions.length
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  }
}

export function countStars(progress = []) {
  return new Set(progress.filter((item) => item.done).map((item) => item.sessionId)).size
}
