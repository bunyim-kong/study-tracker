import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import Button from '../Button.jsx'
import Card from '../Card.jsx'
import ConfirmDialog from '../ConfirmDialog.jsx'
import { validateDay } from '../../lib/planValidation.js'
import SessionEditorForm from './SessionEditorForm.jsx'
import './PlanDayEditor.css'

export default function PlanDayEditor({ day, onSaveDay, onDeleteDay, onSaveSession, onDeleteSession, onReorder }) {
  const [dayForm, setDayForm] = useState({ dayNumber: day.dayNumber, topic: day.topic })
  const [editingSession, setEditingSession] = useState(undefined)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveDay(event) {
    event.preventDefault()
    const errors = validateDay(dayForm)
    if (errors.length) {
      setError(errors.join(' '))
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSaveDay({ ...day, ...dayForm, dayNumber: Number(dayForm.dayNumber) })
    } catch (saveError) {
      setError(saveError.message || 'Day could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function saveSession(session) {
    await onSaveSession(day.id, session)
    setEditingSession(undefined)
  }

  async function confirmDelete() {
    setSaving(true)
    try {
      if (deleteTarget.type === 'day') await onDeleteDay(day.id)
      else await onDeleteSession(day.id, deleteTarget.id)
      setDeleteTarget(null)
    } catch (deleteError) {
      setError(deleteError.message || 'Item could not be deleted.')
      setDeleteTarget(null)
    } finally {
      setSaving(false)
    }
  }

  async function moveSession(index, direction) {
    const sessions = [...day.sessions].sort((a, b) => a.sortOrder - b.sortOrder)
    const target = index + direction
    if (target < 0 || target >= sessions.length) return
    ;[sessions[index], sessions[target]] = [sessions[target], sessions[index]]
    await onReorder(day.id, sessions.map((session) => session.id))
  }

  const sessions = [...day.sessions].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <Card className="plan-day-editor">
      <form className="plan-day-editor__heading" onSubmit={saveDay}>
        <div className="field"><label htmlFor={`day-number-${day.id}`}>Day number</label><input id={`day-number-${day.id}`} type="number" min="1" max="365" required value={dayForm.dayNumber} onChange={(event) => setDayForm((current) => ({ ...current, dayNumber: event.target.value }))} /></div>
        <div className="field"><label htmlFor={`day-topic-${day.id}`}>Topic</label><input id={`day-topic-${day.id}`} maxLength="160" required value={dayForm.topic} onChange={(event) => setDayForm((current) => ({ ...current, topic: event.target.value }))} /></div>
        <Button size="small" type="submit" icon={Save} loading={saving}>Save day</Button>
        <Button size="small" variant="ghost" icon={Trash2} onClick={() => setDeleteTarget({ type: 'day', id: day.id })}>Delete day</Button>
      </form>
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <div className="plan-day-editor__session-heading"><h3>Sessions</h3><Button size="small" variant="ghost" icon={Plus} onClick={() => setEditingSession(null)}>Add session</Button></div>
      {sessions.length === 0 ? <p className="plan-day-editor__empty">No sessions in this day.</p> : (
        <div className="plan-session-list">
          {sessions.map((session, index) => (
            <div className="plan-session-row" key={session.id}>
              <span className="plan-session-row__order">{index + 1}</span>
              <span className="plan-session-row__copy"><strong>{session.title}</strong><small>{session.type} · {session.startTime}–{session.endTime}</small></span>
              <div className="plan-session-row__actions">
                <Button variant="ghost" size="small" icon={ArrowUp} aria-label={`Move ${session.title} up`} disabled={index === 0} onClick={() => moveSession(index, -1)} />
                <Button variant="ghost" size="small" icon={ArrowDown} aria-label={`Move ${session.title} down`} disabled={index === sessions.length - 1} onClick={() => moveSession(index, 1)} />
                <Button variant="ghost" size="small" icon={Pencil} aria-label={`Edit ${session.title}`} onClick={() => setEditingSession(session)}>Edit</Button>
                <Button variant="ghost" size="small" icon={Trash2} aria-label={`Delete ${session.title}`} onClick={() => setDeleteTarget({ type: 'session', id: session.id, title: session.title })}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingSession !== undefined ? <SessionEditorForm initialSession={editingSession} onSave={saveSession} onCancel={() => setEditingSession(undefined)} /> : null}
      <ConfirmDialog open={Boolean(deleteTarget)} title={deleteTarget?.type === 'day' ? `Delete Day ${day.dayNumber}?` : `Delete “${deleteTarget?.title}”?`} confirmLabel={deleteTarget?.type === 'day' ? 'Delete day' : 'Delete session'} busy={saving} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete}><p>{deleteTarget?.type === 'day' ? 'This removes the day, all of its sessions, related progress, and its note.' : 'This removes the session and any progress recorded for it.'}</p></ConfirmDialog>
    </Card>
  )
}
