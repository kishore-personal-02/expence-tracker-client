import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { PreferencesProvider } from './context/PreferencesContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Import from './pages/Import'
import './App.css'

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

// Sub-path deploys need a router basename to match VITE_BASE (e.g. /expense-tracker/)
const base = import.meta.env.VITE_BASE || '/'
const routerBasename = base === '/' ? '/' : base.replace(/\/+$/, '')

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PreferencesProvider>
          <BrowserRouter basename={routerBasename}>
            <Navbar />
            <main className="app-main">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/import"
                  element={
                    <ProtectedRoute>
                      <Import />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </BrowserRouter>
        </PreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
