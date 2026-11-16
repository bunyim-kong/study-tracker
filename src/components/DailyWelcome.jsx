import { useEffect, useMemo, useRef, useState } from 'react'
import Button from './Button.jsx'
import Mascot from './Mascot.jsx'
import { getBrowserStorage } from '../lib/storage.js'
import { toLocalDateKey } from '../lib/dates.js'
import './DailyWelcome.css'

export default function DailyWelcome({ user }) {
  const storage = useMemo(() => getBrowserStorage(), [])
  const storageKey = `study-tracker:welcome:${user.id}:${toLocalDateKey()}`
  const [open, setOpen] = useState(() => storage.getItem(storageKey) !== 'seen')
  const buttonRef = useRef(null)

  useEffect(() => {
    if (open) buttonRef.current?.focus()
  }, [open])

  if (!open) return null

  function closeWelcome() {
    storage.setItem(storageKey, 'seen')
    setOpen(false)
  }

  return (
    <div className="daily-welcome" role="dialog" aria-modal="true" aria-labelledby="daily-welcome-title">
      <div className="daily-welcome__card">
        <Mascot mood="happy" size={210} label={`Pip welcomes ${user.name}`} />
        <span className="daily-welcome__eyebrow">A new study day</span>
        <h1 id="daily-welcome-title">Hi {user.name}!</h1>
        <p>You only need to take the next small step. Pip will keep you company.</p>
        <Button ref={buttonRef} size="large" onClick={closeWelcome} className="daily-welcome__button">Let’s go</Button>
      </div>
    </div>
  )
}
