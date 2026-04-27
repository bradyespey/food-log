import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext, useContext, useEffect, useMemo, useState,
} from 'react';
import { useColorScheme } from 'react-native';

export type AppearancePreference = 'system' | 'light' | 'dark';
type ResolvedAppearance = 'light' | 'dark';

const STORAGE_KEY = 'foodlog_appearance_preference';

const light = {
  mode: 'light' as ResolvedAppearance,
  bg: '#fafaf7',
  surface: '#fff',
  surfaceAlt: '#f5f3ec',
  surfaceSoft: '#faf8f1',
  text: '#111',
  textMuted: '#666',
  textSubtle: '#888',
  border: '#ebe9e2',
  borderSoft: '#f0eee8',
  input: '#fff',
  chip: '#fff',
  chipActive: '#1d1d1b',
  chipActiveText: '#fff',
  primary: '#c06030',
  primaryText: '#fff',
  destructive: '#c0392b',
  success: '#1d7a4a',
  warning: '#8a6a00',
  disabled: '#ddd',
  overlay: 'rgba(0,0,0,0.4)',
  shadow: '#000',
};

const dark = {
  mode: 'dark' as ResolvedAppearance,
  bg: '#11110f',
  surface: '#1c1b18',
  surfaceAlt: '#27251f',
  surfaceSoft: '#222019',
  text: '#f5f1e9',
  textMuted: '#c8c1b5',
  textSubtle: '#9b9386',
  border: '#343027',
  borderSoft: '#2b2822',
  input: '#171613',
  chip: '#1c1b18',
  chipActive: '#f5f1e9',
  chipActiveText: '#11110f',
  primary: '#d2733c',
  primaryText: '#fff',
  destructive: '#f87171',
  success: '#5bd28b',
  warning: '#e8c65f',
  disabled: '#3a362e',
  overlay: 'rgba(0,0,0,0.62)',
  shadow: '#000',
};

export type AppTheme = typeof light;

interface ThemeContextValue {
  appearance: AppearancePreference;
  resolvedAppearance: ResolvedAppearance;
  setAppearance: (appearance: AppearancePreference) => Promise<void>;
  theme: AppTheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [appearance, setAppearanceState] = useState<AppearancePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setAppearanceState(stored);
        }
      })
      .catch((error) => console.warn('Failed to load appearance preference', error));
  }, []);

  const setAppearance = async (next: AppearancePreference) => {
    setAppearanceState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      console.warn('Failed to save appearance preference', error);
    }
  };

  const resolvedAppearance: ResolvedAppearance = appearance === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : appearance;

  const value = useMemo(() => ({
    appearance,
    resolvedAppearance,
    setAppearance,
    theme: resolvedAppearance === 'dark' ? dark : light,
  }), [appearance, resolvedAppearance]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
