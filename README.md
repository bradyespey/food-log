# FoodLog AI

AI-powered food logging app for [Lose It!](https://www.loseit.com/). Take a photo of your meal, get instant nutritional analysis from GPT-4o-mini, and log it directly to your Lose It! diary — all without touching the Lose It! UI.

**Live app:** https://foodlog.theespeys.com

---

## How It Works

```
[Browser]
    │
    ├── POST /.netlify/functions/food-analyze  → OpenAI GPT-4o-mini (structured JSON)
    └── POST /.netlify/functions/food-log      → Lose It! GWT RPC (direct API)
```

**Food analysis** — Upload a meal photo or type a description. GPT-4o-mini returns structured nutritional data: food name, brand, icon, serving size, and all 9 macros/micros.

**Food logging** — Items are sent directly to Lose It!'s internal GWT RPC API. No browser automation, no Windows machine. Each item logs in ~0.3 seconds.

This replaced a Selenium-based approach that required a Windows machine running Chrome 24/7 and took 10–20 seconds per item — roughly a **50× speed improvement**.

> The GWT RPC integration is the foundation of an unofficial Lose It! API — similar in spirit to [hammem/monarchmoney](https://github.com/hammem/monarchmoney). Every Lose It! action (log food, log water, read diary, delete entries) is a direct API call reverse-engineered from browser HAR captures.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Functions | Netlify Functions (TypeScript, esbuild) |
| AI Analysis | OpenAI GPT-4o-mini with Structured Outputs |
| Food Logging | Lose It! GWT RPC — direct API (unofficial) |
| Auth | Firebase Google OAuth |
| Hosting | Netlify (auto-deploy from `main`) |

---

## Quick Start

```bash
git clone https://github.com/bradyespey/food-log
cd FoodLog
npm install
cp .env.example .env   # fill in your values
npm run dev:all        # starts at localhost:8888
```

**Requires** a Lose It! Premium account and a browser session cookie (see Environment below).

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values.

```env
# Firebase (client-side)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Allowed users (comma-separated Google emails)
VITE_ALLOWED_EMAILS=

# OpenAI — server-side only (used by food-analyze Netlify function)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Lose It! session — server-side only (used by food-log Netlify function)
LOSEIT_COOKIE=
LOSEIT_GWT_PERMUTATION=
```

### Managing your Lose It! session cookie

The cookie authenticates GWT calls to Lose It!. It contains short-lived session tokens that expire every few days regardless of activity.

**Recommended: update via the in-app Settings UI**

Once logged in with Google, click the ⚙ gear icon in the navbar → **Lose It! Session** → paste your fresh cookie. It saves to Firestore and applies immediately everywhere (localhost and production) without touching env vars or redeploying.

**How to get a fresh cookie:**
1. Log in to `https://www.loseit.com/` in Chrome
2. Open DevTools → **Network** tab
3. Click any request to `/web/service`
4. In **Request Headers**, find `Cookie:` — copy the entire value
5. Paste it in the Settings modal (or in `LOSEIT_COOKIE=` in `.env` as a fallback)

**When it expires:** The app detects auth failures and shows a red pulsing ⚙ icon in the navbar with a toast: *"Your Lose It! session has expired. Open Settings and paste a fresh cookie."* The settings modal opens automatically.

For initial setup, `LOSEIT_COOKIE` in the env var is still supported as a fallback if no Firestore cookie is set.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev:all` | Start Vite at `localhost:8888` + functions server at `localhost:9999` (recommended) |
| `npm run dev` | Vite only at `localhost:8888` (no Netlify functions) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run deploy:watch` | Push to GitHub and stream Netlify build logs until deploy completes |

`dev:all` runs both servers via `concurrently`. Vite proxies `/.netlify/functions/*` to the functions server at port 9999, so functions behave identically to production.

### Deploy

Netlify auto-deploys from `main` on every push. To push and verify in one step:

```bash
npm run deploy:watch
```

This pushes to GitHub, streams the full Netlify build log, and exits non-zero if the build fails or the expected site URL is absent from the output. Add the four server-side env vars (`LOSEIT_COOKIE`, `LOSEIT_GWT_PERMUTATION`, `OPENAI_API_KEY`, `OPENAI_MODEL`) to your Netlify site's Environment Variables dashboard before the first deploy.

---

## Netlify Functions

### `food-analyze` — AI nutritional analysis

Calls OpenAI with the meal photo(s) and description. Returns structured JSON with one object per food item.

**Request:**
```json
{
  "systemPrompt": "...",
  "prompt": "Chicken tacos, 3 each",
  "images": ["base64..."]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [{
      "food_name": "Chicken Tacos",
      "date": "04/23",
      "meal": "Dinner",
      "brand": "Home",
      "icon": "Taco",
      "serving_amount": 3,
      "serving_unit": "Each",
      "calories": 450,
      "fat_g": 18,
      "saturated_fat_g": 6,
      "cholesterol_mg": 90,
      "sodium_mg": 820,
      "carbs_g": 38,
      "fiber_g": 4,
      "sugar_g": 3,
      "protein_g": 32
    }]
  }
}
```

### `food-log` — Log food + water to Lose It!

Sends each food item to Lose It! via `saveCustomFoodLogEntry` GWT RPC. Optionally logs water intake via `saveCustomGoalValue`.

**Request:**
```json
{
  "food_items": [
    "Food Name: Chicken Tacos\nDate: 04/23\nMeal: Dinner\nBrand: Home\nIcon: Taco\nServing Size: 3 Each\nCalories: 450\nFat (g): 18\n..."
  ],
  "log_water": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged 1 of 1 items in 0.3s",
  "output": "Logging item 1 of 1: Chicken Tacos\n  ✓ Accepted by Lose It! (Chicken Tacos)",
  "verification": {
    "0": {
      "foodName": { "verified": true, "expected": "Chicken Tacos", "actual": "Chicken Tacos", "matches": true },
      "calories": { "verified": true, "expected": 450, "actual": 450, "matches": true },
      "verificationLevel": "accepted"
    }
  }
}
```

---

## GWT RPC Protocol Reference

Lose It! uses [GWT RPC v7](https://www.gwtproject.org/doc/latest/DevGuideServerCommunication.html) for all API calls. The wire format is:

```
7|0|N|s1|s2|...|sN|p1|p2|...|pM|
```

All values below were confirmed from browser HAR captures.

### Confirmed GWT Methods

| Method | Description |
|---|---|
| `saveCustomFoodLogEntry` | Log a food item to the diary |
| `saveCustomGoalValue` | Set water intake total for a date |
| `getCustomGoalValues` | Read current water intake for a date |
| `getFood` | Read a logged food entry by UUID |
| `getDailyDetailsIncludingPendingForDate` | Read full diary for a date |
| `deleteFoodLogEntry` | Delete a logged food entry |
| `updateFoodLogEntry` | Update a logged food entry |

### Nutrient Key Map

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

### Serving Unit FoodMeasure IDs (all 41 confirmed)

| ID | Unit | ID | Unit |
|---|---|---|---|
| 1 | Teaspoon(s) | 24 | Stick |
| 2 | Tablespoon(s) | 25 | Tablet |
| 3 | Cup(s) | 26 | Slice |
| 4 | Piece(s) | 27 | Serving(s) |
| 5 | Each | 32 | Ind Package |
| 6 | Ounce(s) | 33 | Scoop |
| 7 | Pound(s) | 34 | Metric Cup(s) |
| 8 | Gram(s) | 35 | Dry Cup(s) |
| 9 | Kilogram(s) | 36 | Imperial Fluid Ounce(s) |
| 10 | Fluid Ounce(s) | 37 | Imperial Gallon(s) |
| 11 | Milliliter(s) | 38 | Imperial Quart(s) |
| 12 | Liter(s) | 39 | Imperial Pint(s) |
| 13 | Gallon(s) | 41 | Dessertspoon(s) |
| 14 | Pint(s) | 42 | Pot |
| 15 | Quart(s) | 43 | Punnet |
| 16 | Milligram(s) | 45 | Container |
| 17 | Microgram(s) | 46 | Package |
| 19 | Bottle | 47 | Pouch |
| 20 | Box | | |
| 21 | Can | | |
| 22 | Cube | | |
| 23 | Jar | | |

### Other Constants

| Fact | Value |
|---|---|
| Service endpoint | `https://www.loseit.com/web/service` |
| GWT format version | `7` |
| Body permutation | `2755A092A086CADF822A722370D298F9` |
| Date epoch | Dec 31, 2000 (day 1 = Jan 1, 2001) |
| Meal types | Breakfast=0, Lunch=1, Dinner=2, Snacks=3 |
| Fractions | Sent as decimals — 1¼=1.25, 1⅓=1.333, etc. |

---

## App Pages

| Page | Description |
|---|---|
| **AI Food Log** | Upload photos or type a description → AI analysis → review → log to Lose It! |
| **Manual Entry** | Paste pre-formatted food item text directly (no AI, instant log) |
| **Login** | Firebase Google OAuth with email whitelist |

---

## Directory Map

```
FoodLog/
├── netlify/
│   └── functions/
│       ├── food-log.ts       — GWT RPC food + water logging
│       └── food-analyze.ts   — OpenAI structured output analysis
├── src/
│   ├── lib/
│   │   ├── openai.ts         — AI analysis client, normalization, icons, serving types
│   │   └── api.ts            — Frontend → Netlify function bridge
│   ├── pages/
│   │   ├── FoodLogPage.tsx   — AI analysis page
│   │   └── ManualPage.tsx    — Manual entry page
│   └── types/                — TypeScript types
├── mobile/                   — iOS companion app (React Native / Expo SDK 54)
│   └── README.md             — Mobile setup, build, and update instructions
├── docs/
│   ├── har_files/            — HAR captures used to reverse-engineer the GWT protocol
│   ├── archive/              — Old Selenium architecture docs
│   └── FoodLog - Lose It! API Migration Plan.md
├── firebase.json             — Firebase CLI config (Firestore + Storage rules)
├── firestore.rules           — Firestore security rules (includes mealDrafts subcollection)
├── firestore.indexes.json    — Firestore composite index definitions
├── storage.rules             — Firebase Storage rules (meal draft photos)
├── netlify.toml
└── .env.example
```

---

## Migration from Selenium

Prior to April 2026, food logging used Selenium browser automation running on a Windows machine. The Netlify function approach is ~50× faster and requires no always-on machine.

The old architecture is documented in [`docs/archive/selenium-architecture.md`](docs/archive/selenium-architecture.md). The Windows machine at `api.theespeys.com` still runs the original Selenium stack unchanged and can be used as a fallback.

---

## Troubleshooting

**Food logging fails / session expired banner** — The Lose It! cookie has expired (short-lived session tokens). Click the ⚙ gear in the navbar, paste a fresh cookie from DevTools. The app detects this automatically and opens the Settings modal.

**Analysis is slow** — Normal for GPT-4o-mini with images: 3–8 seconds. The function calls OpenAI directly so there's no additional network hop.

**Switching AI models** — If you notice consistent accuracy problems on complex plated dishes or unusual restaurant items, try `gpt-4.1-mini`. It's newer, slightly sharper, and still fast. Change `OPENAI_MODEL=gpt-4.1-mini` in `.env` and in Netlify env vars — no code change needed.

**Port 8888 or 9999 already in use** — Run `kill $(lsof -ti :8888 :9999)` then `npm run dev:all`. Vite uses `strictPort: true` on 8888; the functions server uses 9999.

**Firebase CORS errors in browser console** — Usually an ad blocker (uBlock Origin, etc.) blocking Firestore WebSocket traffic. Whitelist `localhost:8888` in your extension settings.
