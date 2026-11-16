import { Award, BookOpenText, CalendarDays, Home, Play, UserRound } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { countStars } from '../lib/progress.js'
import { getPlanDayNumber } from '../lib/dates.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useLearnerData } from '../context/LearnerDataContext.jsx'
import Button from './Button.jsx'
import DailyWelcome from './DailyWelcome.jsx'
import { EmptyState, ErrorState, LoadingState } from './StatePanel.jsx'
import './LearnerLayout.css'

const MAIN_LINKS = [
  { to: '/app/today', label: 'Today', icon: Home },
  { to: '/app/week', label: 'Week', icon: CalendarDays },
  { to: '/app/review', label: 'Review', icon: BookOpenText },
  { to: '/app/badges', label: 'Badges', icon: Award },
  { to: '/app/settings', label: 'Me', icon: UserRound },
]

function AppNavLink({ item }) {
  const Icon = item.icon
  return (
    <NavLink className={({ isActive }) => `app-nav__link ${isActive ? 'app-nav__link--active' : ''}`} to={item.to}>
      <Icon aria-hidden="true" />
      <span>{item.label}</span>
    </NavLink>
  )
}

function WaitingScreen() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <main className="waiting-screen">
      <EmptyState mood="sleepy" title="Waiting for your mentor to assign a plan">
        <p>Hi {user.name}. Your study space is ready, and Pip will wake up when your plan arrives.</p>
        <Button variant="ghost" onClick={handleSignOut}>Sign out</Button>
      </EmptyState>
    </main>
  )
}

export default function LearnerLayout() {
  const { user } = useAuth()
  const { assignment, plan, progress, loading, error, reload } = useLearnerData()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!assignment) return <WaitingScreen />
  if (!plan) return <ErrorState message="Your assigned plan could not be found." onRetry={reload} />

  const currentDayNumber = getPlanDayNumber(assignment.startDate)
  const today = plan.days.find((day) => day.dayNumber === currentDayNumber)
  const nextSession = today?.sessions.find(
    (session) => !progress.some((item) => item.sessionId === session.id && item.done),
  )
  const startPath = nextSession ? `/app/session/${nextSession.id}` : '/app/today'

  return (
    <div className="learner-shell">
      <DailyWelcome user={user} />
      <aside className="learner-sidebar">
        <NavLink className="learner-brand" to="/app/today" aria-label="Study Tracker home">
          <span className="learner-brand__mark" aria-hidden="true">ST</span>
          <span>Study Tracker</span>
        </NavLink>
        <nav className="app-nav app-nav--sidebar" aria-label="Learner navigation">
          {MAIN_LINKS.map((item) => <AppNavLink item={item} key={item.to} />)}
        </nav>
        <div className="learner-sidebar__profile">
          <span className="learner-sidebar__avatar"><UserRound aria-hidden="true" /></span>
          <span><strong>{user.name}</strong><small>{countStars(progress)} stars earned</small></span>
        </div>
      </aside>

      <div className="learner-workspace">
        <header className="learner-mobile-header">
          <NavLink className="learner-brand" to="/app/today">
            <span className="learner-brand__mark" aria-hidden="true">ST</span>
            <span>Study Tracker</span>
          </NavLink>
          <span className="learner-mobile-header__stars">★ {countStars(progress)}</span>
        </header>
        <main className="learner-content">
          <Outlet />
        </main>
      </div>

      <nav className="app-nav app-nav--bottom" aria-label="Learner navigation">
        <AppNavLink item={MAIN_LINKS[0]} />
        <AppNavLink item={MAIN_LINKS[1]} />
        <NavLink className="app-nav__start" to={startPath} aria-label="Start next session">
          <Play fill="currentColor" aria-hidden="true" />
          <span>Start</span>
        </NavLink>
        <AppNavLink item={MAIN_LINKS[3]} />
        <AppNavLink item={MAIN_LINKS[4]} />
      </nav>
    </div>
  )
}
