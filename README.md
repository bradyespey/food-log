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

# Install 1Password CLI (if not already installed)
brew install --cask 1password-cli

# Set up 1Password Environment (see Environment section below)
npm run dev
```

## Environment

**All projects use 1Password Developer Environments for local environment variables.** This allows seamless setup on any computer without managing local `.env` files.

### 1Password Setup

1. **Enable 1Password Developer**:
   - Open 1Password desktop app
   - Settings → Developer → Turn on "Show 1Password Developer experience"

2. **Create Environment**:
   - Go to Developer → Environments (Espey Family account)
   - Create new environment: `FoodLog`
   - Import `.env` file or add variables manually

3. **Install 1Password CLI**:
   ```bash
   brew install --cask 1password-cli
   ```

4. **Run Project**:
   ```bash
   npm run dev
   ```
   - The `dev` script uses `op run --env-file=.env -- vite` to automatically load variables from 1Password
   - No local `.env` file needed

### Required Environment Variables

All variables should be stored in your 1Password Environment:

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
- ✏️ **Manual Entry**: Direct food entry without AI for pre-formatted food items (public demo, auth required for logging)
- 🔐 **Login**: Firebase Google authentication with email whitelist
- 🔄 **Auth Callback**: OAuth flow completion handler

## Directory Map
```
FoodLog/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components (Button, Card, Input, ImageUpload, SearchableSelect)
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

### Food Item Editing
- **Searchable Dropdowns**: Icon and serving unit fields use searchable dropdowns (SearchableSelect component) to prevent invalid values that break automation
- **Icon Selection**: 350+ food icons available via searchable dropdown (e.g., type "Choc" to find all chocolate-related icons)
- **Serving Unit Validation**: All serving units must match valid LoseIt types (prevents manual typing errors)

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
- 🖼️ **Photo Upload**: WebP compression with 1280px max dimension
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

### `src/components/ui/SearchableSelect.tsx`
- **`SearchableSelect`**: Reusable searchable dropdown component with keyboard navigation. Used for icon and serving unit selection in edit mode

### `src/pages/FoodLogPage.tsx`
- **EntryID System**: Each food entry card has unique ID. Analysis prompt includes `EntryID: <id>` per entry. Frontend maps items back to correct entry using EntryID to prevent meal/date leakage

## AI Handoff
Read this README, scan the repo, prioritize core functions and env-safe areas, keep env and rules aligned with this file. The OpenAI prompt is implemented in `src/lib/openai.ts` with comprehensive nutritional analysis capabilities, serving size validation, and post-processing normalization for LoseIt compatibility.