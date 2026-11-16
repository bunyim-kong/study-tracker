import { useState } from 'react'
import { Download } from 'lucide-react'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import PasswordChangeForm from '../../components/PasswordChangeForm.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import './AdminSettingsPage.css'

export default function AdminSettingsPage() {
  const { adapter } = useAuth()
  const [exportStatus, setExportStatus] = useState('')

  async function exportAll() {
    setExportStatus('Preparing export…')
    try {
      const data = await adapter.exportAllData()
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'study-tracker-admin-export.json'
      link.click()
      URL.revokeObjectURL(url)
      setExportStatus('Export downloaded')
    } catch (error) {
      setExportStatus(error.message || 'Export could not be created.')
    }
  }

  return (
    <>
      <PageHeader eyebrow="Account and backups" title="Admin settings" description="Change the admin password or download a password-free JSON backup of all mock data." />
      <div className="admin-settings-grid">
        <Card><h2>Change password</h2><PasswordChangeForm /></Card>
        <Card><h2>Export all data</h2><p>Includes profiles, plans, assignments, progress, and notes. Passwords and the current session are excluded.</p><Button icon={Download} onClick={exportAll}>Export all data</Button><p className="admin-export-status" aria-live="polite">{exportStatus}</p></Card>
      </div>
    </>
  )
}
