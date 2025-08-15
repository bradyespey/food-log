# FoodLog AI

A modern, beautiful React app for analyzing food with AI and logging it to Lose It! Built with React, TypeScript, Tailwind CSS, and OpenAI integration.

## Features

- 🤖 **AI-Powered Food Analysis** - Upload photos and describe food for instant nutritional analysis
- 📱 **Mobile-Friendly** - Responsive design that works great on desktop and mobile
- 🖼️ **Image Upload** - Drag-and-drop multiple photos with automatic compression
- 🎯 **Smart Integration** - Connects to your existing Lose It! automation API
- 💰 **Cost Control** - Real-time cost estimation for AI analysis
- ⚡ **Fast & Modern** - Built with Vite, TypeScript, and Tailwind CSS

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons
- **Forms**: React Hook Form
- **API**: Axios with automatic image compression
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion
- **Hosting**: Netlify (frontend) + Windows API (backend)

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd food-log-app
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env file with your API configuration
   VITE_API_BASE_URL=https://api.theespeys.com
   VITE_API_USERNAME=your_username
   VITE_API_PASSWORD=your_password
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser to** http://localhost:5173

## API Endpoints

The app expects these endpoints on your Windows backend:

- `POST /food_log/analyze` - AI food analysis with image upload
- `POST /food_log` - Log food to Lose It!
- `GET /health` - Health check

## Deployment

### Netlify Setup

1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   └── ui/          # Reusable UI components
├── pages/           # Page components
├── lib/             # API clients and utilities
├── types/           # TypeScript type definitions
└── utils/           # Helper functions
```

## License

MIT License
