// Local photo persistence — no cloud, no billing.
// Photos are copied to documentDirectory (survives app restarts, private to app).
// The photo index is saved to AsyncStorage so it's restored on next launch.
//
// File layout: {documentDirectory}/drafts/{draftId}/{photoId}.jpg
// AsyncStorage key: 'fl_local_photos'  →  Record<draftId, LocalPhoto[]>

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocalPhoto } from './drafts';

const STORAGE_KEY = 'fl_local_photos';
const DRAFTS_DIR = `${FileSystem.documentDirectory}drafts/`;

// ── Persistence ───────────────────────────────────────────────────────────

export async function loadPhotoIndex(): Promise<Record<string, LocalPhoto[]>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const index: Record<string, LocalPhoto[]> = JSON.parse(raw);
    // Prune any entries whose files no longer exist on disk.
    const pruned: Record<string, LocalPhoto[]> = {};
    for (const [draftId, photos] of Object.entries(index)) {
      const alive: LocalPhoto[] = [];
      for (const p of photos) {
        const info = await FileSystem.getInfoAsync(p.uri).catch(() => ({ exists: false }));
        if (info.exists) alive.push(p);
      }
      if (alive.length > 0) pruned[draftId] = alive;
    }
    return pruned;
  } catch {
    return {};
  }
}

export async function savePhotoIndex(index: Record<string, LocalPhoto[]>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(index));
  } catch {
    // Non-fatal — worst case photos won't survive the next restart.
  }
}

// ── File operations ───────────────────────────────────────────────────────

/** Copy a camera/picker URI into the app's document directory. Returns the new persistent URI. */
export async function copyPhotoToDocDir(
  sourceUri: string,
  draftId: string,
  photoId: string,
): Promise<string> {
  const draftDir = `${DRAFTS_DIR}${draftId}/`;
  await FileSystem.makeDirectoryAsync(draftDir, { intermediates: true });
  const destUri = `${draftDir}${photoId}.jpg`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

/** Delete all local photos for a draft (called when the draft is deleted). */
export async function deleteLocalDraftPhotos(draftId: string): Promise<void> {
  try {
    const dir = `${DRAFTS_DIR}${draftId}/`;
    const info = await FileSystem.getInfoAsync(dir);
    if (info.exists) await FileSystem.deleteAsync(dir, { idempotent: true });
  } catch {
    // Best-effort.
  }
}
