import { useNavigate } from 'react-router-dom'
import Card from '../../components/Card.jsx'
import PasswordChangeForm from '../../components/PasswordChangeForm.jsx'
import './AdminChangePasswordPage.css'

export default function AdminChangePasswordPage() {
  const navigate = useNavigate()
  return (
    <main className="admin-password-page">
      <div className="admin-password-page__brand"><span aria-hidden="true">ST</span><strong>Study Tracker</strong><small>Admin</small></div>
      <Card className="admin-password-card">
        <span className="admin-password-card__eyebrow">Required security step</span>
        <h1>Choose a new password</h1>
        <p>You must update the temporary admin password before opening any admin data.</p>
        <PasswordChangeForm onSuccess={() => navigate('/admin', { replace: true })} />
      </Card>
    </main>
  )
}
