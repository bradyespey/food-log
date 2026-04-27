import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Tone = 'neutral' | 'primary' | 'success' | 'warn' | 'danger';

interface PillProps {
  tone?: Tone;
  children: React.ReactNode;
}

const TONES: Record<Tone, { bg: string; fg: string; border: string }> = {
  neutral: { bg: '#f1efe8', fg: '#666', border: '#e6e3d9' },
  primary: { bg: '#fdf3ec', fg: '#b85d25', border: '#f0cdb0' },
  success: { bg: '#edfaf3', fg: '#1d7a4a', border: '#b0dfc3' },
  warn:    { bg: '#fefaec', fg: '#8a6a00', border: '#e8d88a' },
  danger:  { bg: '#fdf0ee', fg: '#c0392b', border: '#f0bdb8' },
};

export default function Pill({ tone = 'neutral', children }: PillProps) {
  const { resolvedAppearance } = useTheme();
  const t = resolvedAppearance === 'dark'
    ? darkTone(tone)
    : TONES[tone];
  return (
    <View style={[s.pill, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[s.text, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

function darkTone(tone: Tone) {
  const tones: Record<Tone, { bg: string; fg: string; border: string }> = {
    neutral: { bg: '#27251f', fg: '#c8c1b5', border: '#3a362e' },
    primary: { bg: '#3a2418', fg: '#f0a06d', border: '#67402a' },
    success: { bg: '#173424', fg: '#71dda1', border: '#2e6947' },
    warn: { bg: '#372d12', fg: '#f0d16d', border: '#6a5722' },
    danger: { bg: '#3a1f1f', fg: '#ff8a8a', border: '#6a3838' },
  };
  return tones[tone];
}

const s = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
