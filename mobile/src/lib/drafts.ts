// Firestore CRUD for meal drafts. Photos are kept local to the device —
// no Firebase Storage used. Photos live in DraftsContext state and are
// ephemeral (gone if the app is closed before analyzing). Draft metadata
// (date, meal, brand, note, status) persists in Firestore for free.

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
  type Timestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';

// ── Types ──────────────────────────────────────────────────────────────────

export type DraftStatus = 'capturing' | 'pending' | 'analyzed' | 'logged' | 'discarded';
export type Meal = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

// Local photo — lives in DraftsContext state only, never uploaded to cloud.
export interface LocalPhoto {
  id: string;
  uri: string;   // local device file URI from camera or image picker
  createdAt: number; // Date.now()
}

// Firestore document shape — no photos field (photos are local-only).
export interface MealDraft {
  id: string;
  status: DraftStatus;
  source: 'mobile' | 'web';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  meal?: Meal;
  date?: string;   // 'MM/DD'
  brand?: string;
  note?: string;
  photoCount?: number; // how many local photos the user has attached (informational)
  lastError?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  return uid;
}

export function newId(): string {
  const alpha = '0123456789abcdefghjkmnpqrstvwxyz';
  let out = '';
  for (let i = 0; i < 16; i++) out += alpha[Math.floor(Math.random() * alpha.length)];
  return `${Date.now().toString(36)}_${out}`;
}

// ── Mutations ──────────────────────────────────────────────────────────────

export async function createDraft(initial: Partial<Pick<MealDraft, 'meal' | 'date' | 'brand' | 'note' | 'status'>> = {}): Promise<string> {
  const uid = requireUid();
  const id = newId();
  await setDoc(doc(db, 'users', uid, 'mealDrafts', id), {
    status: initial.status ?? 'pending',
    source: 'mobile',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...(initial.meal  ? { meal:  initial.meal  } : {}),
    ...(initial.date  ? { date:  initial.date  } : {}),
    ...(initial.brand ? { brand: initial.brand } : {}),
    ...(initial.note  ? { note:  initial.note  } : {}),
  });
  return id;
}

export async function updateDraft(draftId: string, patch: Partial<MealDraft>): Promise<void> {
  const uid = requireUid();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = patch as MealDraft;
  await updateDoc(doc(db, 'users', uid, 'mealDrafts', draftId), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDraft(draftId: string): Promise<void> {
  const uid = requireUid();
  await deleteDoc(doc(db, 'users', uid, 'mealDrafts', draftId));
}

// ── Queries ────────────────────────────────────────────────────────────────

export function subscribeDrafts(
  onChange: (drafts: MealDraft[]) => void,
  statusFilter: DraftStatus[] = ['pending'],
): Unsubscribe {
  const uid = requireUid();
  // Single-field orderBy only — no composite index needed.
  // Status filtering is done client-side so we avoid the composite index requirement.
  const q = query(
    collection(db, 'users', uid, 'mealDrafts'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MealDraft, 'id'>) }));
      onChange(all.filter((d) => statusFilter.includes(d.status)));
    },
    (error) => {
      console.error('Firestore subscription error:', error.message);
      onChange([]); // unblock the loading state so UI renders empty instead of spinning forever
    },
  );
}
