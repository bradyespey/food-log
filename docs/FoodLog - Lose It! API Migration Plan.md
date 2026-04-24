# FoodLog — Lose It! API Migration Plan

**Last updated:** April 24, 2026  
**Status:** Feature-complete on localhost — ready for production deployment  
**Repos:** `/Users/bradyespey/Projects/FoodLog` (React + Netlify) · `/Volumes/Projects/API` (Windows Flask — Selenium fallback, untouched)

---

## Bigger Picture: Unofficial Lose It! API

The reverse-engineering work done here is the foundation for an open-source **unofficial Lose It! API** — analogous to [hammem/monarchmoney](https://github.com/hammem/monarchmoney), which is a Python library wrapping Monarch Money's undocumented GraphQL API.

Lose It! has no public API. Everything in this document is based on GWT RPC calls reverse-engineered from browser HAR captures. The result is a complete understanding of the wire protocol that powers the Lose It! web app — meals, nutrients, serving units, water, diary readback, and more.

**Why this matters for the interview demo:**
- Replaces brittle browser automation (Selenium, 10–20s per item) with direct API calls (0.3s per item — ~50x faster)
- Demonstrates protocol reverse engineering from HAR captures
- Demonstrates serverless architecture (Netlify Functions / TypeScript)
- The same technique works for any GWT-based web app with no public API

**Eventual open-source shape** (not yet, but the foundation is here):
```
loseit-api/
  client.ts         — LoseItClient class (cookie auth, GWT transport)
  food.ts           — logFood(), searchFood(), deleteFood(), updateFood()
  diary.ts          — getDiaryEntries(), getFood()
  water.ts          — getWaterIntake(), setWaterIntake()
  types.ts          — FoodItem, DiaryEntry, NutrientMap, etc.
  constants.ts      — NUTRIENT_KEYS, SERVING_UNITS, MEAL_TYPES
```

---

## Section 1: What Was Done

### Architecture (final)

```
[Browser / localhost:8888 or foodlog.theespeys.com]
        │
        │  POST /.netlify/functions/food-analyze  →  OpenAI (direct, no Windows)
        │  POST /.netlify/functions/food-log       →  Lose It! GWT RPC (direct, no Windows)
        ▼
[Netlify Functions — TypeScript, esbuild]
```

**The Windows machine is no longer needed for anything.** Food analysis calls OpenAI directly from a Netlify function. Food logging uses GWT RPC directly to Lose It!. The Windows Flask + Selenium stack is untouched and available as an emergency fallback.

---

### Files Changed (FoodLog repo)

| File | What changed |
|---|---|
| `netlify/functions/food-log.ts` | Full GWT RPC client for `saveCustomFoodLogEntry` |
| `netlify/functions/food-analyze.ts` | Direct OpenAI call with structured JSON output (replaced proxy to Windows) |
| `src/lib/api.ts` | Calls `/.netlify/functions/food-log` |
| `src/lib/openai.ts` | Calls `/.netlify/functions/food-analyze`; normalization rules for serving units and icons |
| `netlify.toml` | Added `[dev]` (port 8888) and `[functions]` (esbuild) |
| `package.json` | Added `@netlify/functions`, `openai`; added `dev:all` script |
| `vite.config.ts` | `strictPort: false` — prevents port conflict crashes |
| `.env` | Added `LOSEIT_COOKIE`, `LOSEIT_GWT_PERMUTATION`, `OPENAI_API_KEY`, `OPENAI_MODEL` |
| `.env.example` | Matching empty placeholders for all new keys |

---

### GWT Protocol: Confirmed Facts

**Nutrient key map** (all confirmed — original HAR analysis had every non-calorie key wrong):

| Key | Nutrient |
|---|---|
| 0 | Calories |
| 3 | Fat (g) |
| 4 | Saturated Fat (g) |
| 8 | Cholesterol (mg) |
| 9 | Sodium (mg) |
| 10 | Carbs (g) |
| 11 | Fiber (g) |
| 12 | Sugar (g) |
| 13 | Protein (g) |

**Serving unit FoodMeasure IDs** — all 41 confirmed from HARs 12–15:

| ID | Unit | | ID | Unit |
|---|---|---|---|---|
| 1 | Teaspoon(s) | | 22 | Cube |
| 2 | Tablespoon(s) | | 23 | Jar |
| 3 | Cup(s) | | 24 | Stick |
| 4 | Piece(s) | | 25 | Tablet |
| 5 | Each | | 26 | Slice |
| 6 | Ounce(s) | | 27 | Serving(s) |
| 7 | Pound(s) | | 32 | Ind Package |
| 8 | Gram(s) | | 33 | Scoop |
| 9 | Kilogram(s) | | 34 | Metric Cup(s) |
| 10 | Fluid Ounce(s) | | 35 | Dry Cup(s) |
| 11 | Milliliter(s) | | 36 | Imperial Fluid Ounce(s) |
| 12 | Liter(s) | | 37 | Imperial Gallon(s) ← new, not in original SERVING_TYPES |
| 13 | Gallon(s) | | 38 | Imperial Quart(s) |
| 14 | Pint(s) | | 39 | Imperial Pint(s) |
| 15 | Quart(s) | | 40 | ??? (mystery second Tablespoon unit) |
| 16 | Milligram(s) | | 41 | Dessertspoon(s) |
| 17 | Microgram(s) | | 42 | Pot |
| 18 | ??? (unknown gap) | | 43 | Punnet |
| 19 | Bottle | | 44 | ??? (unknown gap) |
| 20 | Box | | 45 | Container |
| 21 | Can | | 46 | Package |
| | | | 47 | Pouch |

Fractions confirmed working: 1⅛=1.125, 1¼=1.25, 1⅓=1.333, 1½=1.5, 1⅔=1.666, 1¾=1.75, 1⅞=1.875. Lose It! stores as decimals rounded to 3 places.

**Other confirmed facts:**

| Finding | Detail |
|---|---|
| Lose It! epoch | Dec 31, 2000 (day 1 = Jan 1, 2001) |
| Body permutation | `2755A092A086CADF822A722370D298F9` (hardcoded — NOT the header perm) |
| Header permutation | `79FCB90B69F5FF2C7877662E5529652C` (in `.env`) |
| FoodIdentifier layout | id \| icon (pos 2) \| null \| foodName (pos 4 = diary label) \| brand |
| Icon format | Display name stripped of spaces/punctuation: `"Mixed Drink"` → `"MixedDrink"` |
| Serving icon code | `P__________` always inline in FoodServingSize params |
| Zero nutrients | Must be sent — Lose It! shows `-` for absent keys |
| Fractions | Sent as decimals: 2¼ → `2.25`, 3⅓ → `3.333` |
| Meal types | Breakfast=0, Lunch=1, Dinner=2, Snacks=3 |
| Water method | `saveCustomGoalValue` — takes total fl oz for the day |
| Diary readback | `getFood(uuid)` returns full nutrition for a logged entry |

---

## Section 2: What Remains

### 2a — ✅ Serving Units Complete

All 41 serving unit FoodMeasure IDs confirmed from HAR 15. `SERVING_UNIT_MAP` in `food-log.ts` is fully populated. `SERVING_TYPES` in `openai.ts` updated to include `Imperial Gallon` and `Ind Package` (both discovered via HAR 15, not in the original list).

Note: ID 40 is a mystery second Tablespoon-like unit. ID 18 and IDs 28–31 and 44 are gaps in the sequence — unknown units, likely obscure or legacy.

---

### 2a — HAR 16: Water Logging

**Two calls needed — read current water level, then set new value.**

**Which page to use:** Goals → Water Intake (the one with the date selector), NOT the dashboard water widget. This is the page that allows logging water for past dates, which is what the API needs.

**Steps:**
1. Go to `https://www.loseit.com/` → **Goals** (top nav) → **Water Intake** section
2. DevTools (F12) → **Network** tab → check **Preserve log** → click 🚫 clear
3. **First capture — read current water:** Select a date from the date picker (try 2 days ago) — just changing the date should fire a "get" GWT call. Note the current value shown.
4. **Second capture — set water:** Enter a new water total (e.g., 48 oz) → click **Record** — this fires the `saveCustomGoalValue` write call.
5. Repeat step 4 for today's date as well (to confirm both past and present dates work).
6. Export as `16-water-logging.har` → save to `docs/har_files/`

**What this reveals:**
- The GWT method and body for reading current water (`getGoalValues` or similar)
- The GWT method and body for setting water (`saveCustomGoalValue` confirmed name, need exact params)
- Whether the body takes a **total** fl oz or a **delta** (previous testing suggests total)
- Whether past dates work via the date picker (same mechanism as food logging)

---

### 2b — Production Deployment

Add these 4 vars to Netlify env vars (Netlify dashboard → FoodLog site → Environment variables):

| Variable | Value (from local `.env`) |
|---|---|
| `LOSEIT_COOKIE` | Full browser session cookie |
| `LOSEIT_GWT_PERMUTATION` | `79FCB90B69F5FF2C7877662E5529652C` |
| `OPENAI_API_KEY` | OpenAI key |
| `OPENAI_MODEL` | `gpt-4o-mini` |

Then push to `main` → auto-deploys → test on `foodlog.theespeys.com`.

**Old vars that are now unused** (remove from Netlify after confirming prod works):
- `VITE_API_BASE_URL`, `VITE_API_USERNAME`, `VITE_API_PASSWORD` — Windows API, no longer called
- `VITE_OPENAI_API_KEY`, `VITE_OPENAI_MODEL` — key is now server-side only

---

### 2c — ✅ Water Logging (Phase 6 — Implemented)

Confirmed from HAR 16-water-logging.har. Fully implemented in `food-log.ts`.

**How it works:**
1. During food logging, any successfully logged item with a `Fluid Ounce` serving unit accumulates its fl oz in a `waterByDate` map (grouped by date)
2. After all food items log, `logWaterForDate()` runs for each date that has fluid oz
3. For each date: calls `getCustomGoalValues` (using "water" goal key + explicit date) to read the current total, then calls `saveCustomGoalValue` with `currentOz + newOz` as the new total
4. Output shows: `💧 Water: 04/23 25→37.33 fl oz (+12.33)`

**Key GWT calls:**
- `getCustomGoalValues` — reads current water for a specific date (uses simple "water" string key + DayDate, not the full CustomGoal object)
- `saveCustomGoalValue` — sets new total; body has a fixed CustomGoal object prefix + dynamic `7|8|{Z_DATE}|{DAY_NUM}|-5|8|{Z_VAL}|{TOTAL_OZ}|-1|` suffix

**Account-specific constants in `food-log.ts`:**
The `WATER_SAVE_FIXED_PREFIX` contains Z-tokens (`OO$pBbo`, `Y0_NC7o`, `ZIla1iI`) and UUID bytes that are specific to Brady's water goal object. These are confirmed fixed across sessions. To use for a different Lose It! account, capture a fresh `saveCustomGoalValue` HAR from the Goals → Water Intake page and extract the fixed prefix.

**Behavior:**
- `log_water` checkbox is **off by default** (Brady usually backfills water manually)
- Only items with Fluid Ounce serving units contribute to water
- Water is only logged for items that successfully logged (//OK from Lose It!)
- Past dates work — the GWT call takes an explicit day number, same as food logging

### 2d — Diary Readback Verification (Phase 4, optional)

`getFood(uuid)` confirmed from HAR. Currently "verified" = Lose It! returned `//OK`. True verification would call `getFood` after logging to confirm nutrients match.

### 2e — Cookie Refresh (ongoing maintenance)

When food logging stops working, the session cookie has expired. Refresh it:
1. Log in to `loseit.com` in Chrome → DevTools → Network → any `/web/service` request → copy the `Cookie:` header value
2. Update `LOSEIT_COOKIE` in local `.env` and in Netlify env vars

---

## Section 3: Confirmed Working on Localhost

| Test | Status |
|---|---|
| Food name, date, meal correct | ✅ |
| All 9 nutrients correct | ✅ (confirmed with unique values per field) |
| Fractions in serving size | ✅ (2.125, 2.25, 3.333 all work) |
| Zero nutrients sent (not filtered) | ✅ |
| Serving units: all 41 confirmed (Teaspoon→1 through Pouch→47) | ✅ HAR 15 |
| Icons rendering correctly | ✅ (Beef, Mixed Drink, Smoothie, etc.) |
| All 5 sample items in one batch | ✅ |
| Multiple dates in one batch (Apr 22 Lunch + Apr 23 Dinner) | ✅ |
| Food analysis via Netlify (no Windows, ~2s) | ✅ |
| AI food analysis + log end-to-end | ✅ |
| Water logging: reads current oz, adds fluid oz, saves new total | ✅ HAR 16 |
| Log water off by default (user opt-in per session) | ✅ |

---

## Appendix: Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `LOSEIT_COOKIE` | `.env` + Netlify | Session cookie — server-side only |
| `LOSEIT_GWT_PERMUTATION` | `.env` + Netlify | GWT header permutation hash |
| `OPENAI_API_KEY` | `.env` + Netlify | OpenAI API key — server-side only, never VITE_ |
| `OPENAI_MODEL` | `.env` + Netlify | e.g. `gpt-4o-mini` |
| `VITE_FIREBASE_*` | `.env` | Firebase config (unchanged) |
