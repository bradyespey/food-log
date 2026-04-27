// Draft detail — user reviews metadata (date, meal, brand, note) and triggers analysis.

import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Image, Alert, ActivityIndicator, Keyboard, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDrafts } from '../context/DraftsContext';
import Icon from '../components/Icon';
import type { RootStackParamList } from '../navigation';
import type { Meal } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DraftDetail'>;

const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const BRAND_OPTIONS = ['Homemade'];

export default function DraftDetailScreen({ route, navigation }: Props) {
  const { draftId } = route.params;
  const { drafts, draftsLoaded, localPhotos, updateDraft, removePhoto, runAnalyze } = useDrafts();
  const draft = drafts.find((d) => d.id === draftId);
  const photos = localPhotos[draftId] ?? [];

  const [analyzing, setAnalyzing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const noteRef = useRef<TextInput>(null);
  const [brand, setBrand] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setBrand(draft?.brand ?? '');
    setNote(draft?.note ?? '');
  }, [draftId, draft?.brand, draft?.note]);

  useEffect(() => {
    if (!draft) return;
    const timer = setTimeout(() => {
      if (brand !== (draft.brand ?? '') || note !== (draft.note ?? '')) {
        void updateDraft(draftId, { brand, note });
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [brand, note, draft, draftId, updateDraft]);

  // Show spinner while Firestore snapshot hasn't returned the new draft yet
  if (!draft) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf7' }}>
        {draftsLoaded
          ? <Text style={{ color: '#888', fontSize: 14 }}>Draft not found — go back and try again.</Text>
          : <ActivityIndicator size="large" color="#c06030" />
        }
      </View>
    );
  }

  // Photos alone are enough for analysis — brand/note help but aren't required
  const canAnalyze = photos.length > 0 || !!(brand || note);

  const draftDate = (() => {
    const parts = (draft.date ?? '').split('/');
    if (parts.length === 2) {
      const d = new Date();
      d.setMonth(parseInt(parts[0], 10) - 1);
      d.setDate(parseInt(parts[1], 10));
      return d;
    }
    return new Date();
  })();

  const syncDraftText = async (status?: 'pending' | 'analyzed') => {
    await updateDraft(draftId, { brand, note, ...(status ? { status } : {}) });
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setAnalyzing(true);
    navigation.replace('Analyzing', { draftId });
    try {
      await syncDraftText();
      await runAnalyze(draftId, { brand, note });
      navigation.replace('Review', { draftId });
    } catch (e) {
      await updateDraft(draftId, { status: 'pending', lastError: (e as Error).message });
      Alert.alert('Analysis failed', (e as Error).message);
      navigation.replace('DraftDetail', { draftId });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveForLater = async () => {
    await syncDraftText('pending');
    navigation.navigate('Tabs');
  };

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={s.headerWrap}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.navigate('Tabs')}>
            <Icon name="back" size={20} color="#444" />
          </TouchableOpacity>
          <Text style={s.headTitle}>Review meal</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
        {/* Photo strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoStrip}>
          {photos.map((p) => (
            <View key={p.id} style={s.photoTile}>
              <Image source={{ uri: p.uri }} style={s.photoImg} />
              <TouchableOpacity style={s.photoRemove} onPress={() => removePhoto(draftId, p.id)}>
                <Icon name="x" size={11} color="#fff" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={s.photoAdd} onPress={() => navigation.navigate('Capture', { draftId })}>
            <Icon name="plus" size={20} color="#888" />
            <Text style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Add</Text>
          </TouchableOpacity>
        </ScrollView>

        <FieldLabel label="Date" />
        <View style={s.dateRow}>
          <TouchableOpacity style={s.dateBtn} onPress={() => setShowDatePicker((open) => !open)}>
            <Text style={s.dateBtnText}>{draft.date ?? 'Select date'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.calendarBtn} onPress={() => setShowDatePicker((open) => !open)}>
            <Text style={s.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <View style={s.datePickerWrap}>
            <DateTimePicker
              value={draftDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              maximumDate={new Date()}
              onChange={(_, selected) => {
                setShowDatePicker(false);
                if (selected) {
                  const mm = String(selected.getMonth() + 1).padStart(2, '0');
                  const dd = String(selected.getDate()).padStart(2, '0');
                  void updateDraft(draftId, { date: `${mm}/${dd}` });
                }
              }}
            />
          </View>
        )}

        <FieldLabel label="Meal" />
        <View style={s.chipRow}>
          {MEALS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[s.chip, draft.meal === m && s.chipActive]}
              onPress={() => void updateDraft(draftId, { meal: m })}
            >
              <Text style={[s.chipText, draft.meal === m && s.chipTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FieldLabel label="Brand / Restaurant" />
        <View style={s.chipRow}>
          {BRAND_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[s.chip, brand === option && s.chipActive]}
              onPress={() => {
                setBrand(option);
                void updateDraft(draftId, { brand: option });
                requestAnimationFrame(() => noteRef.current?.focus());
              }}
            >
              <Text style={[s.chipText, brand === option && s.chipTextActive]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[s.input, { marginTop: 8 }]}
          value={brand}
          placeholder="e.g. Chipotle, Homemade"
          returnKeyType="next"
          onChangeText={setBrand}
          onBlur={() => void updateDraft(draftId, { brand, note })}
          onSubmitEditing={() => noteRef.current?.focus()}
        />

        <FieldLabel label="What did you eat?" />
        <TextInput
          ref={noteRef}
          style={[s.input, s.textarea]}
          multiline
          value={note}
          placeholder="Chicken sandwich, fries, ranch, half the appetizer…"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
          blurOnSubmit
          onChangeText={setNote}
          onBlur={() => void updateDraft(draftId, { brand, note })}
        />
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={s.footerWrap}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSaveForLater}>
          <Text style={s.saveBtnText}>Save for later</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.analyzeBtn, !canAnalyze && s.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={!canAnalyze || analyzing}
        >
          <Icon name="sparkle" size={16} color="#fff" strokeWidth={2} />
          <Text style={s.analyzeBtnText}>Analyze with AI</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={s.fieldLabel}>{label}</Text>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafaf7' },
  headerWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ebe9e2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1efe8', alignItems: 'center', justifyContent: 'center' },
  headTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  body: { flex: 1, padding: 16 },
  photoStrip: { marginBottom: 14 },
  photoTile: { position: 'relative', width: 86, height: 86, borderRadius: 10, overflow: 'hidden', backgroundColor: '#eee', marginRight: 8 },
  photoImg: { width: 86, height: 86 },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  photoAdd: { width: 86, height: 86, borderRadius: 10, backgroundColor: '#f5f3ec', borderWidth: 1.5, borderColor: '#d8d4c5', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 14, textAlign: 'center' },
  input: { padding: 11, borderRadius: 9, borderWidth: 1, borderColor: '#e6e3d9', backgroundColor: '#fff', fontSize: 15, color: '#111', textAlign: 'center' },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6e3d9' },
  chipActive: { backgroundColor: '#1d1d1b', borderColor: '#1d1d1b' },
  chipText: { color: '#555', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dateBtn: {
    alignItems: 'center', justifyContent: 'center',
    minWidth: 78, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 999, borderWidth: 1, borderColor: '#e6e3d9',
    backgroundColor: '#fff',
  },
  calendarBtn: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1, borderColor: '#e6e3d9',
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  calendarIcon: { fontSize: 17 },
  datePickerWrap: { alignItems: 'center' },
  dateBtnText: { fontSize: 15, color: '#111' },
  footerWrap: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ebe9e2', gap: 0 },
  saveBtn: { marginHorizontal: 12, marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: '#f1efe8', borderWidth: 1, borderColor: '#e6e3d9', alignItems: 'center' },
  saveBtnText: { color: '#555', fontSize: 14, fontWeight: '600' },
  analyzeBtn: { margin: 12, marginTop: 6, padding: 14, borderRadius: 12, backgroundColor: '#c06030', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  analyzeBtnDisabled: { backgroundColor: '#ddd' },
  analyzeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
