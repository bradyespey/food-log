import { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import Pill from '../components/Pill';
import Icon from '../components/Icon';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
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
        <Section title="Account">
          <Row label="Signed in as">
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.rowVal}>{user?.displayName ?? '—'}</Text>
              <Text style={s.rowValSub}>{user?.email ?? ''}</Text>
            </View>
          </Row>
          <ActionRow label="Sign out" onPress={handleSignOut} />
        </Section>

        <Section title="Lose It!">
          <Row label="Connection">
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
                placeholder="LIS=…"
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
                Open Lose It! in Safari → DevTools → Network → any /web/service request → copy Cookie header.
              </Text>
            </View>
          )}
        </Section>

        <Section title="App">
          <Row label="Version">
            <Text style={s.rowValSub}>v0.1.0</Text>
          </Row>
        </Section>

        <Text style={s.footnote}>
          Drafts sync via Firestore. Photos stay on your device. Analyze + Log call your existing OpenAI and Lose It! endpoints — same backend as the web app.
        </Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ActionRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <Text style={[s.rowLabel, { color: '#c06030', fontWeight: '600' }]}>{label}</Text>
      <Icon name="chevron" size={16} color="#bbb" />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafaf7' },
  header: { paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ebe9e2' },
  h1: { fontSize: 26, fontWeight: '700', color: '#111', letterSpacing: -0.3 },
  body: { flex: 1 },
  section: { marginTop: 18, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 4, paddingBottom: 6 },
  sectionBody: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#ebe9e2', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, borderBottomWidth: 1, borderBottomColor: '#f0eee8' },
  rowLabel: { fontSize: 14, color: '#111' },
  rowVal: { fontSize: 14, color: '#111', fontWeight: '600' },
  rowValSub: { fontSize: 12, color: '#888' },
  cookieBox: { padding: 14, backgroundColor: '#fff' },
  cookieLabel: { fontSize: 11, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  cookieInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, fontSize: 12, fontFamily: 'Courier', minHeight: 70, backgroundColor: '#fafaf7', textAlignVertical: 'top' },
  cookieActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  cookieCancel: { backgroundColor: '#f1efe8', borderWidth: 1, borderColor: '#e6e3d9', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  cookieCancelText: { fontSize: 13, fontWeight: '600', color: '#444' },
  cookieSave: { backgroundColor: '#1d1d1b', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 16 },
  cookieSaveText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  cookieHint: { fontSize: 11, color: '#888', marginTop: 8, lineHeight: 16 },
  footnote: { padding: 24, fontSize: 11, color: '#888', lineHeight: 16, textAlign: 'center' },
});
