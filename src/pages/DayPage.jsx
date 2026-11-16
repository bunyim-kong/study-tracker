import { Navigate, useParams } from 'react-router-dom'
import { Card, EmptyState, ProgressBar } from '../components/index.js'
import PageHeader from '../components/PageHeader.jsx'
import SessionTile from '../components/SessionTile.jsx'
import { useLearnerData } from '../context/LearnerDataContext.jsx'
import { addDays, formatStudyDate, getPlanDayNumber } from '../lib/dates.js'
import { canOpenStudyDay } from '../lib/planDays.js'
import { getDayProgress } from '../lib/progress.js'

export default function DayPage() {
  const { dayNumber: dayParam } = useParams()
  const { assignment, plan, progress } = useLearnerData()
  const dayNumber = Number(dayParam)
  const day = plan.days.find((item) => item.dayNumber === dayNumber)
  const currentDayNumber = getPlanDayNumber(assignment.startDate)

  if (!day) return <Navigate to="/app/week" replace />

  if (!canOpenStudyDay(dayNumber, currentDayNumber)) {
    return (
      <>
        <PageHeader backTo="/app/week" eyebrow={`Day ${dayNumber}`} title={day.topic} />
        <EmptyState mood="thinking" title="This day is still ahead">
          <p>It unlocks on {formatStudyDate(addDays(assignment.startDate, dayNumber - 1))}. For now, the topic is yours to preview.</p>
        </EmptyState>
      </>
    )
  }

  const summary = getDayProgress(day, progress)
  return (
    <>
      <PageHeader backTo="/app/week" eyebrow={`Day ${dayNumber} · ${formatStudyDate(addDays(assignment.startDate, dayNumber - 1))}`} title={day.topic} description="Past study days stay open so you can finish or revisit any session." />
      <Card style={{ marginBottom: 'var(--space-5)' }}>
        <ProgressBar value={summary.completed} max={summary.total} label={`Day ${dayNumber} progress`} />
      </Card>
      <div className="session-grid">
        {day.sessions.map((session) => <SessionTile key={session.id} session={session} done={progress.some((item) => item.sessionId === session.id && item.done)} />)}
      </div>
    </>
  )
}
