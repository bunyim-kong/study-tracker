import { useState } from 'react'
import { BookOpenText, Download, LogOut, Moon, Save, Sun } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card } from '../components/index.js'
import PageHeader from '../components/PageHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import './SettingsPage.css'

export default function SettingsPage() {
  const { adapter, signOut, updateName, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [name, setName] = useState(user.name)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setStatus('')
    try {
      await updateName(name)
      setStatus('Name saved')
    } catch (error) {
      setStatus(error.message || 'Name could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function exportData() {
    setStatus('Preparing export…')
    try {
      const data = await adapter.exportMyData()
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `study-tracker-${user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`
      link.click()
      URL.revokeObjectURL(url)
      setStatus('Export downloaded')
    } catch (error) {
      setStatus(error.message || 'Export could not be created.')
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <PageHeader eyebrow="Your space" title="Settings" description="Keep the app comfortable, update your name, or take a copy of your learning data." />
      <div className="settings-grid">
        <Card>
          <h2>Profile</h2>
          <form className="form-stack" onSubmit={saveProfile}>
            <div className="field"><label htmlFor="settings-name">Name</label><input id="settings-name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></div>
            <div className="field"><span className="field__label">Email</span><p className="settings-readonly">{user.email}</p></div>
            <Button type="submit" icon={Save} loading={saving}>Save name</Button>
          </form>
        </Card>

        <Card>
          <h2>Theme</h2>
          <div className="theme-options" role="radiogroup" aria-label="Color theme">
            <button className={theme === 'dark' ? 'theme-option theme-option--active' : 'theme-option'} role="radio" aria-checked={theme === 'dark'} onClick={() => setTheme('dark')}><Moon aria-hidden="true" /><span><strong>Dark</strong><small>Night-friendly navy</small></span></button>
            <button className={theme === 'light' ? 'theme-option theme-option--active' : 'theme-option'} role="radio" aria-checked={theme === 'light'} onClick={() => setTheme('light')}><Sun aria-hidden="true" /><span><strong>Light</strong><small>Warm paper tones</small></span></button>
          </div>
        </Card>

        <Card>
          <h2>Your learning data</h2>
          <p className="settings-copy">Download your profile, assigned plan, progress, and notes as readable JSON.</p>
          <div className="settings-actions">
            <Button icon={Download} onClick={exportData}>Export my data</Button>
            <Link className="button button--ghost" to="/app/review"><BookOpenText aria-hidden="true" /> Review notes</Link>
          </div>
        </Card>

        <Card variant="quiet">
          <h2>Session</h2>
          <p className="settings-copy">Signing out keeps mock progress in this browser.</p>
          <Button variant="ghost" icon={LogOut} onClick={handleSignOut}>Sign out</Button>
        </Card>
      </div>
      <p className="settings-status" aria-live="polite">{status}</p>
    </>
  )
}
