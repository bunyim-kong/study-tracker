import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Card, EmptyState, ErrorState, LoadingState, Mascot } from '../components/index.js'
import PageHeader from '../components/PageHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLearnerData } from '../context/LearnerDataContext.jsx'
import { createDebouncedTask } from '../lib/debounce.js'
import { getPlanDayNumber } from '../lib/dates.js'
import { canOpenStudyDay } from '../lib/planDays.js'
import './NotePage.css'

const FIELDS = [
  ['learned', 'What I learned', 'The main idea that clicked…'],
  ['built', 'What I built', 'The thing I made or changed…'],
  ['confused', 'What confused me', 'A part I want to revisit…'],
  ['remember', 'One thing I will not forget', 'A useful rule, pattern, or surprise…'],
  ['question', 'A question for tomorrow', 'Something I want to ask or explore…'],
]

const EMPTY_FIELDS = Object.fromEntries(FIELDS.map(([key]) => [key, '']))

export default function NotePage() {
  const { dayNumber: dayParam } = useParams()
  const { adapter } = useAuth()
  const { assignment, plan } = useLearnerData()
  const dayNumber = Number(dayParam)
  const day = plan.days.find((item) => item.dayNumber === dayNumber)
  const currentDayNumber = getPlanDayNumber(assignment.startDate)
  const [fields, setFields] = useState(EMPTY_FIELDS)
  const [mentorComment, setMentorComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saveStatus, setSaveStatus] = useState('')

  const autosave = useMemo(
    () => createDebouncedTask(async (nextFields) => {
      try {
        await adapter.saveNote({ dayId: day.id, ...nextFields })
        setSaveStatus('Saved')
      } catch (error) {
        setSaveStatus(error.message || 'Could not save')
      }
    }, 800),
    [adapter, day?.id],
  )

  useEffect(() => () => autosave.flush(), [autosave])

  useEffect(() => {
    if (!day) return
    let cancelled = false
    setLoading(true)
    setLoadError('')
    adapter.getNote(day.id)
      .then((note) => {
        if (cancelled) return
        setFields(note ? Object.fromEntries(FIELDS.map(([key]) => [key, note[key] || ''])) : EMPTY_FIELDS)
        setMentorComment(note?.mentorComment || '')
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message || 'Your note could not be loaded.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [adapter, day])

  if (!day) return <Navigate to="/app/week" replace />
  if (!canOpenStudyDay(dayNumber, currentDayNumber)) {
    return <EmptyState mood="thinking" title="This note unlocks with its study day"><p>You can preview the topic in Week, then write here when the day arrives.</p></EmptyState>
  }
  if (loading) return <LoadingState message="Opening your note…" />
  if (loadError) return <ErrorState message={loadError} />

  function updateField(key, value) {
    const nextFields = { ...fields, [key]: value }
    setFields(nextFields)
    setSaveStatus('Saving…')
    autosave.schedule(nextFields)
  }

  return (
    <div className="note-page">
      <PageHeader backTo={dayNumber === currentDayNumber ? '/app/today' : `/app/day/${dayNumber}`} eyebrow={`Day ${dayNumber} note`} title={day.topic} description="A few honest sentences are more useful than perfect notes." />
      <Card className="note-prompt">
        <Mascot mood="thinking" size={150} label="Pip asks about tonight’s lesson" />
        <div><h2>What did you learn tonight?</h2><p>Write for future-you. Your mentor can read this and leave a comment.</p></div>
      </Card>

      <form className="note-fields" onSubmit={(event) => event.preventDefault()}>
        {FIELDS.map(([key, label, placeholder]) => (
          <div className="field" key={key}>
            <label htmlFor={`note-${key}`}>{label}</label>
            <textarea id={`note-${key}`} value={fields[key]} placeholder={placeholder} onChange={(event) => updateField(key, event.target.value)} />
          </div>
        ))}
      </form>
      <p className={`note-save-status ${saveStatus === 'Saved' ? 'note-save-status--saved' : ''}`} aria-live="polite">{saveStatus || 'Changes save automatically'}</p>

      {mentorComment ? (
        <aside className="mentor-comment" aria-label="Mentor comment">
          <span>Your mentor says</span>
          <p>{mentorComment}</p>
        </aside>
      ) : null}
    </div>
  )
}
