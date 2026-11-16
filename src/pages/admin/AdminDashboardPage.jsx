import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CalendarClock, MessageCircleQuestion, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../../components/Card.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminState.jsx'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { buildAttentionList } from '../../lib/adminDashboard.js'
import { formatStudyDate } from '../../lib/dates.js'
import './AdminPages.css'

const ATTENTION_ICONS = { 'no-plan': CalendarClock, missed: AlertTriangle, question: MessageCircleQuestion }

export default function AdminDashboardPage() {
  const { adapter } = useAuth()
  const [overviews, setOverviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const learners = await adapter.listLearners()
      setOverviews(await Promise.all(learners.map((learner) => adapter.getLearnerOverview(learner.id))))
    } catch (loadError) {
      setError(loadError.message || 'Learners could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [adapter])

  useEffect(() => { load() }, [load])
  const attention = useMemo(() => buildAttentionList(overviews), [overviews])

  if (loading) return <AdminLoading message="Loading learner progress…" />
  if (error) return <AdminError message={error} onRetry={load} />

  return (
    <>
      <PageHeader eyebrow="Mentor overview" title="Dashboard" description="See who is moving, who is waiting, and where a quick comment can help." actions={<span className="admin-summary"><Users aria-hidden="true" /> {overviews.length} learners</span>} />

      <section className="admin-section" aria-labelledby="attention-title">
        <div className="admin-section__heading"><div><h2 id="attention-title">Needs your attention</h2><p>Items that benefit from a quick mentor check-in.</p></div><span className="admin-count">{attention.length}</span></div>
        {attention.length === 0 ? <Card className="admin-inline-empty">Nothing needs attention right now.</Card> : (
          <div className="attention-list">
            {attention.map((item) => {
              const Icon = ATTENTION_ICONS[item.type]
              return <Link to={`/admin/learners/${item.learnerId}`} key={item.id}><Icon aria-hidden="true" /><span>{item.message}</span><ArrowRight aria-hidden="true" /></Link>
            })}
          </div>
        )}
      </section>

      <section className="admin-section" aria-labelledby="learners-title">
        <div className="admin-section__heading"><div><h2 id="learners-title">Learners</h2><p>Today’s state across every account.</p></div></div>
        {overviews.length === 0 ? <AdminEmpty title="No learners yet"><p>New learner registrations will appear here.</p></AdminEmpty> : (
          <div className="learner-admin-grid">
            {overviews.map((overview) => (
              <Link className={`learner-admin-card ${overview.active ? '' : 'learner-admin-card--inactive'}`} to={`/admin/learners/${overview.id}`} key={overview.id}>
                <div className="learner-admin-card__top"><div><h3>{overview.name}</h3><p>{overview.planTitle || 'No plan assigned'}</p></div><AdminStatusBadge overview={overview} /></div>
                {overview.assignment ? <ProgressBar value={overview.todayDone} max={overview.todayTotal || 1} label={overview.todayTotal ? `Day ${overview.dayNumber} today` : `Day ${overview.dayNumber}`} size="small" /> : <div className="learner-admin-card__blank">Assign a plan to get started.</div>}
                <dl className="learner-admin-card__facts"><div><dt>Today</dt><dd>{overview.todayDone}/{overview.todayTotal}</dd></div><div><dt>Streak</dt><dd>{overview.streak} days</dd></div><div><dt>Last note</dt><dd>{overview.lastNoteDate ? formatStudyDate(overview.lastNoteDate, undefined, { weekday: undefined }) : 'None'}</dd></div></dl>
                {!overview.active ? <span className="admin-status">Inactive</span> : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
