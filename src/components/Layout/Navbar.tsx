//src/components/Layout/Navbar.tsx

import { useLocation, useNavigate } from 'react-router-dom';
import {
  Camera,
  CheckCircle,
  ClipboardList,
  DollarSign,
  Droplets,
  Eraser,
  LogIn,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { useSampleData } from '../../App';
import { useLoseIt } from '../../contexts/LoseItContext';
import { ThemeMenu } from './ThemeMenu';

interface NavbarProps {
  onLoadSample?: () => void;
}

export function Navbar({ onLoadSample }: NavbarProps) {
  const { signOut, session } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { clearData, addFoodEntry, runControls, manualControls } = useSampleData();
  const { status: loseItStatus, openSettings } = useLoseIt();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { path: '/dashboard', label: 'AI Food Log', icon: Camera },
    { path: '/manual', label: 'Manual', icon: ClipboardList },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleShellAction = (action: (() => void) | undefined, closeAfterAction = false) => {
    action?.();
    if (closeAfterAction) closeMobileMenu();
  };

  const renderActionButtons = (closeAfterAction = false) => (
    <>
      {addFoodEntry && pathname === '/dashboard' && (
        <Button variant="outline" size="sm" onClick={() => handleShellAction(addFoodEntry, closeAfterAction)} className="w-full justify-start">
          <Plus className="mr-2 h-4 w-4" />
          Add Food Item
        </Button>
      )}
      {clearData && (
        <Button variant="outline" size="sm" onClick={() => handleShellAction(clearData, closeAfterAction)} className="w-full justify-start">
          <Eraser className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
      {onLoadSample && (
        <Button variant="outline" size="sm" onClick={() => handleShellAction(onLoadSample, closeAfterAction)} className="w-full justify-start">
          <Sparkles className="mr-2 h-4 w-4" />
          Sample Data
        </Button>
      )}
    </>
  );

  const runPanel = pathname === '/dashboard' && runControls ? (
    <div className="mt-5 space-y-3 rounded-lg border border-border bg-secondary/35 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Current Run</p>
          <div className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Analyze and Log
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5" />
          <span className="font-semibold text-foreground">${runControls.estimatedCost.toFixed(4)}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
        {[
          ['Ready', runControls.readyCount],
          ['Photos', runControls.photoCount],
          ['Results', runControls.resultCount],
          ['Verified', runControls.verifiedCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-card/60 px-2 py-2">
            <div className="font-semibold text-foreground">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <label htmlFor="sidebarLogWater" className="inline-flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2 text-sm font-semibold text-foreground">
        <span className="inline-flex items-center gap-2">
          <Droplets className="h-4 w-4 text-accent" />
          Water
        </span>
        <input
          id="sidebarLogWater"
          type="checkbox"
          checked={runControls.logWater}
          onChange={(event) => runControls.setLogWater(event.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
      </label>

      <Button
        onClick={runControls.onAnalyze}
        disabled={!runControls.canAnalyze}
        isLoading={runControls.isAnalyzing}
        leftIcon={<Sparkles className="h-4 w-4" />}
        className="w-full"
      >
        {runControls.analyzeLabel}
      </Button>

      {runControls.showLogButton && (
        <Button
          onClick={runControls.onLog}
          disabled={!runControls.canLog}
          isLoading={runControls.isLogging}
          variant="secondary"
          className="w-full"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {runControls.logLabel}
        </Button>
      )}
    </div>
  ) : null;

  const manualPanel = pathname === '/manual' && manualControls ? (
    <div className="mt-5 space-y-3 rounded-lg border border-border bg-secondary/35 p-3">
      <label htmlFor="sidebarManualLogWater" className="inline-flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2 text-sm font-semibold text-foreground">
        <span className="inline-flex items-center gap-2">
          <Droplets className="h-4 w-4 text-accent" />
          Water
        </span>
        <input
          id="sidebarManualLogWater"
          type="checkbox"
          checked={manualControls.logWater}
          onChange={(event) => manualControls.setLogWater(event.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
      </label>
    </div>
  ) : null;

  const settingsButton = session?.isAuthenticated ? (
    <button
      onClick={openSettings}
      title="Lose It! Settings"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/70 transition-colors hover:bg-secondary ${
        loseItStatus === 'expired' ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Settings className="w-4 h-4" />
    </button>
  ) : null;

  return (
    <>
      <aside className="fixed inset-y-4 left-4 z-20 hidden w-72 flex-col rounded-lg border border-border bg-card/90 p-4 shadow-sm backdrop-blur lg:flex">
        <button
          onClick={clearData}
          className="flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-secondary"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
            <img src="/foodlog-logo.png" alt="FoodLog AI" className="h-8 w-8" />
          </span>
          <span>
            <span className="font-display block text-2xl leading-none text-foreground">FoodLog AI</span>
          </span>
        </button>

        <nav className="mt-5 space-y-2">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex w-full items-center gap-3 rounded-full border px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive(path)
                  ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
                  : 'border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-6 space-y-2">
          {renderActionButtons(false)}
        </div>

        {runPanel}
        {manualPanel}

        <div className="mt-auto space-y-3 rounded-lg border border-border bg-secondary/50 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="h-4 w-4" />
            <span className="truncate">{session?.user?.email || 'Not signed in'}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeMenu side="top" align="start" className="h-9 w-9 shrink-0 px-0" />
            {settingsButton}
            {session?.isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={signOut} className="flex-1 whitespace-nowrap px-2">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/login')} className="flex-1 whitespace-nowrap px-2">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-3 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              clearData();
              closeMobileMenu();
            }}
            className="flex min-w-0 items-center gap-2 rounded-lg text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <img src="/foodlog-logo.png" alt="FoodLog AI" className="h-7 w-7" />
            </span>
            <span className="min-w-0">
              <span className="font-display block truncate text-xl leading-none text-foreground">FoodLog AI</span>
              <span className="block truncate text-[11px] font-semibold uppercase text-muted-foreground">
                {session?.isAuthenticated ? session.user?.email : 'Mobile food logging'}
              </span>
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            {settingsButton}
            <ThemeMenu className="h-9 w-9 px-0" />
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/70 text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Open main menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mt-3 rounded-lg border border-border bg-card/95 p-3 shadow-sm">
            <nav className="grid grid-cols-2 gap-2">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); closeMobileMenu(); }}
                  className={`flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive(path)
                      ? 'border-primary/30 bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
            <div className="mt-3 grid gap-2">
              {renderActionButtons(true)}
            </div>
            <div className="mt-3">
              {session?.isAuthenticated ? (
                <Button variant="outline" size="sm" onClick={signOut} className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => { navigate('/login'); closeMobileMenu(); }} className="w-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
