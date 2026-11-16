import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from './StatePanel.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export function PublicOnlyRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingState />
  if (!user) return <Outlet />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/app/today'} replace />
}

export function LearnerRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (user.role !== 'learner') return <Navigate to="/admin" replace />
  return <Outlet />
}

export function AdminRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingState />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/app/today" replace />
  return <Outlet />
}
