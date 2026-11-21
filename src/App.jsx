import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import ClientProtectedRoute from './components/ClientProtectedRoute'
import ClientLogin from './pages/ClientLogin'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Users from './pages/Users'

export default function App() {
  return (
    <Routes>
      {/* client users */}
      <Route path="/" element={<ClientLogin />} />
      <Route path="/dashboard" element={<ClientProtectedRoute><Dashboard /></ClientProtectedRoute>} />

      {/* superadmin */}
      <Route path="/login/suser" element={<Login />} />
      <Route path="/login" element={<Navigate to="/login/suser" replace />} />
      <Route path="/admin" element={<ProtectedRoute><Users /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}