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
import { createContext, useContext, useState } from 'react'

// Create a context for sample data loading
const SampleDataContext = createContext<{
  loadSampleData: () => void;
  setLoadSampleData: (fn: () => void) => void;
}>({
  loadSampleData: () => {},
  setLoadSampleData: () => {},
});

export const useSampleData = () => useContext(SampleDataContext);


// Provider component
function SampleDataProvider({ children }: { children: React.ReactNode }) {
  const [loadSampleDataFn, setLoadSampleDataFn] = useState<(() => void) | null>(null);

  const loadSampleData = () => {
    if (loadSampleDataFn) {
      loadSampleDataFn();
    }
  };

  const setLoadSampleData = (fn: () => void) => {
    setLoadSampleDataFn(() => fn);
  };

  return (
    <SampleDataContext.Provider value={{ loadSampleData, setLoadSampleData }}>
      {children}
    </SampleDataContext.Provider>
  );
}

// Wrapper component for dashboard to handle sample data loading
function DashboardWrapper() {
  const { loadSampleData } = useSampleData();
  
  return (
    <Layout onLoadSample={loadSampleData}>
      <FoodLogPage />
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="foodlog-theme">
      <BrowserRouter>
        <AuthProvider>
          <SampleDataProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected */}
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardWrapper />
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
          </SampleDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App