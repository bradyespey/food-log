import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn, signingIn, error } = useAuth();

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
            <ActivityIndicator color="#1d1d1b" />
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

const s = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 32, paddingTop: 60, paddingBottom: 80,
  },
  brand: { alignItems: 'center', marginTop: 40 },
  logo: { fontSize: 70, marginBottom: 18 },
  brandName: { fontSize: 36, fontWeight: '700', color: '#1d1d1b', letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: '#888', marginTop: 8, textAlign: 'center', lineHeight: 22, maxWidth: 240 },
  bottom: { width: '100%', alignItems: 'center', gap: 12 },
  btn: {
    width: '100%', maxWidth: 320, height: 50,
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    backgroundColor: '#fff', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#1d1d1b', fontSize: 16, fontWeight: '600' },
  error: { color: '#c00', textAlign: 'center', fontSize: 13 },
  fineprint: { fontSize: 11, color: '#aaa' },
});
