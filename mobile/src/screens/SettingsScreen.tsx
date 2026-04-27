import { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme, type AppTheme, type AppearancePreference } from '../context/ThemeContext';
import Pill from '../components/Pill';
import Icon from '../components/Icon';

const APPEARANCE_OPTIONS: { label: string; value: AppearancePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { appearance, resolvedAppearance, setAppearance, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const s = styles(theme);
  const [editingCookie, setEditingCookie] = useState(false);
  const [cookieDraft, setCookieDraft] = useState('');

  const handleSignOut = () => {
    Alert.alert('Sign out?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.h1}>Settings</Text>
      </View>

      <ScrollView style={s.body}>
        <Section title="Account" s={s}>
          <Row label="Signed in as" s={s}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.rowVal}>{user?.displayName ?? '-'}</Text>
              <Text style={s.rowValSub}>{user?.email ?? ''}</Text>
            </View>
          </Row>
          <ActionRow label="Sign out" onPress={handleSignOut} />
        </Section>

        <Section title="Lose It!" s={s}>
          <Row label="Connection" s={s}>
            <Pill tone="success">Connected</Pill>
          </Row>
          {!editingCookie ? (
            <ActionRow label="Update session cookie" onPress={() => { setCookieDraft(''); setEditingCookie(true); }} />
          ) : (
            <View style={s.cookieBox}>
              <Text style={s.cookieLabel}>Paste session cookie</Text>
              <TextInput
                style={s.cookieInput}
                multiline
                autoFocus
                value={cookieDraft}
                onChangeText={setCookieDraft}
                placeholder="LIS=..."
                placeholderTextColor={theme.textSubtle}
              />
              <View style={s.cookieActions}>
                <TouchableOpacity style={s.cookieCancel} onPress={() => setEditingCookie(false)}>
                  <Text style={s.cookieCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.cookieSave, !cookieDraft.trim() && { opacity: 0.4 }]}
                  disabled={!cookieDraft.trim()}
                  onPress={() => setEditingCookie(false)}
                >
                  <Text style={s.cookieSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.cookieHint}>
                Open Lose It! in Safari, then copy the Cookie header from any /web/service request in DevTools.
              </Text>
            </View>
          )}
        </Section>

        <Section title="App" s={s}>
          <Row label="Appearance" s={s}>
            <View style={s.segmented}>
              {APPEARANCE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[s.segment, appearance === option.value && s.segmentActive]}
                  onPress={() => void setAppearance(option.value)}
                >
                  <Text style={[s.segmentText, appearance === option.value && s.segmentTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Row>
          <Row label="Active mode" s={s}>
            <Text style={s.rowValSub}>{resolvedAppearance === 'dark' ? 'Dark' : 'Light'}</Text>
          </Row>
          <Row label="Version" s={s}>
            <Text style={s.rowValSub}>v0.1.0</Text>
          </Row>
        </Section>

        <Text style={s.footnote}>
          Drafts sync via Firestore. Photos stay on your device. Analyze + Log call your existing OpenAI and Lose It! endpoints - same backend as the web app.
        </Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, s }: {
  title: string; children: React.ReactNode; s: ReturnType<typeof styles>;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, children, s }: {
  label: string; children: React.ReactNode; s: ReturnType<typeof styles>;
}) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ActionRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <Text style={[s.rowLabel, { color: theme.primary, fontWeight: '600' }]}>{label}</Text>
      <Icon name="chevron" size={16} color={theme.textSubtle} />
    </TouchableOpacity>
  );
}

const styles = (theme: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: { paddingHorizontal: 20, paddingBottom: 14, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
  h1: { fontSize: 26, fontWeight: '700', color: theme.text, letterSpacing: -0.3 },
  body: { flex: 1 },
  section: { marginTop: 18, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: theme.textSubtle, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 4, paddingBottom: 6 },
  sectionBody: { backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, borderBottomWidth: 1, borderBottomColor: theme.borderSoft, gap: 12 },
  rowLabel: { fontSize: 14, color: theme.text },
  rowVal: { fontSize: 14, color: theme.text, fontWeight: '600' },
  rowValSub: { fontSize: 12, color: theme.textSubtle },
  cookieBox: { padding: 14, backgroundColor: theme.surface },
  cookieLabel: { fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  cookieInput: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 8, fontSize: 12, fontFamily: 'Courier', minHeight: 70, backgroundColor: theme.input, color: theme.text, textAlignVertical: 'top' },
  cookieActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  cookieCancel: { backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  cookieCancelText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  cookieSave: { backgroundColor: theme.chipActive, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 16 },
  cookieSaveText: { fontSize: 13, fontWeight: '600', color: theme.chipActiveText },
  cookieHint: { fontSize: 11, color: theme.textSubtle, marginTop: 8, lineHeight: 16 },
  segmented: { flexDirection: 'row', borderWidth: 1, borderColor: theme.border, borderRadius: 9, overflow: 'hidden', backgroundColor: theme.surfaceAlt },
  segment: { paddingVertical: 6, paddingHorizontal: 10 },
  segmentActive: { backgroundColor: theme.chipActive },
  segmentText: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  segmentTextActive: { color: theme.chipActiveText },
  footnote: { padding: 24, fontSize: 11, color: theme.textSubtle, lineHeight: 16, textAlign: 'center' },
});
