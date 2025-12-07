# FoodLog AI
**Scope**: This README replaces prior selected overview docs

## Overview
Modern React app that analyzes food photos with AI and logs to Lose It! automatically. Replaces manual food logging with intelligent estimation from restaurant photos and descriptions. Uses OpenAI GPT-4o-mini for nutritional analysis via Flask backend proxy (CORS-compliant) and connects to a Windows-based Flask API for Selenium automation. Supports public demo mode with authentication required only for logging actions.

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
Required environment variables:

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
- **POST /food_log** — Log food items to Lose It! with verification
- **GET /health** — API health check
- **POST /food_log/analyze** — AI food analysis with image upload

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
│   │   ├── ui/              # Reusable UI components (Button, Card, Input, ImageUpload)
│   │   └── Layout/          # Layout components (Navbar, RequireAuth)
│   ├── pages/               # App pages (FoodLogPage, ManualPage, LoginPage)
│   ├── lib/
│   │   ├── openai.ts        # AI analysis via Flask backend proxy with serving size fixes
│   │   ├── api.ts            # Backend API client for food logging
│   │   ├── foodValidator.ts  # TypeScript validation for AI output
│   │   └── firebaseConfig.ts # Firebase configuration
│   ├── context/             # AuthContext for Firebase authentication
│   └── types/               # TypeScript type definitions
├── flask/                   # Legacy Flask implementation (archived)
├── scripts/                 # Pre-commit hooks and deploy:watch script
└── netlify.toml            # Netlify deployment configuration
```

## Troubleshooting
- 🔗 **CORS Issues**: OpenAI API calls routed through Flask backend proxy for CORS compliance
- ⏱️ **Firebase Timeout**: Improved offline detection and timeout handling
- 🔧 **TypeScript Build**: All unused variables and imports cleaned up
- 🖼️ **Photo Upload**: WebP compression with 1280px max dimension
- 🤖 **AI Analysis**: Multi-level regex fixes for malformed serving sizes, backend proxy handles OpenAI API calls
- 🔐 **API Keys**: Pre-commit hooks prevent accidental commits of sensitive data
- 🌐 **Chrome Profile**: Run setup scripts to create initial profile for Lose It! login
- 🎨 **Theme**: Defaults to system theme preference, supports light/dark/system modes

## AI Handoff
Read this README, scan the repo, prioritize core functions and env-safe areas, keep env and rules aligned with this file. The OpenAI prompt is implemented in `src/lib/openai.ts` with comprehensive nutritional analysis capabilities and serving size validation.