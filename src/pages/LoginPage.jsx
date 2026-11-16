import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, ShieldCheck } from 'lucide-react'
import { Button, Card, Mascot } from '../components/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import { demoCredentials } from '../data/seed/seedPlan.js'
import './AuthPages.css'

export default function LoginPage() {
  const { signIn, notice, clearNotice } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function logIn(credentials) {
    setSubmitting(true)
    setError('')
    clearNotice()
    try {
      const user = await signIn(credentials)
      navigate(user.role === 'admin' ? '/admin' : '/app/today', { replace: true })
    } catch (loginError) {
      setError(loginError.message || 'Sign in failed.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    logIn(form)
  }

  return (
    <main className="auth-page">
      <section className="auth-page__welcome">
        <Mascot mood="happy" size={230} />
        <span className="auth-page__eyebrow">Study Tracker</span>
        <h1>Ready for one small win?</h1>
        <p>Pip saved your place. Sign in and keep your learning streak moving.</p>
      </section>

      <Card className="auth-card">
        <h2>Welcome back</h2>
        <p className="auth-card__intro">Use your account or jump into the seeded mock demo.</p>
        {notice ? <p className="form-notice" role="status">{notice}</p> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </div>
          <Button type="submit" size="large" loading={submitting}>Sign in</Button>
        </form>

        <div className="auth-card__divider"><span>Mock mode shortcuts</span></div>
        <div className="auth-card__demos">
          <Button variant="ghost" icon={GraduationCap} onClick={() => logIn(demoCredentials.learner)} disabled={submitting}>
            Use demo learner
          </Button>
          <Button variant="ghost" icon={ShieldCheck} onClick={() => logIn(demoCredentials.admin)} disabled={submitting}>
            Use demo admin
          </Button>
        </div>
        <p className="auth-card__footer">New here? <Link to="/register">Create a learner account</Link></p>
      </Card>
    </main>
  )
}
