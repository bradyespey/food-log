# FoodLog — Selenium Architecture (Archived)

**Archived:** April 2026  
**Replaced by:** Direct GWT-RPC via Netlify Functions (see main README)  
**Demo branch:** `selenium-demo` (git branch, local only — do not push to main)

---

## Overview

The original FoodLog backend used Selenium browser automation on a Windows machine to log food to Lose It!. The frontend called `https://api.theespeys.com/food_log` (Flask/NSSM on Windows). Chrome opened, logged in, and filled the custom food form for each item. Replaced in April 2026 with direct GWT-RPC calls via Netlify Functions (~50x faster, no Windows machine needed).

---

## Restoring for Demo (What Actually Worked — May 2026)

The `selenium-demo` git branch restores the old frontend (the last Selenium-based commit, `27b0ebf`). The Windows API scripts are unchanged and still work.

### Step 1 — FoodLog frontend

```bash
git checkout selenium-demo
npm run dev  # → localhost:5177
```

The old `src/lib/api.ts` on this branch calls `https://api.theespeys.com/food_log` directly instead of Netlify Functions. The `.env` on disk already has `VITE_API_BASE_URL`, `VITE_API_USERNAME`, and `VITE_API_PASSWORD` set.

### Step 2 — Windows API (run directly, not as service)

On the Windows machine, open VS Code and run:
```
C:\Projects\API\scripts\food_log\run_dev.py
```

This script (one click in VS Code):
1. Stops the NSSM API service
2. Clears all logs in `C:\Projects\API\logs\`
3. Deletes `C:\Projects\API\chrome_profile\` (eliminates stale lock/corruption)
4. Starts Flask directly via `venv\Scripts\python.exe app.py`

Flask **must** run directly (not as NSSM service) for visible Chrome to work. The NSSM service runs as SYSTEM with no desktop session — Chrome can't render a visible window from there.

### Step 3 — Trigger a log

Visit `localhost:5177` on the Mac. Log in, add sample food, analyze, click "Log to Lose It!". The request hits `api.theespeys.com/food_log`. Because the origin is localhost, Flask forces `headless=False` and Chrome opens visibly on the Windows machine.

### Step 4 — Revert when done

```bash
git switch main
```

Then restart the NSSM API service on Windows (`nssm start API`) so production headless logging resumes.

---

## What Broke During Demo Prep (May 2026) — For Presentation Use

These are real failures encountered trying to stand the demo back up. All are valid talking points.

### 1. ChromeDriver / Chrome version mismatch
Chrome auto-updated to 147.0.7727.102. The hardcoded driver at `C:\Drivers\Chrome\chromedriver.exe` was version .57. The code tried the hardcoded driver first — it runs `--version` which exits 0 regardless of version match — so the wrong driver was used for all 3 retry attempts. Error: `DevToolsActivePort file doesn't exist`. Fix: webdriver-manager now runs first in visible mode to auto-download the matching driver.

### 2. Chrome profile lock/corruption
The persistent `chrome_profile` directory had accumulated locks and corruption from the production headless service. Chrome crashed at startup regardless of which subdirectory was used. Fix: `run_dev.py` deletes the entire `chrome_profile` directory on each run. Visible mode now uses `tempfile.mkdtemp()` for a clean throwaway profile.

### 3. GPU/rendering flags crashing visible Chrome on Windows
Several Chrome flags (`--disable-software-rasterizer`, `--disable-gpu-sandbox`, `--disable-setuid-sandbox`) are Linux/Docker flags. They strip GPU rendering components that visible Chrome on Windows needs. In the original code, these were applied to all modes. Fix: headless and visible mode now use separate flag sets.

### 4. Login false positive on fresh profile
The manual login fallback navigated to `https://www.loseit.com/` (marketing homepage), checked if the URL lacked "login", and incorrectly concluded the session was active. Fix: navigate directly to `https://my.loseit.com/login`.

### 5. Lose It! GWT I/O reactor failure (confirmed May 2026, unfixable)
During demo prep, Lose It!'s website started throwing: `Request cannot be executed; I/O reactor status: STOPPED`. This blocks the food search step. It occurs in Chrome and Safari with no automation involved — it is a server-side GWT failure, not a Selenium or ChromeDriver issue. Lose It!'s own banner confirms: *"The website currently receives baseline support but is not in active development."* This failure cannot be fixed from the client. **It is the central argument for why the GWT-RPC approach is better**: the API endpoints the mobile app uses are completely unaffected by this browser-side degradation.

### 6. save_food() false success
`save_food()` clicked the Add Food button and returned `True` immediately with no error detection. When the I/O reactor error dialog appeared, it was never seen. The verification then compared submitted values against themselves (not read from Lose It!'s database), so it reported all items verified even though nothing was saved. Fix added: 2.5s wait after click, check for error dialog by class name, dismiss and return `False` to trigger retry.

---

## Architecture

```
[Browser / localhost:5177 on Mac]
        │
        │  POST /food_log  (Basic Auth)
        │  X-Debug-Mode: true  (sent automatically from localhost → forces visible Chrome)
        ▼
[Nginx → Flask app.py on Windows / api.theespeys.com]
        │
        ▼
[Selenium: Chrome (visible) → my.loseit.com/login → diary → custom food form]
        │
        └── Per item: navigate date → search dummy food → Create Custom Food
                       → fill 15 fields → click Add Food → close dialog
```

## Key Files

**Frontend (Mac — selenium-demo branch):**
- `src/lib/api.ts` — calls Windows API with Basic Auth, sends X-Debug-Mode header from localhost
- `src/lib/openai.ts` — AI analysis (unchanged between branches)

**Backend (Windows — always present):**
- `C:\Projects\API\scripts\food_log\run_dev.py` — one-click dev runner (stop service, clear logs, wipe profile, start Flask)
- `C:\Projects\API\scripts\food_log\login.py` — Chrome driver init; visible mode uses fresh temp profile + webdriver-manager first
- `C:\Projects\API\scripts\food_log\food_entry.py` — custom food form fill; detects I/O reactor error dialog after save
- `C:\Projects\API\scripts\food_log\main.py` — orchestration, retry logic
- `C:\Projects\API\scripts\food_log\navigation.py` — date/meal navigation
- `C:\Projects\API\scripts\food_log\water_intake.py` — water goals automation

## Environment Variables (Windows .env at C:\Projects\API\.env)

```
LOSEIT_EMAIL=
LOSEIT_PASSWORD=
API_AUTH=admin:password
OPENAI_API_KEY=
SENTRY_DSN=
```

**Mac `.env` (selenium-demo branch needs these):**
```
VITE_API_BASE_URL=https://api.theespeys.com
VITE_API_USERNAME=
VITE_API_PASSWORD=
```
