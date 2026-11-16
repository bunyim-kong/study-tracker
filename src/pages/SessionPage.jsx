import { useState } from 'react'
import { Check, Clipboard, ExternalLink, RotateCcw, Star } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Button, Card, Confetti, EmptyState, Mascot } from '../components/index.js'
import PageHeader from '../components/PageHeader.jsx'
import { getSessionLabel } from '../components/SessionTile.jsx'
import { useLearnerData } from '../context/LearnerDataContext.jsx'
import { getPlanDayNumber } from '../lib/dates.js'
import { canOpenStudyDay } from '../lib/planDays.js'
import './SessionPage.css'

const SELF_CHECKS = [
  'I explained the main idea without opening my notes.',
  'I gave one example in my own words.',
  'I named one thing I still want to review.',
]

function ResearchContent({ session }) {
  return (
    <Card className="session-detail__content">
      <h2>Read with one question in mind</h2>
      <p>What is the smallest idea here that you could explain to someone else?</p>
      <div className="resource-list">
        {session.resources.map((resource) => (
          <a href={resource.url} target="_blank" rel="noopener noreferrer" key={resource.url}>
            <span>{resource.label}</span><ExternalLink aria-hidden="true" />
          </a>
        ))}
      </div>
    </Card>
  )
}

function PracticeContent({ session }) {
  const [copyStatus, setCopyStatus] = useState('Copy')

  async function copyPath() {
    try {
      await navigator.clipboard.writeText(session.practicePath)
      setCopyStatus('Copied!')
    } catch {
      setCopyStatus('Copy failed')
    }
  }

  return (
    <div className="session-detail__stack">
      <Card>
        <h2>Open these files</h2>
        <div className="code-path"><code>{session.practicePath}</code><Button variant="ghost" size="small" icon={Clipboard} onClick={copyPath}>{copyStatus}</Button></div>
      </Card>
      <Card variant="raised"><h2>Your exercise</h2><p>{session.exercise}</p></Card>
    </div>
  )
}

function QuizContent({ session }) {
  const [checks, setChecks] = useState(() => SELF_CHECKS.map(() => false))
  return (
    <Card className="session-detail__content">
      <h2>Close the notes first</h2>
      <p>{session.exercise}</p>
      <fieldset className="self-checks">
        <legend>Three self-checks</legend>
        {SELF_CHECKS.map((label, index) => (
          <label key={label}>
            <input type="checkbox" checked={checks[index]} onChange={(event) => setChecks((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.checked : value))} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
    </Card>
  )
}

function NoteContent({ day }) {
  return (
    <Card className="session-detail__content">
      <h2>Turn tonight into a memory</h2>
      <p>Five short prompts help future-you remember what clicked and what still needs attention.</p>
      <Link className="button button--primary button--large" to={`/app/note/${day.dayNumber}`}>Open today’s note</Link>
    </Card>
  )
}

export default function SessionPage() {
  const { sessionId } = useParams()
  const { assignment, plan, progress, setSessionDone } = useLearnerData()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [celebrating, setCelebrating] = useState(false)
  const match = plan.days.map((day) => ({ day, session: day.sessions.find((item) => item.id === sessionId) })).find((item) => item.session)

  if (!match) return <Navigate to="/app/today" replace />

  const { day, session } = match
  const currentDayNumber = getPlanDayNumber(assignment.startDate)
  if (!canOpenStudyDay(day.dayNumber, currentDayNumber)) {
    return (
      <>
        <PageHeader backTo="/app/week" eyebrow={`Day ${day.dayNumber}`} title={day.topic} />
        <EmptyState mood="thinking" title="This session unlocks later"><p>Upcoming days are preview-only. Come back when this study day arrives.</p></EmptyState>
      </>
    )
  }

  const done = progress.some((item) => item.sessionId === session.id && item.done)

  async function toggleDone() {
    setSaving(true)
    setError('')
    try {
      await setSessionDone(session.id, !done)
      setCelebrating(!done)
      if (!done) window.setTimeout(() => setCelebrating(false), 1200)
    } catch (saveError) {
      setError(saveError.message || 'Progress could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="session-detail">
      <PageHeader backTo={day.dayNumber === currentDayNumber ? '/app/today' : `/app/day/${day.dayNumber}`} eyebrow={`Day ${day.dayNumber} · ${getSessionLabel(session.type)}`} title={session.title} description={`${session.startTime}–${session.endTime} · ${day.topic}`} />

      {celebrating ? (
        <Card variant="raised" className="session-celebration" role="status">
          <Confetti />
          <Mascot mood="cheering" size={145} label="Pip cheers your completed session" />
          <div><h2>Star earned!</h2><p>You finished one more focused step.</p></div>
        </Card>
      ) : null}

      {session.type === 'research' ? <ResearchContent session={session} /> : null}
      {session.type === 'practice' ? <PracticeContent session={session} /> : null}
      {session.type === 'quiz' ? <QuizContent session={session} /> : null}
      {session.type === 'note' ? <NoteContent day={day} /> : null}

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="session-detail__action">
        <Button size="large" variant={done ? 'ghost' : 'primary'} icon={done ? RotateCcw : Star} loading={saving} onClick={toggleDone}>
          {done ? 'Undo completion' : 'Mark as done'}
        </Button>
        {done ? <span><Check aria-hidden="true" /> Completed</span> : <span>Finish when you feel ready.</span>}
      </div>
    </div>
  )
}
