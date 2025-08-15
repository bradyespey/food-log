# FoodLog AI Project Overview

## Overview
Modern React app that analyzes food photos with AI and logs to Lose It! automatically. Replaces manual food logging with intelligent estimation from restaurant photos and descriptions.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Hosting**: Netlify (foodlog.theespeys.com)
- **Auth**: Firebase Google Auth
- **AI**: OpenAI GPT-4o-mini for food analysis
- **Backend**: Flask API on Windows (api.theespeys.com/food_log)
- **Automation**: Selenium for Lose It! logging

## Setup Steps
1. Clone repo: `git clone https://github.com/bradyespey/food-log`
2. Install: `npm install`
3. Copy `.env`: `cp docs/env_sample.txt .env`
4. Add Firebase config (foodlog-318c3 project)
5. Add OpenAI API key
6. Run: `npm run dev`
7. Deploy: Push to GitHub → Auto-deploy to Netlify

## Code Base
- **`src/pages/FoodLogPage.tsx`**: Main UI component
- **`src/lib/openai.ts`**: AI analysis logic
- **`src/lib/api.ts`**: Backend food logging
- **`src/context/AuthContext.tsx`**: Firebase auth
- **`docs/OPENAI_PROMPT.md`**: AI prompt documentation

## Current Status
- ✅ UI complete with photo upload
- ✅ OpenAI integration working with system/user separation
- ✅ Multi-item parsing with validation
- ✅ Firebase auth configured with fast loading
- ✅ Exact icon/serving validation (400+ icons)
- ✅ Performance optimized (2-3s load instead of 30s)
- 🔄 Testing complete flow

## Next Steps
1. Test full flow with restaurant photos
2. Deploy to Netlify with env variables
3. Connect Windows backend API
4. Add error monitoring (Sentry)
5. Performance tuning
