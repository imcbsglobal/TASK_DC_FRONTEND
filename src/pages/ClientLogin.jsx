import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useClientAuth } from '../auth/ClientAuthContext'
import PasswordInput from '../components/PasswordInput'

const input =
  'w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500'

export default function ClientLogin() {
  const { token, login } = useClientAuth()
  const navigate = useNavigate()
  const [clientId, setClientId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/dashboard" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(clientId.trim(), username.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const s = err.response?.status
      if (!err.response) setError('Could not reach the server.')
      else if (s === 429) setError('Too many attempts. Please wait a minute and try again.')
      else setError(err.response.data?.detail || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-xl shadow p-8 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Sign in</h1>
          <p className="text-sm text-slate-500">Invoice Capture</p>
        </div>

        {error && <div className="rounded bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Client ID</label>
          <input className={input} value={clientId} onChange={(e) => setClientId(e.target.value)}
            autoFocus required autoComplete="off" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
          <input className={input} value={username} onChange={(e) => setUsername(e.target.value)}
            required autoComplete="username" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <PasswordInput className={input} value={password}
            onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <button
          disabled={loading}
          className="w-full rounded bg-indigo-600 text-white py-2 font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}