# FoodLog Mobile

iOS companion app to [foodlog.theespeys.com](https://foodlog.theespeys.com). Same Firebase project, Firestore schema, and Netlify backend as the web app. Captures meal photos on your iPhone, analyzes them with OpenAI, and logs to Lose It! — all from your pocket.

**The app connects directly to Firebase and Netlify just like the web app. You only rebuild when you make code changes.**

---

## How It Works

```
iPhone
  │
  ├── Photos → local device storage (expo-file-system documentDirectory)
  ├── Draft metadata → Firestore: users/{uid}/mealDrafts/{draftId}
  ├── POST /.netlify/functions/food-analyze → OpenAI GPT-4o-mini
  └── POST /.netlify/functions/food-log     → Lose It! GWT RPC
```

Photos never touch Firebase Storage or the camera roll. They live in the app's private document directory and survive app restarts. Lose It! cookie is shared with the web app via Firestore (`users/{uid}/settings/loseit`).

---

## Quick Start

```bash
cd mobile
npm install
cp .env.example .env
# Fill in all EXPO_PUBLIC_* values (see Environment Variables below)
```

---

## Environment Variables

| Variable | Where to get it |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Mirror `VITE_FIREBASE_API_KEY` from root `.env` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Mirror root `.env` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Mirror root `.env` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Mirror root `.env` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Mirror root `.env` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Mirror root `.env` |
| `EXPO_PUBLIC_ALLOWED_EMAILS` | Same comma-separated list as root `VITE_ALLOWED_EMAILS` |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | GCP Console → Credentials → iOS OAuth client (bundle ID `com.theespeys.foodlog`) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | GCP Console → Credentials → "Web client (auto created by Google Service)" |
| `EXPO_PUBLIC_API_BASE_URL` | `https://foodlog.theespeys.com` (default) |

---

## Building and Installing on iPhone

**First-time setup** requires Xcode installed and iPhone plugged in via USB with Developer Mode enabled (iPhone Settings → Privacy & Security → Developer Mode).

### Step 1 — Add your Apple ID to Xcode

Xcode → Settings → Accounts → + → Apple ID → sign in. Then Manage Certificates → + → Apple Development.

### Step 2 — Set signing team in Xcode

Open `mobile/ios/FoodLog.xcworkspace` in Xcode. Click the FoodLog project → Signing & Capabilities → Team: your personal team → Automatically manage signing ✓.

### Step 3 — Build and install

```bash
cd mobile

# Bundle the JS into the app (required for standalone — no Metro server needed)
npx expo export:embed \
  --platform ios \
  --dev false \
  --bundle-output ios/FoodLog/main.jsbundle \
  --assets-dest ios/FoodLog

# Build native app and install on plugged-in iPhone
npx expo run:ios --device --configuration Release
```

First build takes 10–15 minutes. After install, unplug your iPhone — **the app works completely standalone** with no Mac, no Metro server, no WiFi requirement.

**Trust the developer certificate on iPhone after install:**
Settings → General → VPN & Device Management → your Apple ID → Trust.

---

## Updating the App

This app is installed on the iPhone as a standalone Release build through Xcode. It is **not** running in Expo Go, does **not** use Metro at runtime, and does **not** currently use OTA updates. Every mobile code change needs a new local build/install.

### JavaScript, TypeScript, screen, style, or logic changes

Run both commands:

```bash
cd mobile
npx expo export:embed --platform ios --dev false --bundle-output ios/FoodLog/main.jsbundle --assets-dest ios/FoodLog
npx expo run:ios --device --configuration Release
```

The first command bundles the updated JavaScript into the native app. The second command recompiles and reinstalls the Release app on the connected iPhone. Subsequent builds are much faster (~3–5 min) because Xcode caches the native layer.

### Native config, package, or Expo library changes

If you change `app.json`, `package.json`, or add a package with native code, run prebuild first:

```bash
cd mobile
npx expo prebuild --platform ios
npx expo export:embed --platform ios --dev false --bundle-output ios/FoodLog/main.jsbundle --assets-dest ios/FoodLog
npx expo run:ios --device --configuration Release
```

Use this path when adding native libraries such as `expo-camera` or `@react-native-community/datetimepicker`.

### Netlify function changes only

No iPhone rebuild is needed. The mobile app calls the production FoodLog URL directly, so function changes go live after deploy:

```bash
cd ..
npm run deploy:watch
```

### Firestore rules or index changes only

No iPhone rebuild is needed:

```bash
cd ..
firebase deploy --only firestore:rules,firestore:indexes
```

**Note on free Apple ID provisioning:** The installed app expires every 7 days. Re-run the build command to renew it. A paid Apple Developer account ($99/year) eliminates this limit.

---

## App Flow

```
Login (Google OAuth)
  │
  └── Tabs
        ├── Today    — drafts captured today
        ├── Capture  — camera + library picker
        ├── Drafts   — all pending drafts
        └── Settings — account, Lose It! cookie, sign out

Capture flow (full-screen, no tab bar):
  Capture → Draft Detail → Analyzing → Review results → Log to Lose It!
```

**Quick save:** On the Capture screen, tap **Save** (green) to store photos and go straight back to Drafts without filling out any form. Come back and analyze later.

**Draft Detail** — fill in date (calendar picker), meal, brand, and description, then tap **Analyze with AI**. Brand and description are optional if you have a photo.

**Review** — edit food items, use the multiplier, delete items, toggle water logging, then **Log to Lose It!** with per-item verification.

---

## Data

**Firestore** (`users/{uid}/mealDrafts/{draftId}`):
```
status: 'pending' | 'analyzed' | 'logged'
source: 'mobile'
meal, date, brand, note
```

`capturing` is also used briefly while the camera is open. It is hidden from Today/Drafts until the user saves or analyzes the draft.

**Local device** (`{documentDirectory}/drafts/{draftId}/{photoId}.jpg`):
Photos are stored privately on the device. The index is saved to AsyncStorage (`fl_local_photos`). If you delete and reinstall the app, photos are lost but draft metadata survives.

**Firestore rules** — deploy once from the repo root:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Architecture Notes

| File | Purpose |
|---|---|
| `src/lib/firebase.ts` | Firebase init with AsyncStorage auth persistence |
| `src/lib/drafts.ts` | Firestore CRUD, live `onSnapshot` subscription |
| `src/lib/api.ts` | `analyzeFood` + `logFood` — calls production Netlify functions |
| `src/lib/localPhotoStorage.ts` | expo-file-system photo copy + AsyncStorage index |
| `src/context/AuthContext.tsx` | Google OAuth via expo-auth-session, email whitelist |
| `src/context/DraftsContext.tsx` | Global drafts state (Firestore) + analyses (in-memory) |
| `src/screens/CaptureScreen.tsx` | expo-camera + expo-image-picker |
| `src/screens/DraftDetailScreen.tsx` | Metadata form + date picker, triggers analysis |
| `src/screens/ReviewScreen.tsx` | Edit items, multiply, delete, log to Lose It! |
| `src/components/FoodItemCard.tsx` | Collapsed card + edit sheet (mirrors web app) |

---

## Troubleshooting

**Build fails with "No code signing certificates"** — Add your Apple ID in Xcode → Settings → Accounts, then Manage Certificates → + → Apple Development.

**"App not trusted" on iPhone** — Settings → General → VPN & Device Management → your Apple ID → Trust.

**App expired after 7 days** — Re-run the build commands. Free Apple ID provisioning expires every 7 days.

**Google Sign-In fails** — Make sure the redirect URI `https://auth.expo.io/@baespey/foodlog-mobile` is in the Web OAuth client's Authorized Redirect URIs in GCP Console.

**Logging fails** — The Lose It! session cookie may have expired. Update it via the web app's ⚙ Settings modal (saves to Firestore, applies to both web and mobile instantly). Sign out of loseit.com and back in to get fresh tokens, then copy the Cookie header from DevTools.

**Today/Drafts show empty** — Firestore index may still be building. Wait a few minutes and pull-to-refresh.
