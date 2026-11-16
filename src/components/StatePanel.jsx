import { AlertCircle, RotateCcw } from 'lucide-react'
import Button from './Button.jsx'
import Card from './Card.jsx'
import Mascot from './Mascot.jsx'
import './StatePanel.css'

export function LoadingState({ message = 'Getting your study space ready…' }) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <Mascot mood="thinking" size={130} />
      <p>{message}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <Card className="state-panel" role="alert">
      <AlertCircle size={34} aria-hidden="true" />
      <h2>That didn’t work</h2>
      <p>{message || 'Please try again.'}</p>
      {onRetry ? <Button icon={RotateCcw} onClick={onRetry}>Try again</Button> : null}
    </Card>
  )
}

export function EmptyState({ mood = 'sleepy', title, children }) {
  return (
    <div className="state-panel">
      <Mascot mood={mood} size={170} />
      <h1>{title}</h1>
      {children}
    </div>
  )
}
