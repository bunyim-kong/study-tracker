import { BookOpen, Check, FileCode2, HelpCircle, NotebookPen } from 'lucide-react'
import { Link } from 'react-router-dom'
import './SessionTile.css'

const SESSION_DETAILS = {
  research: { label: 'Research', icon: BookOpen },
  practice: { label: 'Practice', icon: FileCode2 },
  quiz: { label: 'Quiz', icon: HelpCircle },
  note: { label: 'Note', icon: NotebookPen },
}

export function getSessionLabel(type) {
  return SESSION_DETAILS[type]?.label || 'Session'
}

export default function SessionTile({ session, done = false, locked = false }) {
  const details = SESSION_DETAILS[session.type] || SESSION_DETAILS.research
  const Icon = details.icon
  const content = (
    <>
      <span className="session-tile__icon">
        {done ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}
      </span>
      <span className="session-tile__copy">
        <strong>{details.label}</strong>
        <span className="session-tile__time">{session.startTime}–{session.endTime}</span>
        <span>{locked ? 'View topic in Week' : done ? 'Complete' : session.title}</span>
      </span>
    </>
  )

  if (locked) {
    return <div className="session-tile session-tile--locked" aria-label={`${details.label}, upcoming`}>{content}</div>
  }

  return (
    <Link className={`session-tile ${done ? 'session-tile--done' : ''}`} to={`/app/session/${session.id}`}>
      {content}
      <span className="session-tile__arrow" aria-hidden="true">→</span>
    </Link>
  )
}
