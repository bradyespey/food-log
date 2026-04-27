// Loading screen shown while food-analyze is running.

import { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDrafts } from '../context/DraftsContext';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Analyzing'>;

const PHASES = [
  'Reading your description…',
  'Analyzing photos…',
  'Estimating portions…',
  'Looking up nutrition…',
  'Almost done…',
];

export default function AnalyzingScreen({ route, navigation }: Props) {
  const { draftId } = route.params;
  const { localPhotos } = useDrafts();
  const photos = localPhotos[draftId] ?? [];

  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => Math.min(p + 1, PHASES.length - 1)), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={s.root}>
      <TouchableOpacity style={s.cancel} onPress={() => navigation.goBack()}>
        <Text style={s.cancelText}>Cancel</Text>
      </TouchableOpacity>

      <View style={s.center}>
        <View style={s.photoStack}>
          {photos.slice(0, 3).map((p, i) => (
            <Image
              key={p.id}
              source={{ uri: p.uri }}
              style={[s.photo, { transform: [{ rotate: `${(i - 1) * 4}deg` }], zIndex: 3 - i }]}
            />
          ))}
          {photos.length === 0 && (
            <View style={s.noPhoto}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          )}
        </View>

        <Text style={s.title}>Analyzing your meal</Text>
        <Text style={s.phase}>{PHASES[phase]}</Text>

        <View style={s.dots}>
          <Dot delay={0} /><Dot delay={200} /><Dot delay={400} />
        </View>
      </View>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const [up, setUp] = useState(false);
  useEffect(() => {
    const init = setTimeout(() => {
      setUp(true);
      const t = setInterval(() => setUp((v) => !v), 1000);
      return () => clearInterval(t);
    }, delay);
    return () => clearTimeout(init);
  }, [delay]);
  return <View style={[s.dot, { transform: [{ translateY: up ? -4 : 0 }], opacity: up ? 1 : 0.4 }]} />;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a18', alignItems: 'center', justifyContent: 'center' },
  cancel: { position: 'absolute', top: 64, right: 18, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingVertical: 6, paddingHorizontal: 14 },
  cancelText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  center: { alignItems: 'center', padding: 30 },
  photoStack: { position: 'relative', width: 160, height: 160, marginBottom: 30 },
  photo: { position: 'absolute', top: 0, left: 0, width: 160, height: 160, borderRadius: 16, borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)' },
  noPhoto: { width: 160, height: 160, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  phase: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
});
