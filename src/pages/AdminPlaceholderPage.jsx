import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button, Card } from '../components/index.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminPlaceholderPage() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <main className="state-panel">
      <Card>
        <span className="status-chip">Admin · {user.name}</span>
        <h1>Admin pages come in Stage 3</h1>
        <p>The learner experience is the only product area enabled in this stage.</p>
        <Button variant="ghost" icon={LogOut} onClick={handleSignOut}>Sign out</Button>
      </Card>
    </main>
  )
}
