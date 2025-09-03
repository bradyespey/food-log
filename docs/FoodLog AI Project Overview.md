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

# Note: HEADLESS_MODE no longer needed - Chrome visibility auto-detected
```

### 3. Firebase Project Setup
- **Project Name**: foodlog-318c3
- **Authentication**: Google Auth enabled
- **Web App**: Configured for foodlog.theespeys.com
- **Allowed Domains**: foodlog.theespeys.com, localhost:5173

### 4. Chrome Visibility Configuration
**Automatic Detection** (no configuration needed):
- **Manual execution** (`python app.py`): Chrome visible for debugging
- **Service execution** (NSSM): Chrome hidden for normal operation

**How it works:**
- **Service Detection**: Automatically detects Windows service vs manual execution
- **No configuration**: No environment variables or settings needed
- **Smart defaults**: Visible for debugging, hidden for production

### 5. Chrome Profile Setup
**Profile-First Login Strategy:**
1. **Profile Login**: Uses saved Chrome profile (`chrome_profile/loseit_profile`) for fast login
2. **Manual Fallback**: If profile fails, automatically falls back to credential login
3. **Setup Script**: Run `setup_chrome_profile.py` to create initial profile
4. **Test Scripts**: Use `test_profile_login.py` and `test_manual_login.py` to verify

**Chrome Profile Structure:**
```
C:\Projects\API\chrome_profile\
├── loseit_profile\          # Persistent profile for food logging
├── temp_loseit_profile\     # Temporary profile for manual login testing
└── [other endpoints]        # Other automation endpoints
```

### 6. Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 7. Netlify Deployment

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
  - Log to backend button with inline verification
  - Analyze/Clear buttons in header for better UX
  - Multi-card food entry system with individual Add/Remove buttons
  - Inline verification status with spinners and checkmarks
- **State Management**: React hooks for form data, AI results, and verification status
- **Photo Handling**: WebP compression, 1280px max dimension
- **Verification System**: Real-time status updates during and after logging

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

#### `src/App.tsx` - Sample Data Context
- **Purpose**: React Context system for clean component communication
- **Features**:
  - SampleDataContext provides loadSampleData function to navbar
  - Enables Load Sample Data button to work from navbar without prop drilling
  - Clean architecture for cross-component function sharing

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
- **Inline Verification System**: Real-time verification status with spinners, checkmarks, and error indicators
- **Ultra-Compact Design**: Maximum information density with minimal spacing and padding
- **Smart Button Placement**: Add Another Food Item button in each Food Entry card, action buttons in Analysis Results header
- **Side-by-Side Layout**: Food items display in responsive grid for better space utilization
- **Food Type Display**: Shows actual food type text (e.g., "Dip", "Beef") instead of generic dinner plate icons

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
- **Automatic Chrome Visibility**: Smart detection of service vs manual execution for optimal debugging
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
- **Security Measures**: Pre-commit hook prevents API key leaks, comprehensive security checklist
- **Inline Verification System**: Real-time verification status with spinners, green checkmarks, and red X's inline with food items
- **Compact Food Item Cards**: Ultra-compact design with food type text instead of generic icons, side-by-side layout
- **Button Repositioning**: Add Another Food Item button moved to top right of each Food Entry card, Copy Results and Log to Lose It! buttons in Analysis Results header
- **Load Sample Data Integration**: Button moved to navbar with React Context system for clean component communication
- **Photos Section Optimization**: Reduced prominence and size for better UI balance
- **Spacing Optimization**: Maximum compactness achieved with minimal padding and margins throughout interface
- **AI Page Layout Restructuring**: Merged Analysis Controls into Food Entry section, removed redundant Entries/Valid/Photos block
- **Button Positioning**: Analyze and Clear All buttons moved to bottom right of final food entry card, status indicators on left
- **Log Water Repositioning**: Moved outside main card boxes on both AI and Manual pages for consistent layout
- **Dark Mode Photo Box Fix**: Resolved photo upload area color changes during analysis with proper dark mode support
- **Navigation Fixes**: Resolved infinite re-render loops and navigation issues between Manual and AI pages
- **Performance Optimization**: Removed 1-second Firebase auth delay for instant page loading
- **Production Cleanup**: Removed all debug console.log statements and cleaned up code for production deployment
- **Enhanced AI Analysis**: Improved OpenAI prompt for better photo analysis, user specification following, and visual cue recognition
- **Date & Meal Display**: Added date and meal information to Analysis Results cards for better multi-meal tracking
- **Sample Data Loading System**: Implemented smart sample data loading with dinner (today) and smoothie (yesterday) samples
- **Multi-Card Sample Support**: Sample data loading works with existing card structure, cycling through samples for multiple cards
- **Date Display Fixes**: Improved Analysis Results date mapping to prevent N/A values for items beyond first entry
- **Timezone Correction**: Fixed date handling to use local time (CST) instead of UTC, preventing dates from being off by one day
- **Backend Logging Fixes**: Resolved date/meal inheritance bug where dinner items were incorrectly logging to previous day's date and meal
- **Selenium Automation Robustness**: Added page refresh logic to handle modal overlays and prevent infinite retries
- **Placeholder Text Clearing**: Fixed food entry automation getting stuck on "NoExistFood99887766" placeholder text
- **TypeScript Build Fixes**: Resolved all build errors including unused imports, type mismatches, and parameter cleanup

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

### 10. Inline Verification System Implementation
**Problem**: User needed real-time verification that food items are correctly logged to Lose It! without opening the app
**Solution**: 
- Implemented inline verification system with spinners during logging and checkmarks/X's after completion
- Created React Context system for clean component communication between navbar and pages
- Added HTML parsing fallback for verification data when structured backend response unavailable
- Integrated verification status directly within food item cards for immediate feedback
**Status**: ✅ Resolved - Users can now see verification status inline with each food item

### 11. UI/UX Compactness and Button Repositioning
**Problem**: Interface was too verbose with large cards, poor button placement, and wasted vertical space
**Solution**: 
- Redesigned food item cards to be ultra-compact with food type text instead of generic icons
- Moved Add Another Food Item button to top right of each Food Entry card
- Repositioned Copy Results and Log to Lose It! buttons to Analysis Results header
- Implemented side-by-side layout for food items with responsive grid system
- Optimized spacing throughout interface for maximum information density
**Status**: ✅ Resolved - Interface is now extremely compact with optimal button placement

### 12. AI Page Layout Restructuring and Navigation Issues
**Problem**: 
- Analysis Controls section was redundant and took up unnecessary space
- Manual page had infinite re-render loops causing navigation failures
- Photo box colors were changing inappropriately during dark mode analysis
- Page loading was slow due to artificial Firebase auth delays
**Solution**: 
- Merged Analysis Controls into Food Entry section, eliminating separate card
- Moved Analyze and Clear All buttons to bottom right of final food entry card
- Repositioned Log Water outside main card boxes for consistent layout
- Fixed infinite re-render loops by removing problematic useEffect dependencies
- Resolved navigation issues between Manual and AI pages
- Fixed dark mode photo box styling to maintain consistent appearance during analysis
- Removed 1-second Firebase auth delay for instant page loading
- Cleaned up all debug console.log statements for production readiness
**Status**: ✅ Resolved - Clean, efficient layout with proper navigation and dark mode support

### 13. Enhanced AI Analysis and Multi-Meal Tracking
**Problem**: 
- AI was not consistently following user specifications (e.g., "tajin on the rim", "had 2 drinks")
- Photo analysis was not thorough enough for portion sizes, garnishes, rims, and visual cues
- Analysis Results cards lacked date and meal information for multi-meal scenarios
- User context (6'1" 200lb male) not considered for portion estimation
**Solution**: 
- Enhanced OpenAI system prompt with CRITICAL ANALYSIS REQUIREMENTS section
- Added SPECIAL ATTENTION TO USER SPECIFICATIONS for salt rims, drink counts, portion sizes
- Improved photo analysis instructions: "ALWAYS carefully examine ALL photos", "Photos show actual portions, plate/glass sizes, garnishes, rims, sides"
- Added user context: "6'1" 200lb male - use this for portion context when photos aren't available"
- Enhanced user message: "Look carefully at portion sizes, plate/glass sizes, visible garnishes, rims, sides, and all details"
- Updated FoodItem interface to include date and meal fields
- Modified AI response parsing to extract date and meal information
- Added date and meal display to Analysis Results cards with Calendar and Clock icons
**Status**: ✅ Resolved - AI now better follows user specifications, analyzes photos more thoroughly, and displays date/meal info for multi-meal tracking

### 14. Enhanced Date Navigation System for Selenium Automation
**Problem**: 
- Date navigation was unreliable using only arrow buttons
- No efficient way to navigate to distant dates (weeks/months away)
- Manual navigation was slow and prone to errors
- No verification that correct date was reached before logging food
**Solution**: 
- Implemented calendar date picker navigation as primary method
- Added arrow button navigation as reliable fallback
- Created date verification system to confirm correct date before proceeding
- Enhanced navigation functions: `open_date_picker`, `navigate_calendar_to_month`, `select_day_in_calendar`
- Added smart date checking - only navigates if not already on target date
- Implemented retry logic with fallback methods
**Status**: ✅ Complete - Successfully tested across multiple dates and years, working perfectly

### 15. Production-Ready Test System for Selenium Automation
**Problem**: 
- No systematic way to test Selenium automation scripts
- Difficult to debug navigation and element selection issues
- No validation that food logging works across different dates and scenarios
- Manual testing was time-consuming and unreliable
**Solution**: 
- Created streamlined test suite with 4 essential test scripts
- Implemented enhanced logging system with step-by-step progress tracking
- Added Chrome profile management for persistent login sessions
- Created test-specific log files for easy debugging
- Implemented comprehensive test orchestration with `test_all.py`
- Added aggressive Chrome process management to prevent conflicts
**Status**: ✅ Complete - All tests passing, ready for production use

### 16. Sample Data Loading and Date Display Issues
**Problem**: 
- Sample data loading works for single card but fails for multiple cards
- When adding second card and loading sample data, second card remains empty
- Analysis Results showing "N/A" dates for items beyond the first entry
- Date mapping logic not properly handling AI response items vs form entries
- Timezone issues causing dates to be off by one day in UI and logging
- Backend logging inheriting wrong dates/meals from previous items
**Solution**: 
- Fixed sample data loading to properly cycle through samples for multiple cards
- Resolved date mapping to use individual item dates instead of entryDates array
- Implemented local timezone handling with `getLocalDateString()` helper function
- Simplified `formatFoodItemForLogging` to use item.date and item.meal directly
- Added page refresh logic to handle Selenium modal overlays
- Fixed placeholder text clearing in food entry automation
- Cleaned up TypeScript build errors and unused code
**Status**: ✅ Resolved - Multi-card sample loading works, all dates display correctly, backend logs to proper dates

## Next Steps

### Immediate (Next Session)
1. **Production Deployment**: Deploy latest fixes to https://foodlog.theespeys.com/
2. **Daily Usage Testing**: Use the system for regular food logging to identify any edge cases
3. **Performance Monitoring**: Monitor API response times and costs during regular use

**✅ Production Ready - All Systems Complete**:
- **Frontend**: Modern React UI with AI analysis and manual entry options
- **Backend**: Windows Flask API with unified endpoint architecture  
- **Authentication**: Chrome profile + credential fallback system working perfectly
- **Navigation**: Calendar picker + arrow button fallback system tested and verified
- **Food Logging**: Enhanced automation with tabindex-based meal selection
- **Water Logging**: Automatic fluid ounce tracking integrated with food logging
- **Testing**: Streamlined 4-test production suite (login, food, water, comprehensive)
- **Debug System**: Automatic Chrome visibility detection (service=headless, manual=visible)
- **Verification**: Inline real-time status updates showing logging success/failure
- **Performance**: Optimized for speed and reliability with proper error handling
- **Production Logging**: Clean logging for monitoring without excessive debug output
- **Multi-Card Support**: Sample data loading and analysis works with multiple food entries
- **Date Accuracy**: Local timezone handling ensures correct dates in UI and backend logging
- **Robust Automation**: Page refresh logic handles modal overlays and prevents infinite retries
- **Build System**: TypeScript compilation passes without errors, ready for deployment

### Short Term
1. **Daily Usage**: Use the system for regular food logging to identify any edge cases
2. **Performance Optimization**: Monitor API response times and optimize if needed
3. **Feature Enhancement**: Add any user-requested improvements based on daily use

### Long Term  
1. **AI Model Updates**: Keep OpenAI integration current with latest models
2. **UI Enhancements**: Refine interface based on user feedback
3. **Additional Automation**: Consider automating other nutrition tracking tasks

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
  - `scripts/food_log/test/` - Production test suite (4 essential tests)
- **Environment**: Single `.env` file with all credentials and settings
- **Service Management**: NSSM Windows service for persistent operation

### Production Test Suite
- **Location**: `/Volumes/Projects/API/scripts/food_log/test/`
- **Essential Tests**:
  - `test_login.py` - Chrome profile + credential fallback authentication
  - `test_food.py` - Food logging with enhanced date navigation  
  - `test_water.py` - Complete food + water logging workflow
  - `test_all.py` - Comprehensive test runner for all scripts
- **Support Scripts**: 
  - `quick_validation.py` - Fast system validation (2 minutes)
  - `log_manager.py` - Enhanced logging with step-by-step progress
  - `run_test.py` - Individual test runner with Chrome process management
- **Test Results**: All tests passing (Duration: ~8 minutes for complete suite)

## Cost Considerations
- **OpenAI API**: Estimated <$5/month with image compression
- **Netlify**: Free tier sufficient for personal use
- **Firebase**: Free tier sufficient for single user
- **Image Storage**: Client-side compression reduces upload costs

## Security & API Key Protection

### Current Security Setup
- **Pre-commit Hook**: Automatically scans for API keys and sensitive data before commits
- **Global Gitignore**: `/Users/brady/Projects/.gitignore_global` protects `.env` files
- **Project Gitignore**: Additional project-specific exclusions
- **Security Checklist**: Comprehensive documentation in `docs/SECURITY_CHECKLIST.md`

### How It Prevents Leaks
1. **Pre-commit Scanning**: Detects OpenAI API keys (`sk-proj-*`), other keys (`sk-*`), and `.env` files
2. **Automatic Blocking**: Prevents commits containing sensitive data
3. **Pattern Recognition**: Identifies credential patterns (password, secret, token, key)
4. **File Type Protection**: Blocks environment files and credential files

### Emergency Response (If Leak Occurs)
1. **Immediate**: Revoke/regenerate exposed key
2. **Clean History**: Use `git filter-branch` to remove from git history
3. **Force Push**: Update remote repository with cleaned history
4. **Notify**: Alert affected services

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
