// In-app camera capture + library picker. Photos stored locally on device.

import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDrafts } from '../context/DraftsContext';
import Icon from '../components/Icon';
import type { RootStackParamList } from '../navigation';
import type { Meal } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Capture'>;

const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function CaptureScreen({ route, navigation }: Props) {
  const { draftId } = route.params;
  const insets = useSafeAreaInsets();
  const { drafts, localPhotos, updateDraft, addPhoto, deleteDraft, loadSampleDrafts } = useDrafts();
  const draft = drafts.find((d) => d.id === draftId);
  const photos = localPhotos[draftId] ?? [];
  const isNewCapture = draft?.status === 'capturing';

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [meal, setMeal] = useState<Meal>((draft?.meal as Meal) ?? 'Lunch');

  useEffect(() => {
    void updateDraft(draftId, { meal });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meal]);

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 120);
    try {
      const pic: CameraCapturedPicture | undefined = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (pic) await addPhoto(draftId, pic.uri);
    } catch (e) {
      Alert.alert('Capture failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handlePickFromLibrary = async () => {
    if (busy) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    setBusy(true);
    try {
      for (const asset of result.assets) {
        await addPhoto(draftId, asset.uri);
      }
    } catch (e) {
      Alert.alert('Import failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDone = () => {
    if (photos.length === 0) {
      if (isNewCapture) {
        void deleteDraft(draftId);
        navigation.navigate('Tabs');
      } else {
        navigation.goBack();
      }
      return;
    }
    navigation.replace('DraftDetail', { draftId });
  };

  const handleSample = async () => {
    try {
      setBusy(true);
      const sampleDraftId = await loadSampleDrafts();
      if (isNewCapture) void deleteDraft(draftId);
      navigation.replace('DraftDetail', { draftId: sampleDraftId });
    } catch (e) {
      Alert.alert('Sample failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Save photos to the draft and go straight to Drafts — no form required
  const handleSaveAndClose = async () => {
    if (photos.length > 0 && isNewCapture) {
      await updateDraft(draftId, { status: 'pending' });
    }
    navigation.navigate('Tabs');
  };

  const handleCancel = () => {
    if (isNewCapture) {
      void deleteDraft(draftId);
      navigation.navigate('Tabs');
    } else {
      navigation.goBack();
    }
  };

  if (!permission) return <View style={s.center}><ActivityIndicator /></View>;

  if (!permission.granted) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={s.permText}>Camera permission required</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Grant permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.permBtn, s.permBtnSecondary]} onPress={handlePickFromLibrary}>
          <Text style={s.permBtnText}>Pick from library instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Top bar — uses safe area inset */}
      <View style={[s.topbar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.topBtn} onPress={handleCancel}>
          <Text style={s.topBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.topBtn} onPress={photos.length > 0 ? handleSaveAndClose : handleDone}>
          <Text style={[s.topBtnText, { color: photos.length > 0 ? '#4ade80' : '#666' }]}>
            {photos.length > 0 ? 'Save' : 'Skip'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.topBtn} onPress={photos.length > 0 ? handleDone : handleSample} disabled={busy}>
          <Text style={s.topBtnText}>
            {photos.length > 0 ? 'Next →' : 'Sample'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Viewfinder — flex fills remaining space */}
      <View style={s.viewfinder}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        {flash && <View style={s.flash} />}
      </View>

      {/* Controls below viewfinder */}
      <View style={s.controls}>
        {/* Meal chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.mealRow} contentContainerStyle={{ paddingHorizontal: 18, gap: 8 }}>
          {MEALS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[s.mealChip, meal === m && s.mealChipActive]}
              onPress={() => setMeal(m)}
            >
              <Text style={[s.mealChipText, meal === m && s.mealChipTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Shutter row */}
        <View style={s.shutterRow}>
          <TouchableOpacity
            style={s.libraryBtn}
            onPress={handlePickFromLibrary}
            disabled={busy}
            accessibilityLabel="Open photo library"
          >
            {photos.length > 0 ? (
              <Image source={{ uri: photos[photos.length - 1].uri }} style={s.libraryThumb} />
            ) : (
              <Icon name="image" size={22} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.shutter, busy && s.shutterBusy]}
            onPress={handleCapture}
            disabled={busy}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <View style={s.shutterInner} />}
          </TouchableOpacity>

          {/* Thumbnail stack */}
          <View style={s.sideBtn}>
            <View style={s.thumbStack}>
              {photos.slice(-3).reverse().map((p, i) => (
                <Image
                  key={p.id}
                  source={{ uri: p.uri }}
                  style={[s.stackThumb, {
                    transform: [{ translateX: -i * 4 }, { rotate: `${i * -3}deg` }],
                    zIndex: 10 - i,
                  }]}
                />
              ))}
              {photos.length === 0 && (
                <View style={s.stackEmpty}>
                  <Text style={{ color: '#555', fontSize: 11 }}>0</Text>
                </View>
              )}
            </View>
            <Text style={s.sideBtnLabel}>{photos.length}</Text>
          </View>
        </View>

        {/* Bottom safe area padding */}
        <View style={{ height: insets.bottom + 8 }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  permText: { fontSize: 16, marginBottom: 16 },
  permBtn: { backgroundColor: '#111', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 10, marginTop: 8 },
  permBtnSecondary: { backgroundColor: '#666' },
  permBtnText: { color: '#fff', fontWeight: '600' },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingBottom: 12, backgroundColor: '#000',
  },
  topBtn: { minWidth: 60, alignItems: 'center', padding: 6 },
  topBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  topDate: { color: '#bbb', fontSize: 13, fontFamily: 'Courier' },
  viewfinder: { flex: 1, position: 'relative', backgroundColor: '#222' },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fff', opacity: 0.9 },
  controls: { backgroundColor: '#000' },
  mealRow: { paddingVertical: 10, flexGrow: 0 },
  mealChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)' },
  mealChipActive: { backgroundColor: '#fff' },
  mealChipText: { color: '#ddd', fontSize: 13, fontWeight: '500' },
  mealChipTextActive: { color: '#111' },
  shutterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 28, paddingVertical: 14,
  },
  libraryBtn: {
    width: 42, height: 42, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  libraryThumb: { width: 42, height: 42 },
  sideBtn: { alignItems: 'center', gap: 4, minWidth: 60 },
  sideBtnLabel: { color: '#aaa', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  shutter: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterBusy: { opacity: 0.6 },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  thumbStack: { position: 'relative', width: 36, height: 36 },
  stackThumb: { position: 'absolute', width: 30, height: 30, borderRadius: 4, top: 3, left: 3, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  stackEmpty: { position: 'absolute', width: 30, height: 30, borderRadius: 4, top: 3, left: 3, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});
