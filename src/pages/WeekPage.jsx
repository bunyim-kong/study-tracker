import { Check, ChevronRight, Circle, Clock3, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { useLearnerData } from '../context/LearnerDataContext.jsx'
import { addDays, formatStudyDate, getPlanDayNumber } from '../lib/dates.js'
import { getStudyDayStatus } from '../lib/planDays.js'
import { getDayProgress, isDayComplete } from '../lib/progress.js'
import './WeekPage.css'

const STATUS_META = {
  done: { label: 'Done', icon: Check },
  today: { label: 'Today', icon: Sparkles },
  missed: { label: 'Missed', icon: Circle },
  upcoming: { label: 'Upcoming', icon: Clock3 },
}

export default function WeekPage() {
  const { assignment, plan, progress } = useLearnerData()
  const currentDayNumber = getPlanDayNumber(assignment.startDate)

  return (
    <>
      <PageHeader eyebrow={plan.title} title="Your seven-day path" description="Past days stay open. Upcoming days show the topic, then unlock one local calendar day at a time." />
      <div className="week-grid">
        {plan.days.map((day) => {
          const complete = isDayComplete(day, progress)
          const status = getStudyDayStatus({ dayNumber: day.dayNumber, currentDayNumber, complete })
          const meta = STATUS_META[status]
          const Icon = meta.icon
          const summary = getDayProgress(day, progress)
          const date = addDays(assignment.startDate, day.dayNumber - 1)
          const content = (
            <>
              <div className="week-card__top">
                <span>Day {day.dayNumber}</span>
                <span className={`week-card__status week-card__status--${status}`}><Icon aria-hidden="true" /> {meta.label}</span>
              </div>
              <h2>{day.topic}</h2>
              <p>{formatStudyDate(date)}{status === 'upcoming' ? '' : ` · ${summary.completed}/${summary.total} sessions`}</p>
              {status !== 'upcoming' ? <ChevronRight className="week-card__arrow" aria-hidden="true" /> : null}
            </>
          )

          if (status === 'upcoming') {
            return <article className="week-card week-card--upcoming" key={day.id}>{content}</article>
          }

          const path = status === 'today' ? '/app/today' : `/app/day/${day.dayNumber}`
          return <Link className={`week-card week-card--${status}`} to={path} key={day.id}>{content}</Link>
        })}
      </div>
    </>
  )
}
