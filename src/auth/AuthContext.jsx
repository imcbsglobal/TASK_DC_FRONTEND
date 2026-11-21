import { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'))
  const [username, setUsername] = useState(() => localStorage.getItem('admin_username'))

  const login = async (u, p) => {
    const { data } = await api.post('/superadmin/login/', { username: u, password: p })
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_username', data.username)
    setToken(data.token)
    setUsername(data.username)
  }

  const logout = async () => {
    try { await api.post('/superadmin/logout/') } catch { /* ignore */ }
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_username')
    setToken(null)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ token, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)