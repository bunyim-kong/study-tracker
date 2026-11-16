import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { validatePasswordChange } from '../lib/adminGuard.js'
import Button from './Button.jsx'

export default function PasswordChangeForm({ onSuccess }) {
  const { changePassword } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validatePasswordChange(form)
    if (errors.length) {
      setStatus({ type: 'error', message: errors.join(' ') })
      return
    }
    setSaving(true)
    setStatus({ type: '', message: '' })
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setStatus({ type: 'success', message: 'Password changed.' })
      onSuccess?.()
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Password could not be changed.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {status.message ? <p className={status.type === 'error' ? 'form-error' : 'form-success'} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p> : null}
      <div className="field"><label htmlFor="current-password">Current password</label><input id="current-password" type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(event) => update('currentPassword', event.target.value)} /></div>
      <div className="field"><label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength="10" required value={form.newPassword} onChange={(event) => update('newPassword', event.target.value)} /><p className="field__hint">At least 10 characters and different from your current password.</p></div>
      <div className="field"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength="10" required value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} /></div>
      <Button type="submit" icon={KeyRound} loading={saving}>Change password</Button>
    </form>
  )
}
