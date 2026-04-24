# Claude Code — Lose It! Unofficial API Plan

**Date:** April 22, 2026  
**Author:** Claude Code (analysis from a user-provided HAR file)  
**Goal:** Replace the brittle Selenium-based Lose It! automation in FoodLog with a direct HTTP client that replicates the site's internal API calls.

---

## Background

The current FoodLog automation uses Selenium to drive a headless browser through the Lose It! web UI. Selenium works but breaks constantly — WebDriver updates, DOM changes, timing issues, and login flows all cause failures. The goal of this investigation was to determine whether Lose It!'s internal API could be called directly, bypassing the browser entirely.

A HAR (HTTP Archive) file was recorded while manually logging a custom food item (a cheeseburger) on loseit.com. The HAR was analyzed to extract the exact network calls, payloads, and headers involved.

---

## What Lose It! Uses Under the Hood

Lose It! is a **GWT (Google Web Toolkit)** application — a Java codebase compiled to JavaScript. GWT uses a proprietary RPC (Remote Procedure Call) protocol for all communication between the browser and server.

**Key findings:**

- Every single API action (search, log food, get history, etc.) goes to **one endpoint**: `https://www.loseit.com/web/service`
- All requests use `POST` with `Content-Type: text/x-gwt-rpc; charset=UTF-8`
- The body is a pipe-delimited serialized payload — not JSON, not XML, but GWT's custom format (version 7)
- There are no REST endpoints, no public JSON API — everything is this one RPC endpoint with different method names

---

## The 26 Calls in the HAR Session

The session of logging one custom food item produced 26 calls to `/web/service`:

| Method | Count | Purpose |
|---|---|---|
| `searchFoods` | 1 | Searched for "burgersdasadsad" |
| `searchBrands` | 10 | Autocomplete fired while typing "Test Burger" |
| `getFoodsForBrandWithLocale` | 14 | Brand food lookup (autocomplete filler) |
| `saveCustomFoodLogEntry` | 1 | The actual food log entry — the one that matters |

The `saveCustomFoodLogEntry` call is fully decoded and is the only one needed to replace Selenium for food logging.

---

## GWT RPC Format

The GWT RPC v7 body looks like this:

```
7|0|N|[string table: N entries]|[parameters referencing string table by index + literal values]
```

- The first 3 fields are the GWT version (`7`), flags (`0`), and string table size (`N`)
- The string table contains Java class names, type hashes, and string literals
- The parameters that follow are either indexes into the string table or raw literal values (numbers, strings, booleans)

For `saveCustomFoodLogEntry`, the string table has 30 entries — mostly Java class names like `com.loseit.core.client.model.FoodLogEntry/264522954`. These are static and don't change unless Lose It! recompiles their app.

---

## Fully Decoded: What's in the Save Payload

After decoding the entire 173-field body, every variable is identified:

### Identity Fields (static per account)
| Field | Value | Notes |
|---|---|---|
| User ID | `[redacted]` | Lose It! account ID — per-user constant |
| Username | `[redacted]` | Per-user constant |
| Timezone offset | `-5` | CST — adjust for daylight saving if needed |
| Locale | `en-US` | Constant |

### Food Details (parameterized per log entry)
| Field | Example Value | Notes |
|---|---|---|
| Food display name | `Hamburger` | What shows in the food log |
| Brand / Restaurant | `Test Restaurant` | Brand name or restaurant name |
| Food sub-name | `Test Burger` | Variation name (used for custom foods) |
| Meal type | `1` | 1=Breakfast, 2=Lunch, 3=Dinner, 4=Snack |
| Serving size | `2.5` | Number of servings |

### Date Encoding
The date field is stored as **days since January 1, 2001** — not Unix epoch (1970), but Lose It!'s own epoch. This was confirmed directly from the HAR: April 22, 2026 = 9,243 days from 2001-01-01.

In Python: `(target_date - date(2001, 1, 1)).days`

### Nutrients (parameterized, stored as a HashMap)
Each nutrient is a key/value pair using Lose It!'s internal nutrient ID numbers:

| Nutrient ID | Nutrient | Example Value |
|---|---|---|
| 0 | Calories | 500 |
| 3 | Carbohydrates (g) | 10 |
| 4 | Fat (g) | 2 |
| 8 | Fiber (g) | 5 |
| 9 | Protein (g) | 400 (test value) |
| 10 | Sodium (mg) | 30 |
| 11 | Sugar (g) | 5 |
| 12 | Cholesterol (mg) | 8 |
| 13 | Saturated Fat (g) | 25 |

Only the nutrients you provide need to be included — the HashMap can have anywhere from 1 to 9 entries.

### Client-Generated UUIDs
The payload contains two 16-byte arrays that look cryptic but are simply **randomly generated UUIDs**, stored as signed Java bytes. Two are generated per log entry:
1. **Food Identifier UUID** — unique ID for the food item itself
2. **Log Entry UUID** — unique ID for this specific log entry

Python's `uuid.uuid4().bytes` can generate these directly, then convert each byte to a signed integer (bytes > 127 become negative, matching Java's signed byte type).

---

## The One Unknown: Session Tokens

The payload contains short session-like tokens, and the responses include a similar token. These appear to be session/CSRF protection values that authenticate the request server-side.

The HAR cookies were stripped by Chrome's default HAR export settings, so the exact auth mechanism is the one remaining unknown. Two likely scenarios:

1. **Browser session cookies + page-load token**: The standard Lose It! session cookie handles auth, and the `Z21...` token is embedded in the initial page HTML/JS state on load. In this case, the Python client would need to:
   - Accept a `LOSEIT_COOKIE` env var (user pastes from browser once)
   - Make a GET to `https://www.loseit.com/` on startup to extract the token
   - Then use that token in all subsequent RPC calls

2. **Cookie-only auth**: The token may be derived from or equivalent to the session cookie, meaning only the cookie is needed and the token is just echoed back/rotated per response. This would make the implementation simpler.

The only way to confirm is to test with a live session. This is the first thing to validate when building Phase 1.

---

## Required Headers

Every call to `/web/service` needs these headers:

| Header | Value |
|---|---|
| `Content-Type` | `text/x-gwt-rpc; charset=UTF-8` |
| `x-gwt-module-base` | `https://d3hsih69yn4d89.cloudfront.net/web/` |
| `x-gwt-permutation` | `79FCB90B69F5FF2C7877662E5529652C` |
| `x-loseit-gwtversion` | `devmode` |
| `x-loseit-hoursfromgmt` | `-5` (or local offset) |
| `origin` | `https://www.loseit.com` |
| `referer` | `https://www.loseit.com/` |

The `x-gwt-permutation` hash is a fingerprint of the compiled GWT JavaScript bundle. It changes when Lose It! deploys a new version. It's not a secret — it's the same for all users — but it will need to be updated periodically. This is the same kind of maintenance as updating a Selenium XPath when the DOM changes, but far less frequent.

---

## Implementation Plan

### Phase 1 — Session Bootstrap (estimated: 1–2 hours)
- Write a `LoseItSession` class in Python
- Accept `LOSEIT_COOKIE` as an environment variable (user copies from browser once)
- On initialization, GET `https://www.loseit.com/` and extract the session token from the response HTML/JS
- Confirm the session is valid before proceeding
- Store user ID and username from environment/config or extract them from a first service call

### Phase 2 — GWT RPC Client (estimated: 2–3 hours)
- Build the `saveCustomFoodLogEntry` body as a Python template
- Parameterize: food name, brand, nutrients, date, meal type, serving size
- Generate random UUIDs for the two key fields per request
- Compute the date encoding (days since 2001-01-01)
- Parse GWT RPC responses to confirm success (`//OK[...true...]`)
- Handle errors (e.g., `//EX[...]` responses indicate exceptions)

### Phase 3 — Replace Selenium in FoodLog (estimated: 1–2 hours)
- Audit FoodLog's current Selenium code to understand the interface it exposes
- Drop in `LoseItClient` as a replacement — same inputs (food name, meal, date, nutrients), same outputs (success/failure)
- Test with a few real entries
- Remove the Selenium dependency entirely if all paths are covered

### Phase 4 — Food Search (estimated: 30 minutes, optional)
- The `searchFoods` payload is also fully decoded
- Add a `search_food(query)` method to look up existing Lose It! database foods
- This enables logging foods that already exist in Lose It!'s database by ID, rather than always creating custom entries

---

## Risk Assessment

| Risk | Severity | Notes |
|---|---|---|
| GWT permutation hash changes | Low | Only changes on Lose It! JS deploys — update one constant |
| Session cookie expiry | Low | Browser sessions typically last weeks to months — user re-pastes |
| Token extraction fails | Medium | May need to parse the page on load to get `Z21...` token; adds one HTTP call but not a blocker |
| Lose It! changes the API format | Low | GWT RPC format is tied to the app version; format changes are rare and obvious |
| IP rate limiting or bot detection | Low–Medium | Not observed in the HAR; using real session cookies makes requests indistinguishable from browser traffic |

### Comparison to Selenium

| | Selenium | HTTP Client |
|---|---|---|
| Setup | Chrome + WebDriver + timing hacks | `pip install requests` |
| Speed per log | 10–30 seconds | < 1 second |
| Failure modes | WebDriver version, DOM changes, login flow, timeouts | Session expiry, permutation hash update |
| Maintenance | Frequent | Occasional |
| Headless browser required | Yes | No |

---

## What We'd Need to Start

1. **Confirm which FoodLog script currently handles Lose It! logging** — so Phase 3 can match the existing interface
2. **A live Lose It! session cookie** — needed to test Phase 1 (can be grabbed from Chrome DevTools → Application → Cookies → `www.loseit.com` → copy `Cookie` header value from a network request)
3. **Confirmation of the current nutrient fields** FoodLog tracks — to make sure the nutrient ID mapping above is complete

---

## Summary

Lose It!'s internal GWT RPC protocol is fully reverse-engineered from the HAR. The `saveCustomFoodLogEntry` endpoint accepts a templated pipe-delimited body with parameterized food details, nutrients, date (encoded as days since 2001-01-01), and randomly generated UUIDs. The only remaining unknown is the session token mechanism, which is the first thing to validate. Once confirmed, this replaces Selenium with a simple `requests`-based HTTP client — faster, more reliable, and with far fewer moving parts.
