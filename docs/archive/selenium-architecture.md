# FoodLog — Selenium Architecture (Archived)

**Archived:** April 2026  
**Replaced by:** Direct GWT RPC via Netlify Functions (see main README.md)  
**Original production code:** https://github.com/bradyespey/food-log (pre-migration state)

---

## Why This Was Archived

The original FoodLog backend used **Selenium browser automation** to log food to Lose It!. This worked but had significant limitations:

- **10–20 seconds per food item** (browser launch + navigation + form fill)
- Required a **Windows machine running 24/7** (Chrome + NSSM service)
- **Fragile**: UI changes in Lose It! could silently break logging
- Chrome profile management, headless mode issues, CORS on localhost
- No way to run from the Mac or from Netlify Functions

## Original Architecture

```
[Browser / foodlog.theespeys.com]
        │
        │  POST /food_log          (food logging)
        │  POST /food_log/analyze  (AI image analysis via OpenAI)
        │  GET  /health
        ▼
[Nginx on Windows machine at api.theespeys.com]
        │
        ▼
[Flask app.py — port 5000, running as Windows service via NSSM]
        │
        ├── food_log_endpoint() → main_with_verification()
        │       └── Selenium: Chrome → loseit.com → UI form fill → save
        │
        └── food_log_analyze_endpoint() → OpenAI API call
```

## Key Files (Windows machine at C:\Projects\API)

```
scripts/food_log/
├── main.py          — Orchestration, verification, entry point
├── login.py         — Chrome driver setup, persistent profile, credential fallback
├── navigation.py    — Date/meal navigation on the Lose It! diary page
├── food_entry.py    — Custom food form fill and save
├── water_intake.py  — Water goals page automation
└── utils.py         — Text parsing, comparison, verification helpers
```

## Selenium Flow (per food item)

1. `initialize_driver()` — Launch Chrome with persistent profile (skips login if still authenticated)
2. `verify_login()` — Confirm dashboard loaded; fall back to credential login if needed
3. `navigate_to_date()` — Click diary arrows or use calendar picker to reach target date
4. `select_search_box()` — Click meal-specific search box (tabindex 200/201/202/203)
5. `enter_placeholder_text()` — Type non-existent food name to trigger "Create Custom Food"
6. `click_create_custom_food()` — Click the "Create a custom food" link
7. `enter_food_details()` — Fill 15+ fields (name, brand, icon, serving, all nutrients)
8. `save_food()` — Click Save and confirm
9. `update_water_intake()` — If `log_water=True`, navigate to water goals page and update total

## Verification (Optimistic, Not Real)

The original verification system was **optimistic** — it reported "success" if Selenium completed without throwing an exception. It did NOT read the diary back to confirm the entry existed with correct values. The `fetch_logged_items_from_page()` function existed but was never called in the active flow.

## Environment Variables (Windows .env)

```
LOSEIT_EMAIL=
LOSEIT_PASSWORD=
API_AUTH=admin:password
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
SENTRY_DSN=
```

## Why the Migration Happened

After reverse-engineering Lose It!'s GWT RPC protocol from HAR captures, it became clear that:
- Every action the Selenium script performed had a direct GWT API equivalent
- The API calls are ~50x faster (0.3s vs 10–20s per item)
- Netlify Functions can make the API calls server-side, eliminating the Windows machine entirely
- The cookie-based auth (LOSEIT_COOKIE) can be extracted once from DevTools and used directly

See the main README for the new architecture.

## Reverting to Selenium

If you ever need to revert:
1. The original code is at https://github.com/bradyespey/food-log (check out a pre-April-2026 commit)
2. The Windows machine at api.theespeys.com still runs the original Selenium stack — nothing was changed there
3. To re-enable: point `api.ts` back to `${VITE_API_BASE_URL}/food_log` and restore the env vars
