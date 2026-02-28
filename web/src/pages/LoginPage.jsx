import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { getAuthToken, setAuthToken } from '../lib/auth'
import './LoginPage.css'

const initialAuthState = {
  name: '',
  email: '',
  password: '',
}

function LoginPage() {
  const navigate = useNavigate()
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(initialAuthState)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (getAuthToken()) {
      navigate('/chat', { replace: true })
    }
  }, [navigate])

  const handleAuthChange = (event) => {
    const { name, value } = event.target
    setAuthForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()

    try {
      setAuthLoading(true)
      setError('')

      const payload = {
        email: authForm.email.trim(),
        password: authForm.password,
      }

      let response
      if (authMode === 'register') {
        response = await api.register({ ...payload, name: authForm.name.trim() })
      } else {
        response = await api.login(payload)
      }

      setAuthToken(response.token)
      navigate('/chat', { replace: true })
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleAuthSubmit}>
        <h1>Chat Bot</h1>
        <p>{authMode === 'register' ? 'Create your account' : 'Sign in to continue'}</p>

        {authMode === 'register' ? (
          <label>
            Name
            <input
              name="name"
              type="text"
              value={authForm.name}
              onChange={handleAuthChange}
              required
            />
          </label>
        ) : null}

        <label>
          Email
          <input
            name="email"
            type="email"
            value={authForm.email}
            onChange={handleAuthChange}
            required
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={authForm.password}
            onChange={handleAuthChange}
            required
            minLength={8}
          />
        </label>

        <button type="submit" disabled={authLoading}>
          {authLoading ? 'Please wait...' : authMode === 'register' ? 'Create account' : 'Sign in'}
        </button>

        <button
          type="button"
          className="auth-link-button"
          onClick={() => setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))}
        >
          {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </button>

        {error ? <div className="auth-error">{error}</div> : null}
      </form>
    </div>
  )
}

export default LoginPage
