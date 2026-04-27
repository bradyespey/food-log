// Global draft + analysis state.
// Firestore stores draft metadata (date, meal, brand, note, status).
// Photos are stored in the app's document directory via expo-file-system —
// free, private, and survive app restarts. Index is kept in AsyncStorage.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  subscribeDrafts,
  createDraft,
  updateDraft as fsUpdateDraft,
  deleteDraft as fsDeleteDraft,
  newId,
  type MealDraft,
  type LocalPhoto,
  type DraftStatus,
} from '../lib/drafts';
import {
  loadPhotoIndex,
  savePhotoIndex,
  copyPhotoToDocDir,
  deleteLocalDraftPhotos,
} from '../lib/localPhotoStorage';
import { analyzeFood, logFood } from '../lib/api';
import { useAuth } from './AuthContext';
import type { FoodItem, AnalysisState, Meal } from '../types';
import { SAMPLE_FOOD_ENTRIES } from '../../../shared/sampleFoodEntries';

const SAMPLE_ASSET_BASE = 'https://foodlog.theespeys.com';

export type { MealDraft, LocalPhoto, DraftStatus };

interface DraftsContextValue {
  drafts: MealDraft[];
  draftsLoaded: boolean;
  localPhotos: Record<string, LocalPhoto[]>;
  analyses: Record<string, AnalysisState>;

  newDraft: () => Promise<string>;
  loadSampleDrafts: () => Promise<string>;
  updateDraft: (id: string, patch: Partial<MealDraft>) => Promise<void>;
  addPhoto: (draftId: string, uri: string) => Promise<LocalPhoto>;
  removePhoto: (draftId: string, photoId: string) => void;
  deleteDraft: (id: string) => Promise<void>;

  runAnalyze: (draftId: string, overrides?: Partial<MealDraft>) => Promise<void>;
  editItem: (draftId: string, idx: number, updated: FoodItem) => void;
  deleteItem: (draftId: string, idx: number) => void;
  multiplyItem: (draftId: string, idx: number, factor: number) => void;
  setLogWater: (draftId: string, v: boolean) => void;
  logToLoseIt: (draftId: string) => Promise<void>;
  finishLoggedDraft: (draftId: string) => Promise<void>;
}

const Ctx = createContext<DraftsContextValue | null>(null);

export function DraftsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<MealDraft[]>([]);
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const [localPhotos, setLocalPhotos] = useState<Record<string, LocalPhoto[]>>({});
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisState>>({});

  // Load persisted photo index on mount.
  useEffect(() => {
    loadPhotoIndex().then((index) => {
      setLocalPhotos(index);
      setPhotosLoaded(true);
    });
  }, []);

  // Persist photo index whenever it changes (after initial load).
  const skipFirstSave = useRef(true);
  useEffect(() => {
    if (!photosLoaded) return;
    if (skipFirstSave.current) { skipFirstSave.current = false; return; }
    void savePhotoIndex(localPhotos);
  }, [localPhotos, photosLoaded]);

  // Subscribe to Firestore drafts.
  useEffect(() => {
    if (!user) { setDrafts([]); setDraftsLoaded(false); return; }
    const unsub = subscribeDrafts((d) => {
      setDrafts(d);
      setDraftsLoaded(true);
    }, ['capturing', 'pending', 'analyzed']);
    return unsub;
  }, [user]);

  // ── Draft CRUD ──────────────────────────────────────────────────────────

  const newDraft = useCallback(async (): Promise<string> => {
    const meal = guessMeal();
    const date = todayMMDD();
    const id = await createDraft({ meal, date, status: 'capturing' });
    // Optimistically add to local drafts state so DraftDetail can find it
    // immediately without waiting for the Firestore snapshot to fire.
    setDrafts((prev) => {
      if (prev.find((d) => d.id === id)) return prev;
      return [{ id, status: 'capturing', source: 'mobile', meal, date, brand: '', note: '',
        createdAt: new Date() as unknown as import('firebase/firestore').Timestamp,
        updatedAt: new Date() as unknown as import('firebase/firestore').Timestamp,
      }, ...prev];
    });
    setLocalPhotos((prev) => ({ ...prev, [id]: [] }));
    return id;
  }, []);

  const updateDraft = useCallback(async (id: string, patch: Partial<MealDraft>) => {
    setDrafts((prev) => prev.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
    await fsUpdateDraft(id, patch);
  }, []);

  // Copies photo to document directory then indexes it — survives app restarts.
  const addPhoto = useCallback(async (draftId: string, uri: string): Promise<LocalPhoto> => {
    const photoId = newId();
    let persistentUri = uri;
    try {
      persistentUri = await copyPhotoToDocDir(uri, draftId, photoId);
    } catch {
      // Copy failed — use original URI (photo shows but won't survive app restart)
    }
    const photo: LocalPhoto = { id: photoId, uri: persistentUri, createdAt: Date.now() };
    setLocalPhotos((prev) => ({
      ...prev,
      [draftId]: [...(prev[draftId] ?? []), photo],
    }));
    return photo;
  }, []);

  const loadSampleDrafts = useCallback(async (): Promise<string> => {
    const sample = SAMPLE_FOOD_ENTRIES[0];
    const id = await createDraft({
      meal: sample.meal,
      date: dateWithOffset(sample.dateOffsetDays),
      brand: sample.brand,
      note: sample.prompt,
      status: 'pending',
    });
    setDrafts((prev) => {
      if (prev.find((d) => d.id === id)) return prev;
      return [{ id, status: 'pending', source: 'mobile', meal: sample.meal, date: dateWithOffset(sample.dateOffsetDays), brand: sample.brand, note: sample.prompt,
        createdAt: new Date() as unknown as import('firebase/firestore').Timestamp,
        updatedAt: new Date() as unknown as import('firebase/firestore').Timestamp,
      }, ...prev];
    });
    for (const imageName of sample.imageNames) {
      await addPhoto(id, `${SAMPLE_ASSET_BASE}/${imageName}`);
    }
    return id;
  }, [addPhoto]);

  const removePhoto = useCallback((draftId: string, photoId: string) => {
    setLocalPhotos((prev) => ({
      ...prev,
      [draftId]: (prev[draftId] ?? []).filter((p) => p.id !== photoId),
    }));
  }, []);

  const deleteDraft = useCallback(async (id: string) => {
    await fsDeleteDraft(id);
    await deleteLocalDraftPhotos(id);
    setLocalPhotos((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setAnalyses((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  // ── Analysis ────────────────────────────────────────────────────────────

  const runAnalyze = useCallback(async (draftId: string, overrides: Partial<MealDraft> = {}) => {
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft) return;
    const analysisDraft = { ...draft, ...overrides };
    const photos = localPhotos[draftId] ?? [];
    const result = await analyzeFood({
      draftId,
      date: analysisDraft.date ?? todayMMDD(),
      meal: (analysisDraft.meal as Meal) ?? guessMeal(),
      brand: analysisDraft.brand ?? '',
      note: analysisDraft.note ?? '',
      photoUris: photos.map((p) => p.uri),
    });
    const items = result.items.map((i) => ({ ...i }));
    setAnalyses((prev) => ({
      ...prev,
      [draftId]: { items, originalItems: items.map((i) => ({ ...i })), verification: {}, isLogging: false, logged: false, logWater: false },
    }));
    await fsUpdateDraft(draftId, { status: 'analyzed' });
  }, [drafts, localPhotos]);

  const editItem = useCallback((draftId: string, idx: number, updated: FoodItem) => {
    setAnalyses((prev) => {
      const a = prev[draftId]; if (!a) return prev;
      const items = [...a.items]; items[idx] = updated;
      return { ...prev, [draftId]: { ...a, items } };
    });
  }, []);

  const deleteItem = useCallback((draftId: string, idx: number) => {
    setAnalyses((prev) => {
      const a = prev[draftId]; if (!a) return prev;
      return { ...prev, [draftId]: { ...a, items: a.items.filter((_, i) => i !== idx), verification: shiftVerification(a.verification, idx) } };
    });
  }, []);

  const multiplyItem = useCallback((draftId: string, idx: number, factor: number) => {
    setAnalyses((prev) => {
      const a = prev[draftId]; if (!a) return prev;
      const item = a.items[idx];
      const items = [...a.items];
      items[idx] = {
        ...item,
        calories: Math.round(item.calories * factor),
        fatG: r1(item.fatG * factor), satFatG: r1(item.satFatG * factor),
        cholesterolMg: Math.round(item.cholesterolMg * factor),
        sodiumMg: Math.round(item.sodiumMg * factor),
        carbsG: r1(item.carbsG * factor), fiberG: r1(item.fiberG * factor),
        sugarG: r1(item.sugarG * factor), proteinG: r1(item.proteinG * factor),
      };
      return { ...prev, [draftId]: { ...a, items } };
    });
  }, []);

  const setLogWater = useCallback((draftId: string, v: boolean) => {
    setAnalyses((prev) => {
      const a = prev[draftId]; if (!a) return prev;
      return { ...prev, [draftId]: { ...a, logWater: v } };
    });
  }, []);

  const logToLoseIt = useCallback(async (draftId: string) => {
    const a = analyses[draftId]; if (!a) return;
    setAnalyses((prev) => ({ ...prev, [draftId]: { ...prev[draftId], isLogging: true, verification: {} } }));
    try {
      const result = await logFood(a.items, a.logWater);
      if (result.errorCode === 'loseit_session_expired' || result.errorCode === 'loseit_not_configured') {
        Alert.alert('Lose It! session expired', 'Open Settings and update your Lose It! cookie.');
      }
      setAnalyses((prev) => ({
        ...prev,
        [draftId]: { ...prev[draftId], isLogging: false, logged: result.success, verification: result.verification },
      }));
    } catch (e) {
      setAnalyses((prev) => ({ ...prev, [draftId]: { ...prev[draftId], isLogging: false } }));
      throw e;
    }
  }, [analyses]);

  const finishLoggedDraft = useCallback(async (draftId: string) => {
    await fsUpdateDraft(draftId, { status: 'logged' as DraftStatus });
  }, []);

  return (
    <Ctx.Provider value={{
      drafts, draftsLoaded, localPhotos, analyses,
      newDraft, loadSampleDrafts, updateDraft, addPhoto, removePhoto, deleteDraft,
      runAnalyze, editItem, deleteItem, multiplyItem, setLogWater, logToLoseIt, finishLoggedDraft,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDrafts(): DraftsContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDrafts must be used inside DraftsProvider');
  return ctx;
}

function todayMMDD() {
  return dateWithOffset(0);
}
function dateWithOffset(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
function guessMeal(): Meal {
  const h = new Date().getHours();
  if (h < 10) return 'Breakfast'; if (h < 14) return 'Lunch';
  if (h < 21) return 'Dinner'; return 'Snacks';
}
function r1(n: number) { return Math.round(n * 10) / 10; }
function shiftVerification(v: Record<number, AnalysisState['verification'][number]>, removedIdx: number) {
  const out: typeof v = {};
  for (const [k, val] of Object.entries(v)) {
    const ki = parseInt(k, 10);
    if (ki === removedIdx) continue;
    out[ki > removedIdx ? ki - 1 : ki] = val;
  }
  return out;
}
