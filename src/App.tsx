//src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth } from './components/Layout/RequireAuth'
import { Layout } from './components/Layout/Layout'
import { LoginPage } from './pages/LoginPage'
import { AuthCallback } from './pages/AuthCallback'
import FoodLogPage from './pages/FoodLogPage'
import ManualPage from './pages/ManualPage'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="foodlog-theme">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected */}
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Layout><FoodLogPage /></Layout>
                </RequireAuth>
              }
            />
            <Route
              path="/manual"
              element={
                <RequireAuth>
                  <Layout><ManualPage /></Layout>
                </RequireAuth>
              }
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to={window.location.pathname.toLowerCase()} replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App