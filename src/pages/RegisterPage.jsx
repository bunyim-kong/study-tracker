import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Mascot } from '../components/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import './AuthPages.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await register(form)
      navigate('/app/today', { replace: true })
    } catch (registerError) {
      setError(registerError.message || 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-page__welcome">
        <Mascot mood="thinking" size={230} />
        <span className="auth-page__eyebrow">A fresh start</span>
        <h1>Learn at your pace.</h1>
        <p>Create a learner account. Your mentor can assign a plan when you are ready.</p>
      </section>

      <Card className="auth-card">
        <h2>Create learner account</h2>
        <p className="auth-card__intro">New registrations always receive the learner role.</p>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="register-name">Name</label>
            <input id="register-name" autoComplete="name" required value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="register-email">Email</label>
            <input id="register-email" type="email" autoComplete="email" required value={form.email} onChange={(event) => updateField('email', event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="register-password">Password</label>
            <input id="register-password" type="password" autoComplete="new-password" minLength="10" required value={form.password} onChange={(event) => updateField('password', event.target.value)} />
            <p className="field__hint">Use at least 10 characters.</p>
          </div>
          <Button type="submit" size="large" loading={submitting}>Create account</Button>
        </form>
        <p className="auth-card__footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </Card>
    </main>
  )
}
