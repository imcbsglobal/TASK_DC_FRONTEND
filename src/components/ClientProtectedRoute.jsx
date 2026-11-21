import { Navigate } from 'react-router-dom'
import { useClientAuth } from '../auth/ClientAuthContext'

export default function ClientProtectedRoute({ children }) {
  const { token } = useClientAuth()
  return token ? children : <Navigate to="/" replace />
}