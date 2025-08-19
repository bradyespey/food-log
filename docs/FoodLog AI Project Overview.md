# FoodLog AI Project Overview

## Project Migration History
**Moved from:** Original Flask-based food logging system hosted on Windows desktop with Selenium automation
**New Architecture:** Modern React frontend + Windows backend API approach
**Reason for Change:** User wanted Mac-based development with modern UI, while preserving existing Selenium automation scripts

## Overview
Modern React app that analyzes food photos with AI and logs to Lose It! automatically. Replaces manual food logging with intelligent estimation from restaurant photos and descriptions. The app uses OpenAI GPT-4o-mini for nutritional analysis and connects to a Windows-based Flask API for Selenium automation.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite 7.1.2, Tailwind CSS 3.4.0
- **Hosting**: Netlify (foodlog.theespeys.com)
- **Auth**: Firebase Google Auth (Project: foodlog-318c3)
- **AI**: OpenAI GPT-4o-mini with web search capability
- **Backend**: Flask API on Windows (api.theespeys.com/food_log)
- **Automation**: Selenium for Lose It! logging (existing Windows scripts)
- **Build Tools**: PostCSS, Autoprefixer
- **UI Components**: Headless UI, Custom Theme Provider, Framer Motion, Lucide React icons

## Project Structure
```
FoodLog/
├── src/
│   ├── components/
│   │   └── ui/           # UI components (Button, Card, Input, ImageUpload)
│   ├── context/
│   │   └── AuthContext.tsx  # Firebase authentication context
│   ├── lib/
│   │   ├── openai.ts     # AI analysis with serving size fixes
│   │   ├── foodValidator.ts  # TypeScript validation for AI output
│   │   └── api.ts        # Backend API calls (to be implemented)
│   ├── pages/
│   │   ├── FoodLogPage.tsx  # Main food logging interface with AI
│   │   └── ManualPage.tsx   # Direct food entry without AI
│   ├── types/
│   │   └── index.ts      # TypeScript type definitions
│   └── App.tsx           # Main app component with routing
├── docs/
│   ├── env_sample.txt    # Environment variables template
│   └── FoodLog AI Project Overview.md
├── static/               # Static assets
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind configuration
├── postcss.config.js     # PostCSS configuration
└── vite.config.ts        # Vite build configuration
```

## Setup Steps

### 1. Environment Setup
```bash
# Clone repository
git clone https://github.com/bradyespey/food-log
cd FoodLog

# Install dependencies
npm install

# Copy environment template
cp docs/env_sample.txt .env
```

### 2. Environment Variables (.env)
```bash
# Firebase Configuration (Project: foodlog-318c3)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=foodlog-318c3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=foodlog-318c3
VITE_FIREBASE_STORAGE_BUCKET=foodlog-318c3.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_MODEL=gpt-4o-mini

# Allowed Email Addresses (Firebase Auth)
VITE_ALLOWED_EMAILS=baespey@gmail.com
```

### 3. Firebase Project Setup
- **Project Name**: foodlog-318c3
- **Authentication**: Google Auth enabled
- **Web App**: Configured for foodlog.theespeys.com
- **Allowed Domains**: foodlog.theespeys.com, localhost:5173

### 4. Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 5. Netlify Deployment

## Technical Challenges & Solutions

### CORS Configuration
- **Issue**: Cross-origin requests blocked between React frontend and Flask API
- **Solution**: Configured explicit allowed origins and proper CORS headers with resource mapping
- **Status**: ✅ Resolved (Food logging working, Chrome visible on Windows)

### Firestore Connection Errors
- **Issue**: Persistent "Failed to get document because the client is offline" errors
- **Solution**: Added offline detection, timeout handling, and improved error handling for network issues
- **Status**: ✅ Resolved

### TypeScript Build Errors
- **Issue**: Netlify build failing due to unused variables and imports
- **Solution**: Cleaned up all unused code and fixed TypeScript compilation
- **Status**: ✅ Resolved
- **Repository**: https://github.com/bradyespey/food-log
- **Domain**: foodlog.theespeys.com
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**: Copy from .env to Netlify dashboard

## Code Base Details

### Core Components

#### `src/pages/FoodLogPage.tsx`
- **Purpose**: Main food logging interface
- **Features**: 
  - Photo upload (drag & drop + camera)
  - Form inputs (Date, Meal, Brand/Restaurant, Description)
  - AI analysis results display with corrected serving sizes
  - Copy results in ChatGPT format
  - Log to backend button
  - Analyze/Clear buttons in header for better UX
- **State Management**: React hooks for form data and AI results
- **Photo Handling**: WebP compression, 1280px max dimension

#### `src/lib/openai.ts`
- **Purpose**: OpenAI API integration with comprehensive serving size fixes
- **Key Functions**:
  - `analyzeFood()`: Main analysis function with web search capability
  - `fixServingSizes()`: Multi-level regex fixes for malformed serving sizes
  - `buildSystemPrompt()`: Structured prompt with exact ChatGPT Custom GPT format
- **Web Search**: Uses OpenAI's built-in web_search tool for restaurant menu lookups
- **Fallback**: Gracefully falls back to standard completion if web search fails
- **Cost Optimization**: Client-side image compression, gpt-4o-mini model

#### `src/lib/foodValidator.ts`
- **Purpose**: TypeScript validation and normalization of AI output
- **Constants**: 
  - `ICONS`: 400+ allowed icon values
  - `UNITS`: Allowed serving size units
  - `SERVING_TYPES`: Valid serving type patterns
- **Functions**:
  - `validateAndNormalizeResponse()`: Main validation pipeline
  - `normalizeServingSize()`: Fixes malformed patterns like "0.5 5 serving"
  - `normalizeDateField()`: Forces MM/DD format
  - `normalizeHydration()`: Only shows for liquids with fluid ounces > 0

#### `src/context/AuthContext.tsx`
- **Purpose**: Firebase authentication with performance optimization
- **Features**:
  - Google OAuth integration
  - Email whitelist (baespey@gmail.com)
  - 1-second Firebase initialization delay for faster UI rendering
  - Session management and user role handling

### UI/UX Features
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Advanced Theme System**: Light/Dark/System modes with automatic system detection and persistence
- **Theme Toggle**: Dropdown menu with Light, Dark, and System options (matches HealthHub design)
- **Photo Upload**: Drag & drop from Mac Photos app, iPhone camera
- **Form Validation**: Required fields with real-time feedback
- **Loading States**: Spinners and progress indicators
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Success/error feedback
- **Real Sample Photos**: Uses actual user food photos with corrected names (mocktail, hummus, bread, steak) for testing
- **Dual Interface**: AI-powered analysis and manual entry options
- **Enhanced Dropdown Components**: Custom Headless UI components with proper styling

## Current Status

### ✅ Completed
- **Modern React UI**: Complete with photo upload and form handling
- **Firebase Authentication**: Google OAuth with email whitelist
- **OpenAI Integration**: GPT-4o-mini with web search capability
- **Multi-Item Parsing**: Handles multiple food items from single description
- **Serving Size Validation**: 400+ icons, comprehensive unit validation
- **Serving Size Fixes**: Multi-level regex fixes for malformed patterns (0.5 5 serving → 0.5 serving)
- **Performance Optimization**: 2-3s load time (down from 30s)
- **Photo Processing**: WebP compression, multiple upload support
- **Copy Functionality**: Exact ChatGPT Custom GPT format output
- **Hydration Logic**: Only displays for liquids with fluid ounces > 0
- **UI Improvements**: Analyze/Clear buttons moved to header, streamlined layout
- **Unified Windows API**: Consolidated Flask API server handling all automation endpoints
- **Basic Authentication**: Secure API access with username/password across all endpoints  
- **API Integration**: React app calls unified Windows API for Selenium automation
- **Selenium Integration**: Preserved existing automation scripts in modular structure
- **CORS Configuration**: Fixed cross-origin requests from React app to Windows API
- **Authentication Matching**: Frontend and backend API credentials properly synchronized
- **Sample Data Button**: Loads actual user food photos (hummus, mocktail, steak, bread) for testing
- **Manual Entry Page**: Direct food entry without AI for fallback scenarios
- **Debug Mode Toggle**: Environment variable control for Chrome browser visibility
- **Advanced Theme System**: Light/Dark/System modes with proper persistence and system detection
- **Enhanced UI Components**: Custom dropdown menus and improved form styling
- **Updated Branding**: Consistent naming and descriptions across all pages
- **Food Logging**: Working with Chrome visible on Windows backend
- **Error Handling**: Improved Firestore timeout handling and offline detection
- **NSSM Service Fix**: Resolved service configuration issues with correct Python path
- **UI Layout Improvements**: Nutrition display now matches Lose It! app with protein last
- **Multi-Card Food Analysis**: Added support for multiple food entries (breakfast, lunch, dinner) in single analysis
- **Brand Capture Fix**: AI now captures actual brand names (Merit, Keurig) instead of generic "Multiple"
- **Nutrition Column Layout**: Changed to top-down columns (Fat/Sat Fat/Cholesterol/Sodium | Carbs/Fiber/Sugars/Protein)
- **Manual Page Redesign**: Simplified to single textarea for pre-formatted food items, matching old LoseIt app functionality
- **Multi-Item Date Handling**: Fixed date mapping so each food item gets its correct individual date (08/17, 08/18, etc.)
- **Manual Logging Fix**: Resolved second item logging failure by matching exact backend API format expected
- **Firebase Configuration**: Added complete Firebase Google Auth setup for production deployment

### 🔄 In Progress
- **Error Monitoring**: Enhanced Sentry integration for API endpoints

### ❌ Not Started
- **Performance Monitoring**: Track API response times and costs

## Technical Challenges & Solutions

### 1. Serving Size Malformation
**Problem**: AI consistently returns malformed serving sizes like "0.5 5 serving", "1 1 serving"
**Solution**: Multi-level regex fixes applied before and during parsing with comprehensive pattern matching
**Status**: ✅ Resolved - All malformed patterns now automatically corrected

### 2. Performance Issues
**Problem**: 30-second page load time
**Solution**: 1-second Firebase initialization delay, lazy loading
**Status**: Resolved (2-3s load time)

### 3. Firebase Configuration Missing
**Problem**: App failing in production with `auth/invalid-api-key` error despite working locally
**Solution**: Added complete Firebase configuration for Google Auth (API key, auth domain, project ID, etc.)
**Status**: ✅ Resolved - Firebase Google Auth now properly configured for production deployment

### 4. AI Output Quality
**Problem**: Conservative estimates, single items instead of multiple
**Solution**: Enhanced prompts, web search capability, fallback parsing
**Status**: Implemented and working

### 5. Build Configuration
**Problem**: Tailwind CSS not processing, PostCSS errors
**Solution**: Proper .cjs config files, dependency version management
**Status**: Resolved

### 6. API Architecture Migration
**Problem**: Need to connect modern React frontend to existing Windows Selenium automation
**Solution**: Consolidated all Windows automation into unified Flask API server
**Status**: ✅ Implemented - Single API app replacing multiple individual services

### 7. CORS and Authentication Errors
**Problem**: "Failed to fetch" errors with CORS and 401 Unauthorized when logging food
**Solution**: 
- Fixed CORS configuration to allow localhost:5173 and production domain
- Synchronized API credentials between frontend (.env) and backend (VITE_API_USERNAME/VITE_API_PASSWORD)
- Added credentials support and proper Authorization headers
**Status**: ✅ Resolved - React app can now authenticate with Windows API

### 8. Multi-Item Food Analysis and Manual Logging
**Problem**: 
- Multi-card analysis not preserving individual entry dates (all items getting same date)
- Manual page logging failing for second food item
- AI analysis showing "Multiple" instead of actual brand names
- Nutrition display layout not matching Lose It! app format
**Solution**: 
- Updated `formatFoodItemForLogging` to map items to individual entry dates based on order
- Fixed Manual page to send data in exact format expected by backend (`food_items` array)
- Removed brand override logic that was forcing "Multiple" instead of actual brands
- Redesigned nutrition display to use top-down column layout matching Lose It! app
**Status**: ✅ Resolved - Multi-item analysis now preserves individual dates, Manual page works correctly, brands captured properly

### 9. Unified API Credentials Management
**Problem**: API credentials duplicated between frontend (.env) and backend (API_AUTH) requiring maintenance in two places
**Solution**: 
- Updated Windows Flask server to read VITE_API_USERNAME and VITE_API_PASSWORD
- Added fallback support for legacy API_AUTH format
- Single source of truth for API credentials across frontend and backend
**Status**: ✅ Resolved - Windows backend now uses same environment variables as frontend

**Implementation Details**:
- **Consolidation**: Merged Flask apps into single `/Volumes/Projects/API/` application
- **Script Preservation**: All Selenium automation scripts preserved in modular structure
- **Import Resolution**: Fixed Python import paths for new directory structure
- **Unified Logging**: Centralized logging to `C:/Projects/API/logs/`
- **Concurrent Execution**: Flask threading allows multiple endpoints to run simultaneously

## Next Steps

### Immediate (Next Session)
1. **Enhanced Error Monitoring**: Implement Sentry integration for better API error tracking
2. **Performance Optimization**: Monitor and optimize API response times
3. **User Experience Testing**: Gather feedback on multi-card analysis and manual logging features

**✅ Completed**:
- Unified API created and tested with all endpoints working
- Selenium automation confirmed working (Chrome browsers opening and executing)
- Chrome profile set up for Monarch Money authentication
- All import and path issues resolved
- Nginx configuration updated to proxy all endpoints to unified API

### Short Term
1. **Production Testing**: Test complete flow from React app to Lose It! logging
2. **Environment Variables**: Configure API credentials on both React and Windows sides
3. **Error Monitoring**: Enhanced Sentry integration for API endpoints

### Long Term
1. **Performance Monitoring**: Track API response times and costs
2. **User Experience**: Gather feedback and iterate on UI
3. **Feature Expansion**: Additional meal types, nutritional insights

## Dependencies & Versions

### Core Dependencies
```json
{
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "vite": "^7.1.2",
  "tailwindcss": "^3.4.0",
  "firebase": "^10.0.0",
  "openai": "^4.0.0"
}
```

### UI Libraries
```json
{
  "@headlessui/react": "^1.7.0",
  "framer-motion": "^10.0.0",
  "lucide-react": "^0.300.0",
  "react-hook-form": "^7.0.0",
  "react-hot-toast": "^2.4.0"
}
```

## API Integration Points

### OpenAI API
- **Endpoint**: https://api.openai.com/v1/chat/completions
- **Model**: gpt-4o-mini (cost-optimized)
- **Features**: Image analysis, web search, structured output
- **Rate Limits**: Based on API key tier

### Unified Windows API
- **Base URL**: https://api.theespeys.com
- **Authentication**: Basic Auth (username:password) for all endpoints
- **Endpoints**:
  - **`/food_log`** - POST: Food logging to Lose It (payload: food_items + log_water)
  - **`/refresh_accounts`** - POST: Budget account refresh automation
  - **`/food_log_count`** - GET/POST: Photo count tracking  
  - **`/health`** - GET: API health check
- **Response**: JSON with success/failure status and output

### Windows Backend Architecture
- **Location**: `/Volumes/Projects/API/` (Windows SMB share to C:\Projects)
- **Flask App**: Single unified API server on port 5000
- **Nginx**: Reverse proxy handling SSL termination and routing to unified API
- **Scripts**: Modular structure preserving all existing Selenium automation
  - `scripts/food_log/` - Lose It! automation (login, food entry, water intake)
- **Environment**: Single `.env` file with all credentials and settings
- **Service Management**: NSSM Windows service for persistent operation

## Cost Considerations
- **OpenAI API**: Estimated <$5/month with image compression
- **Netlify**: Free tier sufficient for personal use
- **Firebase**: Free tier sufficient for single user
- **Image Storage**: Client-side compression reduces upload costs

## Troubleshooting

### Common Issues
1. **Firebase Initialization**: Check .env configuration
2. **OpenAI API Errors**: Verify API key and model access
3. **Build Failures**: Ensure proper PostCSS/Tailwind configuration
4. **Photo Upload**: Check file size and format restrictions

### Debug Tools
- Browser console logging for AI response processing
- Network tab for API call monitoring
- React DevTools for component state inspection

## Migration Notes
- **Original System**: Flask + Selenium on Windows desktop
- **New System**: React frontend + Windows backend API
- **Preserved**: All Selenium automation scripts and logic
- **Changed**: UI framework, development environment, hosting
- **Benefits**: Mac-based development, modern UI, better performance

## Windows Backend Migration Details
- **Before**: Separate Flask apps for different automation tasks
- **After**: Single unified Flask API handling all automation endpoints
- **Benefits**: Single NSSM service, unified logging, easier maintenance
- **Preserved Functionality**: All Selenium automation works exactly as before

## Contact & Resources
- **GitHub**: https://github.com/bradyespey/food-log
- **Live Site**: https://foodlog.theespeys.com
- **Firebase Project**: foodlog-318c3
- **Netlify Site**: foodlog-theespeys
- **Original Project**: https://github.com/bradyespey/automated-food-logger
