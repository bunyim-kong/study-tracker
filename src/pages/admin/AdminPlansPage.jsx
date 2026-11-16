import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, FilePlus2, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import './AdminPlansPage.css'

export default function AdminPlansPage() {
  const { adapter } = useAuth()
  const [plans, setPlans] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextPlans, nextAssignments] = await Promise.all([adapter.listPlans(), adapter.listAssignments()])
      setPlans(nextPlans)
      setAssignments(nextAssignments)
    } catch (loadError) {
      setError(loadError.message || 'Plans could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [adapter])

  useEffect(() => { load() }, [load])
  const assignmentCounts = useMemo(() => assignments.reduce((counts, assignment) => ({ ...counts, [assignment.planId]: (counts[assignment.planId] || 0) + 1 }), {}), [assignments])

  async function createPlan(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await adapter.createPlan(createForm)
      setCreateForm({ title: '', description: '' })
      setShowCreate(false)
      await load()
    } catch (createError) {
      setError(createError.message || 'Plan could not be created.')
    } finally {
      setSaving(false)
    }
  }

  async function duplicate(planId) {
    setError('')
    try {
      await adapter.duplicatePlan(planId)
      await load()
    } catch (duplicateError) {
      setError(duplicateError.message || 'Plan could not be duplicated.')
    }
  }

  async function deletePlan() {
    setSaving(true)
    setError('')
    try {
      await adapter.deletePlan(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (deleteError) {
      setError(deleteError.message || 'Plan could not be deleted.')
      setDeleteTarget(null)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLoading message="Loading plans…" />

  return (
    <>
      <PageHeader eyebrow="Plan library" title="Plans" description="Templates stay reusable. Assigned learner copies can be edited independently." actions={<Button icon={FilePlus2} onClick={() => setShowCreate((open) => !open)}>Create plan</Button>} />
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {showCreate ? <Card className="admin-create-plan"><h2>New plan</h2><form className="form-stack" onSubmit={createPlan}><div className="field"><label htmlFor="new-plan-title">Title</label><input id="new-plan-title" maxLength="120" required value={createForm.title} onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))} /></div><div className="field"><label htmlFor="new-plan-description">Description</label><textarea id="new-plan-description" maxLength="2000" value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} /></div><div className="admin-form-actions"><Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" loading={saving}>Create plan</Button></div></form></Card> : null}

      {plans.length === 0 ? <AdminEmpty title="No plans yet"><p>Create the first reusable study template.</p></AdminEmpty> : (
        <div className="admin-plan-list">
          {plans.map((plan) => {
            const assigned = assignmentCounts[plan.id] || 0
            return <Card as="article" className="admin-plan-card" key={plan.id}><div className="admin-plan-card__copy"><div className="admin-plan-card__meta"><span className={plan.isLearnerCopy ? 'admin-copy-badge' : 'admin-template-badge'}>{plan.isLearnerCopy ? 'Learner copy' : 'Template'}</span><span>{plan.days.length} days</span><span>{assigned} assignments</span></div><h2>{plan.title}</h2><p>{plan.description || 'No description yet.'}</p></div><div className="admin-plan-card__actions"><Link className="button button--ghost button--small" to={`/admin/plans/${plan.id}`}><Pencil aria-hidden="true" /> Edit</Link><Button variant="ghost" size="small" icon={Copy} onClick={() => duplicate(plan.id)}>Duplicate</Button><Button variant="ghost" size="small" icon={Trash2} onClick={() => setDeleteTarget(plan)}>Delete</Button></div></Card>
          })}
        </div>
      )}

      <ConfirmDialog open={Boolean(deleteTarget)} title={`Delete “${deleteTarget?.title}”?`} confirmLabel="Delete plan" busy={saving} onCancel={() => setDeleteTarget(null)} onConfirm={deletePlan}><p>This permanently removes its days and sessions. Plans with assignments are blocked from deletion.</p></ConfirmDialog>
    </>
  )
}
