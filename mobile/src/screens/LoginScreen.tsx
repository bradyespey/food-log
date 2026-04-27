import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme, type AppTheme } from '../context/ThemeContext';

export default function LoginScreen() {
  const { signIn, signingIn, error } = useAuth();
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.brand}>
        <Text style={s.logo}>🍎</Text>
        <Text style={s.brandName}>FoodLog</Text>
        <Text style={s.tagline}>Capture, analyze & log meals on the go.</Text>
      </View>

      <View style={s.bottom}>
        <TouchableOpacity
          style={[s.btn, signingIn && s.btnDisabled]}
          onPress={signIn}
          disabled={signingIn}
          accessibilityRole="button"
        >
          {signingIn ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <>
              <GoogleGlyph />
              <Text style={s.btnText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Text style={s.fineprint}>Authorized accounts only · email allowlist</Text>
      </View>
    </SafeAreaView>
  );
}

function GoogleGlyph() {
  return (
    <View style={{ width: 18, height: 18, marginRight: 10 }}>
      {/* Simple "G" colored text as a stand-in — native Google icon would require an asset */}
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#4285F4' }}>G</Text>
    </View>
  );
}

const styles = (theme: AppTheme) => StyleSheet.create({
  root: {
    flex: 1, backgroundColor: theme.surface,
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 32, paddingTop: 60, paddingBottom: 80,
  },
  brand: { alignItems: 'center', marginTop: 40 },
  logo: { fontSize: 70, marginBottom: 18 },
  brandName: { fontSize: 36, fontWeight: '700', color: theme.text, letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: theme.textSubtle, marginTop: 8, textAlign: 'center', lineHeight: 22, maxWidth: 240 },
  bottom: { width: '100%', alignItems: 'center', gap: 12 },
  btn: {
    width: '100%', maxWidth: 320, height: 50,
    borderWidth: 1, borderColor: theme.border, borderRadius: 12,
    backgroundColor: theme.input, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: theme.shadow, shadowOpacity: 0.08, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: theme.text, fontSize: 16, fontWeight: '600' },
  error: { color: theme.destructive, textAlign: 'center', fontSize: 13 },
  fineprint: { fontSize: 11, color: theme.textSubtle },
});
