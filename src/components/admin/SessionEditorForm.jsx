import { useId, useState } from 'react'
import { Link2, Save, Trash2 } from 'lucide-react'
import Button from '../Button.jsx'
import { validateSession } from '../../lib/planValidation.js'
import './SessionEditorForm.css'

const EMPTY_SESSION = {
  type: 'research',
  startTime: '20:00',
  endTime: '20:30',
  title: '',
  resources: [],
  practicePath: '',
  exercise: '',
}

export default function SessionEditorForm({ initialSession, onSave, onCancel }) {
  const formId = useId()
  const [session, setSession] = useState(() => ({
    ...EMPTY_SESSION,
    ...initialSession,
    resources: initialSession?.resources || [],
  }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setSession((current) => ({ ...current, [field]: value }))
  }

  function updateResource(index, field, value) {
    setSession((current) => ({
      ...current,
      resources: current.resources.map((resource, itemIndex) => (
        itemIndex === index ? { ...resource, [field]: value } : resource
      )),
    }))
  }

  async function submit(event) {
    event.preventDefault()
    const errors = validateSession(session)
    if (errors.length) {
      setError(errors.join(' '))
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(session)
    } catch (saveError) {
      setError(saveError.message || 'Session could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-session-form" onSubmit={submit}>
      <h3>{session.id ? 'Edit session' : 'Add session'}</h3>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="admin-session-form__grid">
        <div className="field">
          <label htmlFor={`${formId}-type`}>Type</label>
          <select id={`${formId}-type`} value={session.type} onChange={(event) => update('type', event.target.value)}>
            <option value="research">Research</option>
            <option value="practice">Practice</option>
            <option value="quiz">Quiz</option>
            <option value="note">Note</option>
          </select>
        </div>
        <div className="field"><label htmlFor={`${formId}-title`}>Title</label><input id={`${formId}-title`} maxLength="120" required value={session.title} onChange={(event) => update('title', event.target.value)} /></div>
        <div className="field"><label htmlFor={`${formId}-start`}>Start time</label><input id={`${formId}-start`} type="time" required value={session.startTime} onChange={(event) => update('startTime', event.target.value)} /></div>
        <div className="field"><label htmlFor={`${formId}-end`}>End time</label><input id={`${formId}-end`} type="time" required value={session.endTime} onChange={(event) => update('endTime', event.target.value)} /></div>
      </div>
      <div className="field"><label htmlFor={`${formId}-path`}>Practice path</label><input id={`${formId}-path`} maxLength="500" value={session.practicePath} onChange={(event) => update('practicePath', event.target.value)} /></div>
      <div className="field"><label htmlFor={`${formId}-exercise`}>Exercise</label><textarea id={`${formId}-exercise`} maxLength="4000" value={session.exercise} onChange={(event) => update('exercise', event.target.value)} /></div>

      <fieldset className="admin-resources">
        <legend>Resources</legend>
        {session.resources.map((resource, index) => (
          <div className="admin-resource-row" key={index}>
            <div className="field"><label htmlFor={`${formId}-resource-label-${index}`}>Label</label><input id={`${formId}-resource-label-${index}`} maxLength="100" value={resource.label} onChange={(event) => updateResource(index, 'label', event.target.value)} /></div>
            <div className="field"><label htmlFor={`${formId}-resource-url-${index}`}>URL</label><input id={`${formId}-resource-url-${index}`} type="url" maxLength="1000" placeholder="https://…" value={resource.url} onChange={(event) => updateResource(index, 'url', event.target.value)} /></div>
            <Button variant="ghost" size="small" icon={Trash2} aria-label={`Remove resource ${index + 1}`} onClick={() => update('resources', session.resources.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
          </div>
        ))}
        <Button variant="ghost" size="small" icon={Link2} onClick={() => update('resources', [...session.resources, { label: '', url: '' }])}>Add resource</Button>
      </fieldset>

      <div className="admin-form-actions">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" icon={Save} loading={saving}>Save session</Button>
      </div>
    </form>
  )
}
