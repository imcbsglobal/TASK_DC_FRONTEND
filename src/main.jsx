import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ClientAuthProvider } from './auth/ClientAuthContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ClientAuthProvider>
          <App />
        </ClientAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)