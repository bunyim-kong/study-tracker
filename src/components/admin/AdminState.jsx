import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react'
import Button from '../Button.jsx'
import './AdminState.css'

export function AdminLoading({ message = 'Loading admin data…' }) {
  return <div className="admin-state" role="status"><LoaderCircle className="admin-state__spinner" aria-hidden="true" /><p>{message}</p></div>
}

export function AdminError({ message, onRetry }) {
  return <div className="admin-state" role="alert"><AlertCircle aria-hidden="true" /><h2>Something went wrong</h2><p>{message}</p>{onRetry ? <Button onClick={onRetry}>Try again</Button> : null}</div>
}

export function AdminEmpty({ title, children }) {
  return <div className="admin-state"><Inbox aria-hidden="true" /><h2>{title}</h2>{children}</div>
}
