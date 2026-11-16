import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, UserPlus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { toLocalDateKey } from '../../lib/dates.js'
import './AdminAssignPage.css'

export default function AdminAssignPage() {
  const { adapter } = useAuth()
  const [searchParams] = useSearchParams()
  const [learners, setLearners] = useState([])
  const [plans, setPlans] = useState([])
  const [assignments, setAssignments] = useState([])
  const [form, setForm] = useState({ learnerId: searchParams.get('learner') || '', planId: '', startDate: toLocalDateKey() })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([adapter.listLearners(), adapter.listPlans(), adapter.listAssignments()])
      .then(([nextLearners, nextPlans, nextAssignments]) => {
        if (cancelled) return
        const templates = nextPlans.filter((plan) => !plan.isLearnerCopy)
        setLearners(nextLearners)
        setPlans(templates)
        setAssignments(nextAssignments)
        setForm((current) => ({
          ...current,
          learnerId: current.learnerId || nextLearners.find((learner) => !nextAssignments.some((assignment) => assignment.learnerId === learner.id))?.id || '',
          planId: current.planId || templates[0]?.id || '',
        }))
      })
      .catch((loadError) => { if (!cancelled) setError(loadError.message || 'Assignment options could not be loaded.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [adapter])

  const assignedLearnerIds = useMemo(() => new Set(assignments.map((assignment) => assignment.learnerId)), [assignments])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(null)
    try {
      const result = await adapter.assignPlan(form.learnerId, form.planId, form.startDate)
      const learner = learners.find((item) => item.id === form.learnerId)
      setSuccess({ learnerId: form.learnerId, learnerName: learner.name, planTitle: result.plan.title })
      setAssignments((current) => [...current, result.assignment])
    } catch (assignError) {
      setError(assignError.message || 'Plan could not be assigned.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLoading message="Loading assignment options…" />
  if (error && learners.length === 0 && plans.length === 0) return <AdminError message={error} />

  return (
    <>
      <PageHeader eyebrow="Independent learner copies" title="Assign a plan" description="Assignment deep-copies every day and session, so later learner edits never alter the template." />
      <Card className="admin-assign-card">
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {success ? <div className="admin-assign-success" role="status"><CheckCircle2 aria-hidden="true" /><div><strong>Plan assigned to {success.learnerName}</strong><span>{success.planTitle}</span><Link to={`/admin/learners/${success.learnerId}`}>Open learner →</Link></div></div> : null}
        <form className="form-stack" onSubmit={submit}>
          <div className="field"><label htmlFor="assign-learner">Learner</label><select id="assign-learner" required value={form.learnerId} onChange={(event) => setForm((current) => ({ ...current, learnerId: event.target.value }))}><option value="">Choose a learner</option>{learners.map((learner) => <option key={learner.id} value={learner.id} disabled={assignedLearnerIds.has(learner.id)}>{learner.name}{assignedLearnerIds.has(learner.id) ? ' — already assigned' : ''}</option>)}</select></div>
          <div className="field"><label htmlFor="assign-plan">Plan template</label><select id="assign-plan" required value={form.planId} onChange={(event) => setForm((current) => ({ ...current, planId: event.target.value }))}><option value="">Choose a template</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title} · {plan.days.length} days</option>)}</select></div>
          <div className="field"><label htmlFor="assign-start">Start date</label><input id="assign-start" type="date" required value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} /></div>
          <Button type="submit" icon={UserPlus} loading={saving} disabled={!form.learnerId || !form.planId}>Assign independent copy</Button>
        </form>
      </Card>
    </>
  )
}
