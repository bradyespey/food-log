//src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/Layout/Layout'
import { LoginPage } from './pages/LoginPage'
import { AuthCallback } from './pages/AuthCallback'
import FoodLogPage from './pages/FoodLogPage'
import ManualPage from './pages/ManualPage'
import { ThemeProvider } from './components/ThemeProvider'
import React, { createContext, useContext, useState } from 'react'

// Create a context for sample data loading and clearing
const SampleDataContext = createContext<{
  loadSampleData: () => void;
  setLoadSampleData: (fn: () => void) => void;
  clearData: () => void;
  setClearData: (fn: () => void) => void;
  addFoodEntry: () => void;
  setAddFoodEntry: (fn: () => void) => void;
}>({
  loadSampleData: () => {},
  setLoadSampleData: () => {},
  clearData: () => {},
  setClearData: () => {},
  addFoodEntry: () => {},
  setAddFoodEntry: () => {},
});

export const useSampleData = () => useContext(SampleDataContext);


// Provider component
function SampleDataProvider({ children }: { children: React.ReactNode }) {
  const [loadSampleDataFn, setLoadSampleDataFn] = useState<(() => void) | null>(null);
  const [clearDataFn, setClearDataFn] = useState<(() => void) | null>(null);
  const [addFoodEntryFn, setAddFoodEntryFn] = useState<(() => void) | null>(null);

  const loadSampleData = () => {
    if (loadSampleDataFn) {
      loadSampleDataFn();
    }
  };

  const setLoadSampleData = (fn: () => void) => {
    setLoadSampleDataFn(() => fn);
  };

  const clearData = () => {
    if (clearDataFn) {
      clearDataFn();
    }
  };

  const setClearData = (fn: () => void) => {
    setClearDataFn(() => fn);
  };

  const addFoodEntry = () => {
    if (addFoodEntryFn) {
      addFoodEntryFn();
    }
  };

  const setAddFoodEntry = (fn: () => void) => {
    setAddFoodEntryFn(() => fn);
  };

  return (
    <SampleDataContext.Provider value={{ loadSampleData, setLoadSampleData, clearData, setClearData, addFoodEntry, setAddFoodEntry }}>
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

// Wrapper component for manual page to handle sample data loading
function ManualWrapper() {
  const { loadSampleData } = useSampleData();
  
  return (
    <Layout onLoadSample={loadSampleData}>
      <ManualPage />
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="foodlog-theme">
      <BrowserRouter>
        <AuthProvider>
          <SampleDataProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected / Demo Accessible */}
            <Route
              path="/dashboard"
              element={
                <DashboardWrapper />
              }
            />
            <Route
              path="/manual"
              element={
                <ManualWrapper />
              }
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </SampleDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App