//src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/Layout/Layout'
import { ThemeProvider } from './components/ThemeProvider'
import React, { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState } from 'react'
import { LoseItProvider, useLoseIt } from './contexts/LoseItContext'
import { LoseItSettings } from './components/LoseItSettings'

const FoodLogPage = lazy(() => import('./pages/FoodLogPage'))
const ManualPage = lazy(() => import('./pages/ManualPage'))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const AuthCallback = lazy(() => import('./pages/AuthCallback').then((module) => ({ default: module.AuthCallback })))

// Create a context for sample data loading and clearing
const SampleDataContext = createContext<{
  loadSampleData: () => void;
  setLoadSampleData: (fn: () => void) => void;
  clearData: () => void;
  setClearData: (fn: () => void) => void;
  addFoodEntry: () => void;
  setAddFoodEntry: (fn: () => void) => void;
  runControls: RunControls | null;
  setRunControls: (controls: RunControls | null) => void;
}>({
  loadSampleData: () => {},
  setLoadSampleData: () => {},
  clearData: () => {},
  setClearData: () => {},
  addFoodEntry: () => {},
  setAddFoodEntry: () => {},
  runControls: null,
  setRunControls: () => {},
});

export const useSampleData = () => useContext(SampleDataContext);

export interface RunControls {
  readyCount: number;
  photoCount: number;
  resultCount: number;
  verifiedCount: number;
  estimatedCost: number;
  logWater: boolean;
  setLogWater: (value: boolean) => void;
  analyzeLabel: string;
  logLabel: string;
  canAnalyze: boolean;
  canLog: boolean;
  isAnalyzing: boolean;
  isLogging: boolean;
  showLogButton: boolean;
  onAnalyze: () => void;
  onLog: () => void;
}

// Provider component
function SampleDataProvider({ children }: { children: React.ReactNode }) {
  const [loadSampleDataFn, setLoadSampleDataFn] = useState<(() => void) | null>(null);
  const [clearDataFn, setClearDataFn] = useState<(() => void) | null>(null);
  const [addFoodEntryFn, setAddFoodEntryFn] = useState<(() => void) | null>(null);
  const [runControls, setRunControls] = useState<RunControls | null>(null);

  const loadSampleData = useCallback(() => {
    if (loadSampleDataFn) {
      loadSampleDataFn();
    }
  }, [loadSampleDataFn]);

  const setLoadSampleData = useCallback((fn: () => void) => {
    setLoadSampleDataFn(() => fn);
  }, []);

  const clearData = useCallback(() => {
    if (clearDataFn) {
      clearDataFn();
    }
  }, [clearDataFn]);

  const setClearData = useCallback((fn: () => void) => {
    setClearDataFn(() => fn);
  }, []);

  const addFoodEntry = useCallback(() => {
    if (addFoodEntryFn) {
      addFoodEntryFn();
    }
  }, [addFoodEntryFn]);

  const setAddFoodEntry = useCallback((fn: () => void) => {
    setAddFoodEntryFn(() => fn);
  }, []);

  const contextValue = useMemo(() => ({
    loadSampleData,
    setLoadSampleData,
    clearData,
    setClearData,
    addFoodEntry,
    setAddFoodEntry,
    runControls,
    setRunControls,
  }), [
    loadSampleData,
    setLoadSampleData,
    clearData,
    setClearData,
    addFoodEntry,
    setAddFoodEntry,
    runControls,
  ]);

  return (
    <SampleDataContext.Provider value={contextValue}>
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
          <LoseItProvider>
          <SampleDataProvider>
          <LoseItModalHost />
          <Suspense fallback={<div className="app-bg min-h-screen p-6 text-sm text-muted-foreground">Loading FoodLog...</div>}>
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
          </Suspense>
          </SampleDataProvider>
          </LoseItProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

function LoseItModalHost() {
  const { showSettings } = useLoseIt()
  return showSettings ? <LoseItSettings /> : null
}

export default App
