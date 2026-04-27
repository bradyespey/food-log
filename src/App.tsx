//src/App.tsx

import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/Layout/Layout'
import { ThemeProvider } from './components/ThemeProvider'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { LoseItProvider, useLoseIt } from './contexts/LoseItContext'
import { LoseItSettings } from './components/LoseItSettings'
import FoodLogPage from './pages/FoodLogPage'
import ManualPage from './pages/ManualPage'
import { LoginPage } from './pages/LoginPage'
import { AuthCallback } from './pages/AuthCallback'

export interface ManualControls {
  logWater: boolean;
  setLogWater: (value: boolean) => void;
}

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
  manualControls: ManualControls | null;
  setManualControls: (controls: ManualControls | null) => void;
}>({
  loadSampleData: () => {},
  setLoadSampleData: () => {},
  clearData: () => {},
  setClearData: () => {},
  addFoodEntry: () => {},
  setAddFoodEntry: () => {},
  runControls: null,
  setRunControls: () => {},
  manualControls: null,
  setManualControls: () => {},
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
  nextAction: 'analyze' | 'log';
  onAnalyze: () => void;
  onLog: () => void;
}

// Provider component
function SampleDataProvider({ children }: { children: React.ReactNode }) {
  const [loadSampleDataFn, setLoadSampleDataFn] = useState<(() => void) | null>(null);
  const [clearDataFn, setClearDataFn] = useState<(() => void) | null>(null);
  const [addFoodEntryFn, setAddFoodEntryFn] = useState<(() => void) | null>(null);
  const [runControls, setRunControls] = useState<RunControls | null>(null);
  const [manualControls, setManualControls] = useState<ManualControls | null>(null);

  const loadSampleData = useCallback(() => {
    if (loadSampleDataFn) loadSampleDataFn();
  }, [loadSampleDataFn]);

  const setLoadSampleData = useCallback((fn: () => void) => {
    setLoadSampleDataFn(() => fn);
  }, []);

  const clearData = useCallback(() => {
    if (clearDataFn) clearDataFn();
  }, [clearDataFn]);

  const setClearData = useCallback((fn: () => void) => {
    setClearDataFn(() => fn);
  }, []);

  const addFoodEntry = useCallback(() => {
    if (addFoodEntryFn) addFoodEntryFn();
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
    manualControls,
    setManualControls,
  }), [
    loadSampleData,
    setLoadSampleData,
    clearData,
    setClearData,
    addFoodEntry,
    setAddFoodEntry,
    runControls,
    manualControls,
  ]);

  return (
    <SampleDataContext.Provider value={contextValue}>
      {children}
    </SampleDataContext.Provider>
  );
}

function LoseItModalHost() {
  const { showSettings } = useLoseIt();
  return showSettings ? <LoseItSettings /> : null;
}

function DashboardWrapper() {
  const { loadSampleData } = useSampleData();
  return (
    <Layout onLoadSample={loadSampleData}>
      <FoodLogPage />
    </Layout>
  );
}

function ManualWrapper() {
  const { loadSampleData } = useSampleData();
  return (
    <Layout onLoadSample={loadSampleData}>
      <ManualPage />
    </Layout>
  );
}

const router = createBrowserRouter([
  { path: '/login',         element: <LoginPage /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  { path: '/dashboard',     element: <DashboardWrapper /> },
  { path: '/manual',        element: <ManualWrapper /> },
  { path: '/',              element: <Navigate to="/dashboard" replace /> },
  { path: '*',              element: <Navigate to="/dashboard" replace /> },
]);

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="foodlog-theme">
      <AuthProvider>
        <LoseItProvider>
          <SampleDataProvider>
            <LoseItModalHost />
            {/* unstable_useTransitions=false bypasses startTransition so navigation commits synchronously in React 19 */}
            <RouterProvider router={router} unstable_useTransitions={false} />
          </SampleDataProvider>
        </LoseItProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App
