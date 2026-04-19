# FoodLog AI
**Scope**: This README replaces prior selected overview docs

## Overview
Modern React app that analyzes food photos with AI and logs to Lose It! automatically. Replaces manual food logging with intelligent estimation from restaurant photos and descriptions. Uses OpenAI GPT-4o-mini with Structured Outputs (JSON schema) for nutritional analysis via Flask backend proxy (CORS-compliant) and connects to a Windows-based Flask API for Selenium automation. Supports public demo mode with authentication required only for logging actions. Features proper title case formatting, 60-character food name limits, and comprehensive validation for accurate parsing.

## Live and Admin
- 🌐 **App URL**: https://foodlog.theespeys.com
- 🔥 **Firebase Console**: foodlog-318c3
- 🚀 **Netlify Dashboard**: foodlog-theespeys
- 🐍 **Flask API**: https://api.theespeys.com/food_log
- 📊 **Monitoring**: Sentry integration for error tracking

## Tech Stack
- ⚛️ **Frontend**: React 19 + TypeScript + Vite 7.1.2 + Tailwind CSS
- 🔥 **Backend**: Firebase Google Auth + Windows Flask API
- 🤖 **AI**: OpenAI GPT-4o-mini with web search capability
- 🚀 **Hosting**: Netlify (frontend) + Windows API (backend)
- 🎨 **UI**: Headless UI + Framer Motion + Lucide React icons
- 🔐 **Auth**: Firebase Google OAuth (restricted: YOUR_EMAIL)

## Quick Start
```bash
git clone https://github.com/bradyespey/food-log
cd FoodLog
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env` and fill in values. See `.env.example` for all required variables.

### Required Environment Variables

All variables should be set in `.env` (copy from `.env.example`):


```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=foodlog-318c3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=foodlog-318c3
VITE_FIREBASE_STORAGE_BUCKET=foodlog-318c3.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID

# OpenAI Configuration
VITE_OPENAI_API_KEY=YOUR_OPENAI_API_KEY
VITE_OPENAI_MODEL=gpt-4o-mini

# API Configuration
VITE_API_BASE_URL=https://api.theespeys.com
VITE_API_USERNAME=YOUR_USERNAME
VITE_API_PASSWORD=YOUR_PASSWORD

# Allowed Email Addresses
VITE_ALLOWED_EMAILS=YOUR_EMAIL
```

## Run Modes (Debug, Headless, Profiles)
- 🐛 **Debug Mode**: Manual execution (`python app.py`) shows Chrome visible for debugging
- 👻 **Headless Mode**: Service execution (NSSM) runs Chrome hidden for normal operation
- 🌐 **Chrome Profiles**: Uses persistent Chrome profile (`chrome_profile/loseit_profile`) for fast login with automatic fallback to credential login

## Scripts and Ops
- 🔧 **Development**: `npm run dev` — Start local development server
- 🏗️ **Build**: `npm run build` — Build for production with TypeScript compilation
- 🔍 **Lint**: `npm run lint` — ESLint code checking
- 👀 **Preview**: `npm run preview` — Preview production build
- 🚀 **Deploy Watch**: `npm run deploy:watch` — Push to GitHub and monitor Netlify build completion
- 🔒 **Security**: Pre-commit hooks prevent API key leaks (see `scripts/` folder)
- 🧪 **Testing**: Production test suite with 4 essential tests (login, food, water, comprehensive)

### Windows Backend API Endpoints
- **POST /food_log** — Log food items to Lose It! with verification (returns verification status for each item)
- **GET /health** — API health check
- **POST /food_log/analyze** — AI food analysis with image upload using OpenAI Structured Outputs (JSON schema). Accepts `systemPrompt` parameter for custom AI instructions. Returns items with `entry_id` field for multi-entry tracking

## Deploy
- 🚀 **Frontend**: Automatic via GitHub integration to Netlify
- 📦 **Build Command**: `npm run build`
- 📁 **Publish Directory**: `dist`
- 🌐 **Domains**: foodlog.theespeys.com (primary), foodlog-theespeys.netlify.app

## App Pages / Routes
- 🤖 **AI Analysis**: Main food logging interface with photo upload, AI analysis, and multi-card food entry system (public demo, auth required for logging)
  - **Multi-Entry System**: Starts with 2 food entry cards by default, supports adding more
  - **Photo Upload**: Drag from Finder or paste (⌘V) from clipboard. HEIC/HEIF converted to JPEG in-browser (heic2any). From Mac Photos, newest photos sometimes fail when dragged—use Copy (⌘C) in Photos then Paste (⌘V) here.
  - **Responsive Layout**: 3 cards per row on desktop, 2 on tablet, 1 on mobile
  - **Edit Mode**: Reorganized layout with full-width food name, compact serving/calories, and two-column nutrition grid
  - **Individual Reset**: Each food item card has its own Reset button in edit mode
- ✏️ **Manual Entry**: Direct food entry without AI for pre-formatted food items (public demo, auth required for logging). Accepts both line-by-line format (one field per line) and paragraph format (e.g. single-line paste from AI sidebar). Normalizes Serving Size variants like `12 (fluid ounces)` to `12 fluid ounces`. Separate multiple items with blank lines or by "Food Name:" in paragraph paste.
- 🔐 **Login**: Firebase Google authentication with email whitelist
- 🔄 **Auth Callback**: OAuth flow completion handler

## Directory Map
```
FoodLog/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components (Button, Card, Input, ImageUpload with HEIC conversion, SearchableSelect)
│   │   └── Layout/          # Layout components (Navbar, RequireAuth)
│   ├── pages/               # App pages (FoodLogPage, ManualPage, LoginPage)
│   ├── lib/
│   │   ├── openai.ts        # AI analysis via Flask backend proxy with Structured Outputs, proper casing, 60-char name limits, and post-processing normalization
│   │   ├── api.ts            # Backend API client for food logging
│   │   ├── foodValidator.ts  # TypeScript validation for AI output
│   │   └── firebaseConfig.ts # Firebase configuration
│   ├── context/             # AuthContext for Firebase authentication
│   └── types/               # TypeScript type definitions
├── flask/                   # Legacy Flask implementation (archived)
├── scripts/                 # Pre-commit hooks and deploy:watch script
└── netlify.toml            # Netlify deployment configuration
```

## Key Features

### UI/UX Improvements
- **Responsive Layout**: Analysis cards display 3 per row on desktop (lg), 2 on tablet (md), 1 on mobile
- **Multi-Entry Default**: Starts with 2 food entry cards for faster workflow
- **Navbar Integration**: Add Food Item button moved to navbar, logo click clears page
- **Toast Styling**: Improved toast notifications that blend with theme colors
- **Edit Card Layout**: Reorganized into clear rows with better spacing and mobile responsiveness
- **Individual Reset**: Each food item in analysis results can be reset independently

### Food Item Editing
- **Searchable Dropdowns**: Icon and serving unit fields use searchable dropdowns (SearchableSelect component) to prevent invalid values that break automation
- **Icon Selection**: 350+ food icons available via searchable dropdown (e.g., type "Choc" to find all chocolate-related icons)
- **Serving Unit Validation**: All serving units must match valid LoseIt types (prevents manual typing errors)
- **Edit Mode Layout**: Organized into 4 rows: food name + buttons, restaurant + type, serving + calories, nutrition grid
- **Mobile Optimized**: Edit card stacks vertically on mobile with larger touch targets

### AI Analysis & Normalization
- **Food Name Standardization**: Automatically simplifies verbose descriptions (e.g., "3 corn tortilla tacos with lots of shredded cheese, chicken, and butter" → "Chicken and Cheese Tacos")
- **Serving Size Detection**: Detects quantity words and converts to proper units (e.g., "3 tacos" → "3 Each", drinks → "Fluid Ounce")
- **Missing Nutrition Fill**: Auto-fills realistic estimates when AI returns all zeros (prevents broken food entries)
- **EntryID Tracking**: Each food entry includes EntryID to prevent meal/date leakage between entries with same date/brand

### Post-Processing Pipeline
All AI responses go through normalization:
1. **Name Standardization**: Removes quantity words, simplifies verbose descriptions
2. **Serving Normalization**: Forces countable items to "Each", drinks to "Fluid Ounce", converts metric units
3. **Nutrition Fill**: Provides realistic defaults for missing values
4. **Deduplication**: Removes duplicate items before display

## Troubleshooting
- 🔗 **CORS Issues**: Flask API server configured to allow requests from localhost:5177 (development) and production domains. Production uses Nginx for CORS (no duplicate headers)
- ⏱️ **Firebase Timeout**: Improved offline detection and timeout handling
- 🔧 **TypeScript Build**: All unused variables and imports cleaned up
- 🖼️ **Photo Upload**: WebP compression with 1280px max dimension. HEIC/HEIF from iPhone or Photos converted to JPEG in-browser. Mac Photos: drag works for many photos; if the newest photos fail, use Copy (⌘C) in Photos then Paste (⌘V) in the app. Global ⌘V adds clipboard image to first entry with room.
- 🤖 **AI Analysis**: Uses OpenAI Structured Outputs (JSON schema) for reliable parsing. Post-processing normalization ensures LoseIt-compatible output. Fallback text parsing handles malformed serving sizes and markdown formatting
- 🔐 **API Keys**: Pre-commit hooks prevent accidental commits of sensitive data
- 🌐 **Chrome Profile**: Run setup scripts to create initial profile for Lose It! login
- 🎨 **Theme**: Defaults to system theme preference, supports light/dark/system modes
- 📝 **AI Output Format**: Structured JSON response with proper title case formatting, 60-character food name limits, validation against defined serving types/icons lists, and automatic normalization
- ✏️ **Edit Mode**: Searchable dropdowns for icon and serving unit prevent invalid manual entries

## Core Functions

### `src/lib/openai.ts`
- **`analyzeFood()`**: Main entry point for AI food analysis. Handles image compression, API communication, and response normalization
- **`normalizeFoodItem()`**: Post-processes AI responses to ensure LoseIt compatibility (name standardization, serving fixes, nutrition fill)
- **`standardizeFoodName()`**: Simplifies verbose food names and removes quantity words
- **`normalizeServingForLoseIt()`**: Forces countable items to "Each", drinks to "Fluid Ounce", converts metric units
- **`fillMissingNutrition()`**: Provides realistic estimates when AI returns zeros
- **`deduplicateItems()`**: Removes duplicate food items based on name/date/meal/brand
- **`validateIcon()`**: Validates icon names against ICON_LIST with fallback mappings
- **`ICON_OPTIONS`**: Exported array of all valid food icons (350+)
- **`SERVING_UNIT_OPTIONS`**: Exported array of all valid serving units

### `src/pages/ManualPage.tsx`
- **`parsePastedFoodText(raw)`**: Parses pasted text into food item strings. Supports (1) line-based format (fields on separate lines, items separated by blank lines) and (2) paragraph format (all fields on one line per item, e.g. from AI sidebar). Splits by double newline or by "Food Name:" for paragraph paste.
- **`parseParagraphItem(paragraph)`**: Extracts key-value pairs from a single paragraph and returns line-based format for the backend.
- **`normalizeServingSizeValue(val)`**: Converts "12 (fluid ounces)" to "12 fluid ounces" and "(ounces)" to "ounces" for backend compatibility.
- **`isLineBasedFormat(block)`**: Detects whether a block is already line-based (multiple lines with "Date:" etc.) so it can be passed through unchanged.

### `src/components/ui/ImageUpload.tsx`
- **`ImageUpload`**: Drag-and-drop and click-to-select image upload. Converts HEIC/HEIF to JPEG via heic2any for preview and analysis. Materializes size-0/no-type files (e.g. Mac Photos references). Retries read/conversion once for lazy Photos. Preview shows "Preview unavailable" on decode failure. Hint and error direct Mac Photos users to Copy (⌘C) then Paste (⌘V) when drag fails for newest photos.
- **`convertHeicToJpeg(file)`**: Reads file into ArrayBuffer, passes blob to heic2any, returns JPEG File. Retries once on failure.
- **`materializeFile(file)`**: For files with size 0 or no type, reads arrayBuffer and returns a new File with correct type so preview/analyze work.
- **`isHeic(file)`**: True if type is image/heic or image/heif or filename ends in .heic/.heif.

### `src/components/ui/SearchableSelect.tsx`
- **`SearchableSelect`**: Reusable searchable dropdown component with keyboard navigation. Used for icon and serving unit selection in edit mode

### `src/components/Layout/Navbar.tsx`
- **Navbar Actions**: 
  - Logo click clears/resets the page (equivalent to Clear button)
  - "Add Food Item" button in navbar (dashboard page only)
  - "Sample Data" button (renamed from "Load Sample Data")
  - Toast notifications styled to blend with theme

### `src/pages/FoodLogPage.tsx`
- **EntryID System**: Each food entry card has unique ID. Analysis prompt includes `EntryID: <id>` per entry. Frontend maps items back to correct entry using EntryID to prevent meal/date leakage
- **Global ⌘V / Ctrl+V**: Pastes image from clipboard into the first food entry that has fewer than 5 images. Skips when focus is in an input/textarea. Uses foodEntriesRef for current state. For Mac Photos workflow: Copy photo in Photos then Paste in app.
- **Multi-Entry State**: Initializes with 2 food entry cards. Empty cards are automatically skipped during analysis
- **Edit Mode Layout**: 
  - Row 1: Food name (full width) + Reset/Save/Cancel buttons (top right)
  - Row 2: Restaurant input + Food Type selector
  - Row 3: Serving (amount + unit) + Calories input
  - Row 4: Nutrition grid (left: fat, sat fat, chol, sodium | right: carbs, fiber, sugar, protein)
- **Individual Reset**: Each food item in analysis results has a Reset button to revert to original values
- **Responsive Design**: Edit card stacks vertically on mobile with larger touch targets

### `src/App.tsx`
- **SampleDataContext**: Provides global access to loadSampleData, clearData, and addFoodEntry functions for navbar integration
- **Multi-Entry State**: Initializes with 2 food entry cards. Empty cards are automatically skipped during analysis
- **Edit Mode Layout**: 
  - Row 1: Food name (full width) + Reset/Save/Cancel buttons (top right)
  - Row 2: Restaurant input + Food Type selector
  - Row 3: Serving (amount + unit) + Calories input
  - Row 4: Nutrition grid (left: fat, sat fat, chol, sodium | right: carbs, fiber, sugar, protein)
- **Individual Reset**: Each food item in analysis results has a Reset button to revert to original values
- **Responsive Design**: Edit card stacks vertically on mobile with larger touch targets

## AI Handoff
Read this README, scan the repo, prioritize core functions and env-safe areas, keep env and rules aligned with this file. The OpenAI prompt is implemented in `src/lib/openai.ts` with comprehensive nutritional analysis capabilities, serving size validation, and post-processing normalization for LoseIt compatibility.