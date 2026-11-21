import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import PasswordInput from '../components/PasswordInput'

const PAGE_SIZE = 50
const empty = { client_id: '', username: '', full_name: '', password: '', is_active: true }

function errorText(err) {
  const d = err.response?.data
  if (!d) return 'Could not reach the server.'
  if (d.detail) return d.detail
  return Object.entries(d).map(([k, v]) => `${k}: ${[].concat(v).join(' ')}`).join(' | ')
}

export default function Users() {
  const { username, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // null | { user: obj|null }
  const [shown, setShown] = useState({})

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/superadmin/client-users/', { params: { page, search: query } })
      setUsers(data.results)
      setCount(data.count)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setLoading(false)
    }
  }, [page, query])

  useEffect(() => { load() }, [load])

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.client_id}/${u.username}?`)) return
    try {
      await api.delete(`/superadmin/client-users/${u.id}/`)
      load()
    } catch (err) {
      setError(errorText(err))
    }
  }

  const toggleActive = async (u) => {
    try {
      await api.patch(`/superadmin/client-users/${u.id}/`, { is_active: !u.is_active })
      load()
    } catch (err) {
      setError(errorText(err))
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">Mobile App Users</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">Signed in as <b>{username}</b></span>
            <button onClick={logout} className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <input
            placeholder="Search client ID, username, name..."
            className="w-full sm:w-80 rounded border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => setModal({ user: null })}
            className="rounded bg-indigo-600 text-white px-4 py-2 font-medium hover:bg-indigo-700"
          >
            + Add User
          </button>
        </div>

        {error && <div className="rounded bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3">Client ID</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Full name</th>
                <th className="px-4 py-3">Password</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">No users found.</td></tr>
              )}
              {!loading && users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{u.client_id}</td>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3">{u.full_name || '-'}</td>
                  <td className="px-4 py-3 font-mono">
                    {u.password_plain ? (
                        <span className="inline-flex items-center gap-2">
                        <span>{shown[u.id] ? u.password_plain : '••••••••'}</span>
                        <button
                            type="button"
                            onClick={() => setShown((s) => ({ ...s, [u.id]: !s[u.id] }))}
                            className="font-sans text-xs text-indigo-600 hover:underline"
                        >
                            {shown[u.id] ? 'Hide' : 'Show'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(u.password_plain)}
                            className="font-sans text-xs text-slate-500 hover:underline"
                        >
                            Copy
                        </button>
                        </span>
                    ) : (
                        <span className="font-sans text-xs text-slate-400">Not stored, re-save to set</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => setModal({ user: u })} className="text-indigo-600 hover:underline">Edit</button>
                    <button onClick={() => remove(u)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{count} user{count === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40">Prev</button>
            <span>Page {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40">Next</button>
          </div>
        </div>
      </main>

      {modal && (
        <UserModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

function UserModal({ user, onClose, onSaved }) {
  const editing = !!user
  const [form, setForm] = useState(
    editing ? { ...empty, ...user, password: '' } : empty
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [info, setInfo] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [lookupError, setLookupError] = useState('')

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
    if (k === 'client_id') { setInfo(null); setLookupError('') }
  }

  const fetchClient = async () => {
    const id = form.client_id.trim()
    if (!id) return
    setFetching(true)
    setInfo(null)
    setLookupError('')
    try {
      const { data } = await api.get('/superadmin/client-lookup/', { params: { client_id: id } })
      setInfo(data)
      setForm((f) => ({ ...f, client_id: data.client_id }))
    } catch (err) {
      setLookupError(errorText(err))
    } finally {
      setFetching(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      client_id: form.client_id.trim(),
      username: form.username.trim(),
      full_name: form.full_name.trim(),
      is_active: form.is_active,
    }
    if (form.password) payload.password = form.password
    try {
      if (editing) await api.patch(`/superadmin/client-users/${user.id}/`, payload)
      else await api.post('/superadmin/client-users/', payload)
      onSaved()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const licenseBad = info && (info.status !== 'Active' || info.is_expired)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-10">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-4 max-h-[95vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">{editing ? 'Edit user' : 'Add user'}</h2>

        {error && <div className="rounded bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">Client ID</label>
          <div className="flex gap-2">
            <input
              className={input} value={form.client_id} onChange={set('client_id')} required
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchClient() } }}
            />
            <button
              type="button" onClick={fetchClient}
              disabled={fetching || !form.client_id.trim()}
              className="rounded bg-slate-800 text-white px-4 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 whitespace-nowrap"
            >
              {fetching ? 'Fetching...' : 'Fetch'}
            </button>
          </div>

          {lookupError && (
            <div className="mt-2 rounded bg-red-50 text-red-700 text-sm px-3 py-2">{lookupError}</div>
          )}

          {info && (
            <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">{info.customer_name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  licenseBad ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {info.is_expired ? 'Expired' : info.status}
                </span>
              </div>
              <div className="text-slate-600">Package: {info.package}</div>
              <div className="text-slate-600">License key: {info.license_key}</div>
              <div className="text-slate-600">
                Valid until {info.expiry_date} ({info.remaining_days} days left)
              </div>
              <div className="text-slate-600">
                Devices: {info.registered_devices} / {info.max_devices}
              </div>
              {licenseBad && (
                <div className="text-red-600 font-medium">This license is not active.</div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input className={input} value={form.username} onChange={set('username')} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input className={input} value={form.full_name} onChange={set('full_name')} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Password {editing && <span className="text-slate-400 font-normal">(leave blank to keep current)</span>}
          </label>
          <PasswordInput
            className={input} value={form.password} onChange={set('password')}
            required={!editing} minLength={6} autoComplete="new-password"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={set('is_active')} />
          Active
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2">Cancel</button>
          <button disabled={saving} className="rounded bg-indigo-600 text-white px-4 py-2 font-medium disabled:opacity-60">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}