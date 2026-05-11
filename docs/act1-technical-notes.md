# Act I Technical Notes — Selenium Era, Failure Modes, and the Case for GWT-RPC

Technical reference for the Verkada SE presentation (2026-05-19). Covers the original Selenium-based Lose It! logging system, every failure mode encountered, and why the GWT-RPC approach replaced it. Pass this doc to Claude when refining presentation talking points.

## What the Selenium approach did

A Python/Flask app on a Windows machine launched a headed Chrome browser, drove the Lose It! web UI via DOM automation, and saved each food entry through the search → click → create custom food workflow.

The frontend sent structured food data to `https://api.theespeys.com/food_log`. Flask invoked Selenium, which opened Chrome, logged in with stored credentials, navigated to the right meal/date, and entered each item field by field.

---

## Failure modes, in order of frequency

### 1. ChromeDriver / Chrome version mismatch

Chrome auto-updates silently. ChromeDriver does not. Every Chrome update is a potential breakage event. The `DevToolsActivePort file doesn't exist` crash is the symptom — Chrome starts, immediately crashes before the DevTools port file is created, and ChromeDriver errors out. Retries don't help because the mismatch is deterministic.

Mitigation attempted: `webdriver-manager` for auto-downloading the matching driver, plus a hardcoded fallback at `C:\Drivers\Chrome\chromedriver.exe`. Problem: the hardcoded binary is tried first, so a stale binary silently wins even when a correct one would be available via webdriver-manager.

**This is the crash that happened on 2026-05-09 when standing the demo back up after ~2 weeks of non-use.**

### 2. Chrome profile lock conflicts

The production service runs headless Chrome using `loseit_profile`. When a second Chrome instance is started for visible/debug mode using the same `--user-data-dir`, Chrome detects an existing lock file and crashes immediately. The retry loop clears the `SingletonLock` file, but the profile data directory itself may still be held.

Fix: visible mode now uses `loseit_debug_profile` (separate subdirectory) to avoid competing with the service session.

### 3. DOM selector drift

The login and food-entry code relies on CSS class names, XPath expressions, and element IDs baked into Lose It!'s GWT-compiled frontend. GWT obfuscates class names (e.g., `GPOEIKGBYB`, `GNOSQVDBIYB`) and they change with every frontend build. The login selectors were updated at least once (Jan 2026) when Lose It! shipped a new login page. The dashboard selectors are hardcoded fallbacks updated manually.

**This is the structural problem**: any Lose It! UI deploy can silently break logging with no warning until a meal is missed.

### 4. Windows service context — no desktop for visible Chrome

The NSSM service runs as SYSTEM, which has no interactive desktop session. When `X-Debug-Mode: true` is sent from localhost and `headless=False` is forced, Chrome tries to create a window but has no display to render to and crashes. The fix: stop the NSSM service and run `python app.py` directly in a terminal for visible mode.

### 5. Timing and `time.sleep` dependencies

The entire workflow is built on explicit sleeps between actions (2–3 seconds per step) to wait for DOM transitions that have no deterministic signal. If Lose It!'s servers are slow, the sleep windows are too short; if they're fast, time is wasted. At 10–15 DOM interactions per food item and 3–5 food items per log, this compounds to 45–60 seconds per session.

### 6. Machine dependency

The system only ran on Windows (Chrome profile paths hardcoded as `C:\Projects\API\chrome_profile`). No macOS/Linux path. ChromeDriver binary is platform-specific. The Flask API was behind NSSM + Nginx, requiring Windows service infrastructure to stay online 24/7.

### 7. TOTP / session expiry

Lose It! login sessions expire. The profile-based approach stores a logged-in Chrome session so credentials aren't re-entered every time. But if the session expires (or Chrome clears cookies), the fallback is manual credential login. MFA (if ever added by Lose It!) would require TOTP handling, as already built for Monarch Money.

### 8. Lose It! website actively degrading — GWT I/O reactor failure (confirmed 2026-05-09)

During demo prep on 2026-05-09, a new failure appeared that is **unrelated to Selenium or ChromeDriver**: Lose It!'s website started throwing a GWT error at the point where the search box triggers an async request:

> "An unexpected error has occurred. Request cannot be executed; I/O reactor status: STOPPED"

The GWT `I/O reactor` is the async HTTP client embedded in Lose It!'s browser-side GWT application. When it enters a STOPPED state, no further XHR requests can be made — including the food search that the Selenium automation depends on. The error appears as a modal dialog with a single OK button.

**This error occurs in all browsers (Chrome and Safari), with and without Selenium.** It is not triggered by automation — it is a Lose It! server-side or GWT framework failure. It cannot be fixed from the client.

Lose It! themselves display a notice at the top of the web dashboard:

> *"The website currently receives baseline support but is not in active development."*

This is the compounding failure the presentation talks about: the Selenium approach was already fragile due to DOM coupling, ChromeDriver versioning, and platform lock-in. Now the underlying website is actively degrading. The Selenium automation was always one Lose It! deploy away from breaking. As of May 2026, the website itself is unreliable independent of automation.

**Presentation angle**: This is live proof of the argument. The GWT-RPC approach talks directly to Lose It!'s backend endpoints — the same ones their mobile app uses — and is completely unaffected by this browser-side GWT reactor failure. The browser was never the point. The wire protocol was.

---

## What GWT-RPC replaced and why it's more stable

Instead of automating the browser, the current approach speaks the wire protocol the browser itself uses. GWT-RPC is the actual API. The browser was always just a wrapper.

| Concern | Selenium | GWT-RPC |
|---|---|---|
| Chrome install | Required | Not needed |
| ChromeDriver | Must match Chrome version | Not needed |
| DOM selectors | Break on every UI deploy | Not applicable |
| Speed | 45–60s per session | 1–2s per session |
| Platform | Windows only | Serverless (Netlify Functions) |
| Failure signal | Silent wrong data or crash | HTTP 4xx/5xx with body |
| Failure type | DOM drift, driver mismatch, profile locks | API contract change |

API contracts change far less frequently than compiled GWT frontend class names. When they do change, the failure is explicit (HTTP error with a parseable response), not silent (wrong element clicked, no entry created).

---

## Remaining brittleness in the GWT-RPC approach

The GWT-RPC endpoint is an unofficial, undocumented API. Lose It! could:
- Change the RPC method signatures
- Add auth token rotation
- Change the 41 serving-unit ID map
- Add rate limiting or bot detection

None of these have happened since April 2026. The serving-unit IDs and nutrient keys were validated via HAR captures and are stored in `netlify/functions/food-log.ts`.

---

## Files of record

- Frontend (API approach): `netlify/functions/food-log.ts`
- Selenium backend (Windows): `/Volumes/Projects/API/scripts/food_log/`
- ChromeDriver init: `/Volumes/Projects/API/scripts/food_log/login.py`
- HAR captures used for protocol reverse engineering: `docs/har_files/`
