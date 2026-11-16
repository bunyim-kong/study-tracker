import { useEffect, useState } from 'react'
import { ClipboardList, LayoutDashboard, LogOut, Menu, Settings, Sparkles, UserPlus, X } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Button from './Button.jsx'
import './AdminLayout.css'

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/plans', label: 'Plans', icon: ClipboardList },
  { to: '/admin/assign', label: 'Assign plan', icon: UserPlus },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function AdminNav({ onNavigate }) {
  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      {ADMIN_LINKS.map((item) => {
        const Icon = item.icon
        return <NavLink end={item.end} to={item.to} onClick={onNavigate} className={({ isActive }) => `admin-nav__link ${isActive ? 'admin-nav__link--active' : ''}`} key={item.to}><Icon aria-hidden="true" /><span>{item.label}</span></NavLink>
      })}
      <span className="admin-nav__link admin-nav__link--disabled" aria-disabled="true"><Sparkles aria-hidden="true" /><span>AI Plan Builder <small>(coming soon)</small></span></span>
    </nav>
  )
}

export default function AdminLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => setDrawerOpen(false), [location.pathname])
  useEffect(() => {
    if (!drawerOpen) return undefined
    function closeOnEscape(event) { if (event.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [drawerOpen])

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <button className="admin-topbar__menu" onClick={() => setDrawerOpen(true)} aria-label="Open admin menu" aria-expanded={drawerOpen}><Menu aria-hidden="true" /></button>
        <NavLink className="admin-brand" to="/admin"><span className="admin-brand__mark" aria-hidden="true">ST</span><span>Study Tracker</span></NavLink>
        <span className="admin-badge">Admin</span>
      </header>

      {drawerOpen ? <button className="admin-drawer-overlay" aria-label="Close admin menu" onClick={() => setDrawerOpen(false)} /> : null}
      <aside className={`admin-sidebar ${drawerOpen ? 'admin-sidebar--open' : ''}`} aria-label="Admin sidebar">
        <div className="admin-sidebar__header">
          <NavLink className="admin-brand" to="/admin"><span className="admin-brand__mark" aria-hidden="true">ST</span><span>Study Tracker</span></NavLink>
          <button className="admin-sidebar__close" aria-label="Close admin menu" onClick={() => setDrawerOpen(false)}><X aria-hidden="true" /></button>
        </div>
        <span className="admin-badge">Admin</span>
        <AdminNav onNavigate={() => setDrawerOpen(false)} />
        <div className="admin-sidebar__account"><span><strong>{user.name}</strong><small>{user.email}</small></span><Button variant="ghost" size="small" icon={LogOut} onClick={handleSignOut}>Sign out</Button></div>
      </aside>

      <main className="admin-content"><Outlet /></main>
    </div>
  )
}
