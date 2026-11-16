import { useCallback, useEffect, useState } from 'react'
import { Plus, Save } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import PlanDayEditor from '../../components/admin/PlanDayEditor.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { validateDay, validatePlanDetails } from '../../lib/planValidation.js'
import './AdminPlanEditorPage.css'

export default function AdminPlanEditorPage() {
  const { id } = useParams()
  const { adapter } = useAuth()
  const [plan, setPlan] = useState(null)
  const [meta, setMeta] = useState({ title: '', description: '' })
  const [newDay, setNewDay] = useState({ dayNumber: 1, topic: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const nextPlan = await adapter.getPlan(id)
      setPlan(nextPlan)
      if (nextPlan) {
        setMeta({ title: nextPlan.title, description: nextPlan.description || '' })
        setNewDay({ dayNumber: Math.max(0, ...nextPlan.days.map((day) => day.dayNumber)) + 1, topic: '' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Plan could not be loaded.' })
    } finally {
      setLoading(false)
    }
  }, [adapter, id])

  useEffect(() => { load() }, [load])

  if (loading) return <AdminLoading message="Loading plan editor…" />
  if (!plan && status.message) return <AdminError message={status.message} onRetry={load} />
  if (!plan) return <Navigate to="/admin/plans" replace />

  async function saveMeta(event) {
    event.preventDefault()
    const errors = validatePlanDetails(meta)
    if (errors.length) {
      setStatus({ type: 'error', message: errors.join(' ') })
      return
    }
    setSaving(true)
    try {
      await adapter.updatePlan(id, meta)
      setStatus({ type: 'success', message: 'Plan details saved.' })
      await load()
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Plan could not be saved.' })
    } finally {
      setSaving(false)
    }
  }

  async function addDay(event) {
    event.preventDefault()
    const errors = validateDay(newDay)
    if (errors.length) {
      setStatus({ type: 'error', message: errors.join(' ') })
      return
    }
    try {
      await adapter.upsertDay(id, newDay)
      setStatus({ type: 'success', message: 'Day added.' })
      await load()
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Day could not be added.' })
    }
  }

  async function runAndReload(action, successMessage) {
    await action()
    setStatus({ type: 'success', message: successMessage })
    await load()
  }

  return (
    <>
      <PageHeader backTo="/admin/plans" eyebrow={plan.isLearnerCopy ? 'Learner copy' : 'Template'} title="Plan editor" description="Changes save to this plan only. Session order uses accessible Up and Down controls." />
      <p className={status.type === 'error' ? 'form-error' : status.message ? 'form-success' : 'admin-live-status'} role={status.type === 'error' ? 'alert' : 'status'} aria-live="polite">{status.message}</p>

      <Card className="admin-plan-meta">
        <h2>Plan details</h2>
        <form className="form-stack" onSubmit={saveMeta}>
          <div className="field"><label htmlFor="plan-title">Title</label><input id="plan-title" maxLength="120" required value={meta.title} onChange={(event) => setMeta((current) => ({ ...current, title: event.target.value }))} /></div>
          <div className="field"><label htmlFor="plan-description">Description</label><textarea id="plan-description" maxLength="2000" value={meta.description} onChange={(event) => setMeta((current) => ({ ...current, description: event.target.value }))} /></div>
          <Button type="submit" icon={Save} loading={saving}>Save plan details</Button>
        </form>
      </Card>

      <section className="admin-section" aria-labelledby="plan-days-title">
        <div className="admin-section__heading"><div><h2 id="plan-days-title">Days</h2><p>{plan.days.length} configured</p></div></div>
        {plan.days.length === 0 ? <AdminEmpty title="No days yet"><p>Add the first day below.</p></AdminEmpty> : plan.days.map((day) => <PlanDayEditor key={day.id} day={day} onSaveDay={(details) => runAndReload(() => adapter.upsertDay(id, details), 'Day saved.')} onDeleteDay={(dayId) => runAndReload(() => adapter.deleteDay(id, dayId), 'Day deleted.')} onSaveSession={(dayId, session) => runAndReload(() => adapter.upsertSession(id, dayId, session), 'Session saved.')} onDeleteSession={(dayId, sessionId) => runAndReload(() => adapter.deleteSession(id, dayId, sessionId), 'Session deleted.')} onReorder={(dayId, orderedIds) => runAndReload(() => adapter.reorderSessions(id, dayId, orderedIds), 'Session order saved.')} />)}
      </section>

      <Card className="admin-add-day">
        <h2>Add day</h2>
        <form onSubmit={addDay}><div className="field"><label htmlFor="new-day-number">Day number</label><input id="new-day-number" type="number" min="1" max="365" required value={newDay.dayNumber} onChange={(event) => setNewDay((current) => ({ ...current, dayNumber: event.target.value }))} /></div><div className="field"><label htmlFor="new-day-topic">Topic</label><input id="new-day-topic" maxLength="160" required value={newDay.topic} onChange={(event) => setNewDay((current) => ({ ...current, topic: event.target.value }))} /></div><Button type="submit" icon={Plus}>Add day</Button></form>
      </Card>
    </>
  )
}
