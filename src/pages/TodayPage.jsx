import { Award, Flame, Play, Star, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, EmptyState, Mascot, ProgressBar } from '../components/index.js'
import PageHeader from '../components/PageHeader.jsx'
import SessionTile from '../components/SessionTile.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLearnerData } from '../context/LearnerDataContext.jsx'
import { formatStudyDate, getPlanDayNumber } from '../lib/dates.js'
import { countStars, getDayProgress } from '../lib/progress.js'
import { calculatePlanStreak } from '../lib/streak.js'
import './TodayPage.css'

export default function TodayPage() {
  const { user } = useAuth()
  const { assignment, plan, progress } = useLearnerData()
  const navigate = useNavigate()
  const dayNumber = getPlanDayNumber(assignment.startDate)

  if (dayNumber < 1) {
    return (
      <EmptyState mood="sleepy" title={`Your plan starts on ${formatStudyDate(assignment.startDate)}`}>
        <p>Rest up. Pip will be ready when Day 1 arrives.</p>
      </EmptyState>
    )
  }

  if (dayNumber > plan.days.length) {
    return (
      <EmptyState mood="cheering" title="You finished the plan!">
        <div className="finish-trophy"><Trophy aria-hidden="true" /><strong>Plan Champion</strong></div>
        <p>Seven days of showing up added up to something big. Your notes are ready whenever you want to review.</p>
        <Button variant="ghost" onClick={() => navigate('/app/review')}>Review my notes</Button>
      </EmptyState>
    )
  }

  const day = plan.days.find((item) => item.dayNumber === dayNumber)
  const dayProgress = getDayProgress(day, progress)
  const stars = countStars(progress)
  const streak = calculatePlanStreak({ plan, progress, startDate: assignment.startDate })
  const nextSession = day.sessions.find(
    (session) => !progress.some((item) => item.sessionId === session.id && item.done),
  ) || day.sessions[0]

  return (
    <>
      <PageHeader eyebrow={`Day ${dayNumber} of ${plan.days.length}`} title={`Good evening, ${user.name}`} description="A little focus tonight makes tomorrow’s React feel more familiar." />

      <Card className="today-hero">
        <div className="today-hero__copy">
          <span className="today-hero__eyebrow">Today we learn</span>
          <h2>{day.topic}</h2>
          <p>{dayProgress.completed === dayProgress.total ? 'Today is complete. Revisit any session whenever you like.' : `${dayProgress.total - dayProgress.completed} focused steps left today.`}</p>
          <Button size="large" icon={Play} onClick={() => navigate(`/app/session/${nextSession.id}`)}>
            {dayProgress.completed ? 'Review today' : 'Start next session'}
          </Button>
        </div>
        <Mascot mood={dayProgress.completed === dayProgress.total ? 'cheering' : 'happy'} size={210} />
      </Card>

      <section className="today-stats" aria-label="Study progress">
        <Card className="today-stats__progress">
          <ProgressBar value={dayProgress.completed} max={dayProgress.total} label="Today’s progress" size="large" />
        </Card>
        <Card className="today-stat"><Flame aria-hidden="true" /><span><strong>{streak}</strong> day streak</span></Card>
        <Card className="today-stat"><Star aria-hidden="true" /><span><strong>{stars}</strong> stars</span></Card>
      </section>

      <section aria-labelledby="today-sessions-title">
        <div className="section-heading">
          <div><span>Tonight’s path</span><h2 id="today-sessions-title">Four small sessions</h2></div>
          <Award aria-hidden="true" />
        </div>
        <div className="session-grid">
          {day.sessions.map((session) => (
            <SessionTile
              key={session.id}
              session={session}
              done={progress.some((item) => item.sessionId === session.id && item.done)}
            />
          ))}
        </div>
      </section>
    </>
  )
}
