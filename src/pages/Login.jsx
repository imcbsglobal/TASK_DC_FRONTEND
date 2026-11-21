import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import PasswordInput from '../components/PasswordInput'

export default function Login() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/admin" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-xl shadow p-8 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Superadmin Login</h1>
          <p className="text-sm text-slate-500">Manage mobile app users</p>
        </div>

        {error && <div className="rounded bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
          <input
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <PasswordInput
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
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