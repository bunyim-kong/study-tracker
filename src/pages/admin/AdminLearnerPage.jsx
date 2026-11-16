import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Clock3, MessageSquareText, PauseCircle, PlayCircle, UserPlus } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { addDays, formatStudyDate } from '../../lib/dates.js'
import { getStudyDayStatus } from '../../lib/planDays.js'
import { isDayComplete } from '../../lib/progress.js'
import './AdminLearnerPage.css'

function MentorNoteCard({ note, day, onSave }) {
  const [comment, setComment] = useState(note.mentorComment || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      await onSave(note.dayId, comment)
      setMessage('Comment saved')
    } catch (error) {
      setMessage(error.message || 'Comment could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card as="article" className="admin-note-card">
      <div className="admin-note-card__heading"><div><span>Day {day?.dayNumber || '—'}</span><h3>{day?.topic || 'Study note'}</h3></div><time dateTime={note.updatedAt}>{new Date(note.updatedAt).toLocaleDateString()}</time></div>
      <dl className="admin-note-fields">
        <div><dt>Learned</dt><dd>{note.learned || '—'}</dd></div>
        <div><dt>Built</dt><dd>{note.built || '—'}</dd></div>
        <div><dt>Confused</dt><dd>{note.confused || '—'}</dd></div>
        <div><dt>Remember</dt><dd>{note.remember || '—'}</dd></div>
        <div><dt>Question</dt><dd>{note.question || '—'}</dd></div>
      </dl>
      <div className="field"><label htmlFor={`mentor-${note.dayId}`}>Mentor comment</label><textarea id={`mentor-${note.dayId}`} value={comment} onChange={(event) => setComment(event.target.value)} maxLength="4000" /></div>
      <div className="admin-note-card__actions"><span aria-live="polite">{message}</span><Button size="small" icon={MessageSquareText} loading={saving} onClick={save}>Save comment</Button></div>
    </Card>
  )
}

export default function AdminLearnerPage() {
  const { id } = useParams()
  const { adapter } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [changingActive, setChangingActive] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [overview, assignment, progress, notes] = await Promise.all([
        adapter.getLearnerOverview(id),
        adapter.getAssignmentForLearner(id),
        adapter.getProgress(id),
        adapter.listNotesForLearner(id),
      ])
      setData({ overview, assignment, plan: assignment?.plan || null, progress, notes })
    } catch (loadError) {
      setError(loadError.message || 'Learner details could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [adapter, id])

  useEffect(() => { load() }, [load])

  const progressBySession = useMemo(
    () => new Map((data?.progress || []).map((record) => [record.sessionId, record])),
    [data?.progress],
  )

  if (loading) return <AdminLoading message="Loading learner details…" />
  if (error) return <AdminError message={error} onRetry={load} />
  if (!data) return <Navigate to="/admin" replace />

  const { overview, plan, notes } = data
  const todayDay = plan?.days.find((day) => day.dayNumber === overview.dayNumber)

  async function toggleActive() {
    setChangingActive(true)
    try {
      await adapter.setLearnerActive(id, !overview.active)
      setConfirmOpen(false)
      await load()
    } catch (actionError) {
      setError(actionError.message || 'Account status could not be changed.')
    } finally {
      setChangingActive(false)
    }
  }

  async function saveComment(dayId, mentorComment) {
    await adapter.setMentorComment({ learnerId: id, dayId, mentorComment })
    setData((current) => ({ ...current, notes: current.notes.map((note) => note.dayId === dayId ? { ...note, mentorComment } : note) }))
  }

  return (
    <>
      <PageHeader backTo="/admin" eyebrow={overview.email} title={overview.name} description={overview.planTitle || 'No plan assigned'} actions={<div className="admin-page-actions"><AdminStatusBadge overview={overview} /><Link className="button button--primary" to={`/admin/assign?learner=${id}`}><UserPlus aria-hidden="true" /> Assign plan</Link><Button variant="ghost" icon={overview.active ? PauseCircle : PlayCircle} onClick={() => setConfirmOpen(true)}>{overview.active ? 'Deactivate' : 'Reactivate'}</Button></div>} />

      {!plan ? <AdminEmpty title="Waiting for a plan"><p>Assign a template to create this learner’s independent copy.</p><Link className="button button--primary" to={`/admin/assign?learner=${id}`}>Assign plan</Link></AdminEmpty> : (
        <>
          <section className="admin-section" aria-labelledby="week-strip-title">
            <div className="admin-section__heading"><div><h2 id="week-strip-title">Week</h2><p>Day status based on the learner’s local-date schedule.</p></div></div>
            <div className="admin-week-strip">
              {plan.days.map((day) => {
                const status = getStudyDayStatus({ dayNumber: day.dayNumber, currentDayNumber: overview.dayNumber, complete: isDayComplete(day, data.progress) })
                return <div className={`admin-week-day admin-week-day--${status}`} key={day.id}><span>Day {day.dayNumber}</span><strong>{status}</strong><small>{formatStudyDate(addDays(data.assignment.startDate, day.dayNumber - 1), undefined, { weekday: undefined })}</small></div>
              })}
            </div>
          </section>

          <section className="admin-section" aria-labelledby="today-session-title">
            <div className="admin-section__heading"><div><h2 id="today-session-title">Today’s sessions</h2><p>{todayDay ? todayDay.topic : 'No session falls on today’s plan day.'}</p></div></div>
            {!todayDay ? <Card className="admin-inline-empty">No scheduled sessions today.</Card> : <div className="admin-session-table">{todayDay.sessions.map((session) => { const record = progressBySession.get(session.id); return <div key={session.id}><span className={record?.done ? 'admin-session-check admin-session-check--done' : 'admin-session-check'}>{record?.done ? <Check aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</span><span><strong>{session.title}</strong><small>{session.type} · {session.startTime}–{session.endTime}</small></span><time>{record?.doneAt ? new Date(record.doneAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not done'}</time></div> })}</div>}
          </section>
        </>
      )}

      <section className="admin-section" aria-labelledby="notes-title">
        <div className="admin-section__heading"><div><h2 id="notes-title">Notes</h2><p>Newest first. Learner answers are read-only.</p></div><span className="admin-count">{notes.length}</span></div>
        {notes.length === 0 ? <AdminEmpty title="No notes yet"><p>Completed learner notes will appear here.</p></AdminEmpty> : <div className="admin-notes-list">{notes.map((note) => <MentorNoteCard key={note.dayId} note={note} day={plan?.days.find((day) => day.id === note.dayId)} onSave={saveComment} />)}</div>}
      </section>

      <ConfirmDialog open={confirmOpen} title={`${overview.active ? 'Deactivate' : 'Reactivate'} ${overview.name}?`} confirmLabel={overview.active ? 'Deactivate learner' : 'Reactivate learner'} busy={changingActive} onCancel={() => setConfirmOpen(false)} onConfirm={toggleActive}><p>{overview.active ? 'The learner will be signed out and unable to see study data until reactivated.' : 'The learner will be able to sign in and continue their plan.'}</p></ConfirmDialog>
    </>
  )
}
