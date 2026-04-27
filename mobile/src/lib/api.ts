// API client — calls the same Netlify functions as the web app.
// analyzeFood: food-analyze (OpenAI vision)
// logFood: food-log (Lose It! GWT RPC)

import * as FileSystem from 'expo-file-system/legacy';
import { auth } from './firebase';
import type { FoodItem, ItemVerificationStatus, Meal } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://foodlog.theespeys.com';

async function authedHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {
    // non-fatal — function falls back to env-var cookie
  }
  return headers;
}

// ── Image helpers ──────────────────────────────────────────────────────────

async function uriToBase64(uri: string): Promise<string> {
  // For network URIs (http/https), download to a temp file first
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const tempPath = `${FileSystem.cacheDirectory}photo_${Date.now()}.jpg`;
    await FileSystem.downloadAsync(uri, tempPath);
    const b64 = await FileSystem.readAsStringAsync(tempPath, { encoding: FileSystem.EncodingType.Base64 });
    await FileSystem.deleteAsync(tempPath, { idempotent: true });
    return b64;
  }
  // Local file URI from camera or picker
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

// ── System prompt (mirrors web app buildSystemPrompt) ──────────────────────

function buildSystemPrompt(): string {
  return `
You provide detailed nutritional information for food and drink items for logging in food apps. Follow these guidelines exactly:

CRITICAL ANALYSIS REQUIREMENTS:
- Each entry includes an "EntryID:" line. Every food item MUST copy that exact EntryID into the output field "entry_id".
- NEVER set all nutritional values to 0 — always provide realistic estimates.
- For restaurant foods, use standard nutrition databases or similar items as reference.
- SERVING SIZE: If description mentions a count ("3 tacos"), use "Each" as unit with the count as amount.
- For drinks/beverages, ALWAYS use "Fluid Ounce" — estimate from cup/glass size in photos.
- For solid foods, NEVER use "Fluid Ounce" — use "Ounces" (weight) or "Each"/"Serving" (countable).
- "portion" is NOT a valid serving type — use "Serving" instead.
- NO DUPLICATES — each unique food item appears exactly once.
- Create concise, standardized food names (under 60 chars).
- Remove quantity words from names when they are in the serving size.
- Do NOT infer items not mentioned or clearly shown.
- Valid serving types — Weight: Grams, Kilograms, Ounces, Pounds, Milligrams, Micrograms; Volume: Cups, Fluid Ounce, Gallons, Liters, Milliliters, Pints, Quarts, Tablespoons, Teaspoons, Metric Cups, Imperial Fluid Ounces, Imperial Pints, Imperial Quarts, Dessertspoons; Amount: Bottle, Box, Can, Container, Cube, Dry Cup, Each, Ind Package, Jar, Package, Piece, Pot, Pouch, Punnet, Scoop, Serving, Slice, Stick, Tablet.
`.trim();
}

// ── analyzeFood ────────────────────────────────────────────────────────────

interface AnalyzeFoodRequest {
  draftId: string;
  date: string;
  meal: Meal;
  brand: string;
  note: string;
  photoUris: string[]; // local URIs or Firebase download URLs
}

interface AnalyzeFoodResult {
  items: FoodItem[];
}

export async function analyzeFood(req: AnalyzeFoodRequest): Promise<AnalyzeFoodResult> {
  const { draftId, date, meal, brand, note, photoUris } = req;

  const base64Images = await Promise.all(photoUris.map(uriToBase64));

  const entryText =
    `EntryID: ${draftId}\n` +
    `Date: ${date}, Meal: ${meal}, Brand: ${brand || 'Home cooking'}\n` +
    (note ? `${note}` : '');

  const prompt =
    photoUris.length > 0
      ? `Analyze the food shown in the ${photoUris.length} image(s). Look carefully at portion sizes, plate/glass sizes, and visible details.\n\nFood Entries:\n${entryText}`
      : `Analyze these food entries.\n\nFood Entries:\n${entryText}`;

  const payload = {
    systemPrompt: buildSystemPrompt(),
    prompt,
    images: base64Images,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/.netlify/functions/food-analyze`, {
      method: 'POST',
      headers: await authedHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || `HTTP ${res.status}`);
  }

  const rawItems: Array<{
    entry_id?: string;
    food_name: string;
    date: string;
    meal: string;
    brand: string;
    icon: string;
    serving_amount: number;
    serving_unit: string;
    calories: number;
    fat_g: number;
    saturated_fat_g: number;
    cholesterol_mg: number;
    sodium_mg: number;
    carbs_g: number;
    fiber_g: number;
    sugar_g: number;
    protein_g: number;
  }> = json.data?.items ?? [];

  const items: FoodItem[] = rawItems.map((r) => ({
    entryId: r.entry_id,
    foodName: r.food_name,
    date: r.date,
    meal: r.meal as Meal,
    brand: r.brand,
    icon: r.icon,
    serving: {
      amount: r.serving_amount,
      unit: r.serving_unit,
    },
    calories: r.calories,
    fatG: r.fat_g,
    satFatG: r.saturated_fat_g,
    cholesterolMg: r.cholesterol_mg,
    sodiumMg: r.sodium_mg,
    carbsG: r.carbs_g,
    fiberG: r.fiber_g,
    sugarG: r.sugar_g,
    proteinG: r.protein_g,
  }));

  return { items };
}

// ── logFood ────────────────────────────────────────────────────────────────

function formatItem(item: FoodItem): string {
  const lines = [
    `Food Name: ${item.foodName}`,
    `Date: ${item.date}`,
    `Meal: ${item.meal}`,
    `Brand: ${item.brand || ''}`,
    `Icon: ${item.icon}`,
    `Serving Size: ${item.serving.amount} ${item.serving.unit}`,
    `Calories: ${item.calories}`,
    `Fat (g): ${item.fatG}`,
    `Saturated Fat (g): ${item.satFatG}`,
    `Cholesterol (mg): ${item.cholesterolMg}`,
    `Sodium (mg): ${item.sodiumMg}`,
    `Carbs (g): ${item.carbsG}`,
    `Fiber (g): ${item.fiberG}`,
    `Sugar (g): ${item.sugarG}`,
    `Protein (g): ${item.proteinG}`,
  ];
  if (item.hydration?.isLiquid && (item.hydration.fluidOz ?? 0) > 0) {
    lines.push(`Hydration: ${item.hydration.fluidOz} fluid ounces`);
  }
  return lines.join('\n');
}

export interface LogFoodResult {
  success: boolean;
  message: string;
  verification: Record<number, ItemVerificationStatus>;
  errorCode?: string;
}

export async function logFood(items: FoodItem[], logWater: boolean): Promise<LogFoodResult> {
  const food_items = items.map(formatItem);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/.netlify/functions/food-log`, {
      method: 'POST',
      headers: await authedHeaders(),
      body: JSON.stringify({ food_items, log_water: logWater }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const json = await res.json();

  if (res.status === 401) {
    return {
      success: false,
      message: json.message || 'Lose It! session expired.',
      errorCode: json.errorCode,
      verification: json.verification ?? {},
    };
  }

  return {
    success: json.success === true,
    message: json.message || (json.success ? 'Food logged!' : 'Logging failed'),
    verification: json.verification ?? {},
    errorCode: json.errorCode,
  };
}
