import { createContext, useContext, useState } from 'react'
import clientApi from '../api/clientApi'

const ClientAuthContext = createContext(null)

function readUser() {
  try { return JSON.parse(localStorage.getItem('client_user')) } catch { return null }
}

export function ClientAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('client_token'))
  const [user, setUser] = useState(readUser)

  const login = async (client_id, username, password) => {
    const { data } = await clientApi.post('/auth/login/', { client_id, username, password })
    localStorage.setItem('client_token', data.token)
    localStorage.setItem('client_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }

  const logout = async () => {
    try { await clientApi.post('/auth/logout/') } catch { /* ignore */ }
    localStorage.removeItem('client_token')
    localStorage.removeItem('client_user')
    setToken(null)
    setUser(null)
  }

  return (
    <ClientAuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </ClientAuthContext.Provider>
  )
}

export const useClientAuth = () => useContext(ClientAuthContext)