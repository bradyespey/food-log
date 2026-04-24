# Codex Lose It! Unofficial API Plan

## Summary

The HAR capture from `loseit.com` shows that custom food logging is not only driven by browser UI state. The final save action is an authenticated HTTP request to Lose It!'s internal web service:

`https://www.loseit.com/web/service`

The request uses GWT-RPC and calls:

`saveCustomFoodLogEntry`

That means a backend-only unofficial API wrapper is likely possible. It should be much more stable than Selenium selectors, ChromeDriver matching, and persistent Chrome profile handling, while still keeping Selenium as a fallback during the transition.

The request should not be made from the React frontend. Any Lose It! cookies, session tokens, request signatures, or replay details must stay server-side in the Windows API project.

## What The HAR Shows

The meaningful traffic was concentrated into authenticated `POST` requests to `/web/service`.

The browser made several search/helper calls while typing, including:

- `searchFoods`
- `searchBrands`
- `getFoodsForBrandWithLocale`

The actual custom food save was:

- `saveCustomFoodLogEntry`

That save payload included the custom food entry details:

- Food name
- Brand / restaurant
- Icon / food type
- Serving amount
- Serving unit / measure
- Date / day context
- Meal/log context
- Nutrition values

The cheeseburger payload appears to contain a nutrient map matching the fields FoodLog already sends to Selenium:

- Calories
- Fat
- Saturated fat
- Cholesterol
- Sodium
- Carbs
- Fiber
- Sugar
- Protein

The server response for the save request returned a GWT-RPC `//OK` response, which is a strong signal that this can be wrapped in a direct backend call.

## Viability

This looks viable for a proof of concept.

The current FoodLog frontend already formats everything into a predictable food-item text contract for the Windows Flask API. That means the safest migration path is to leave the frontend alone and replace only the backend logging implementation.

The new backend can:

1. Accept the same `/food_log` request.
2. Parse the same existing text format.
3. Attempt direct Lose It! GWT-RPC logging first.
4. Fall back to Selenium if the direct call fails or if an item uses an unmapped feature.

This avoids a risky frontend rewrite and makes the change easy to roll back.

## Risks

This is still unofficial.

Lose It! can change the GWT-RPC serialization format, internal class signatures, permutation hash, session requirements, or payload shape without notice. That said, this risk is probably easier to manage than Selenium UI drift because the API surface is smaller and easier to test.

Known risks:

- Session/auth data may expire and need a refresh workflow.
- The GWT permutation or serialization signatures may change after a Lose It! deployment.
- Meal/date context needs more mapping before replacing all Selenium behavior.
- Serving units and food measures need validation across common FoodLog output.
- Water logging may use a different flow and should be handled separately.
- Verification by `//OK` alone confirms request acceptance, not necessarily visible correctness in the diary.

## Proposed Implementation Plan

### Phase 1: Preserve Current Behavior

Do not change the React frontend contract.

Keep:

- `POST /food_log`
- `food_items`
- `log_water`
- Existing Basic Auth
- Existing frontend success/error handling
- Existing Selenium automation as fallback

Add a backend mode flag:

- `LOSEIT_LOGGER_MODE=selenium`
- `LOSEIT_LOGGER_MODE=api`
- `LOSEIT_LOGGER_MODE=auto`

Recommended default for testing: `auto`.

In `auto`, try the unofficial API first, then fall back to Selenium if the direct request fails.

### Phase 2: Add A Backend Lose It! Client

Create a server-side client under:

`/Volumes/Projects/API/scripts/food_log/`

Suggested responsibilities:

- Maintain Lose It! HTTP session headers.
- Load session/cookie/token material from disk or environment.
- Build the GWT-RPC `saveCustomFoodLogEntry` payload.
- Submit the request to `/web/service`.
- Parse success/failure from the GWT-RPC response.
- Return a result shaped like the existing Selenium verification response.

This client should log enough detail to debug failures, but it must never log raw cookies, full auth headers, passwords, or reusable session tokens.

### Phase 3: Map Payload Fields

Use the cheeseburger HAR as the first template, then collect a few more small HARs to fill in the unknowns.

Recommended captures:

- One food logged for each meal: Breakfast, Lunch, Dinner, Snacks.
- One food logged for yesterday or tomorrow to map date/day behavior.
- Several serving units that FoodLog commonly emits: Each, Ounce, Gram, Cup, Fluid Ounce.
- One item with no brand.
- One item with a longer restaurant/brand value.
- One drink item if water logging should remain paired with food logging.

The goal is to identify what is fixed, what is per-user, what is per-session, and what changes per entry.

### Phase 4: Verification

Start with lightweight verification:

- HTTP status is 200.
- GWT-RPC response starts with `//OK`.
- Response does not indicate auth failure or server exception.

Then improve verification by discovering the read/list endpoint Lose It! uses to fetch diary entries for a date. That would allow the backend to confirm the item appears with expected calories/macros without reopening Selenium.

Until read verification exists, mark API-path verification as "accepted by Lose It!" rather than "fully verified from diary."

### Phase 5: Rollout

Use a conservative rollout:

1. Build API logger behind `LOSEIT_LOGGER_MODE=api`.
2. Test with one disposable custom food.
3. Test with the existing FoodLog frontend pointed at local Flask.
4. Switch to `auto` mode so Selenium remains fallback.
5. Watch logs for direct API failures and fallback frequency.
6. Once stable, make API mode the default and keep Selenium available for recovery.

## Suggested Backend Shape

The existing `/food_log` endpoint can keep doing the high-level orchestration.

Internally, it can choose between:

- `main_with_verification(...)` for Selenium
- A new direct API logging function for GWT-RPC

The direct API function should return the same general shape:

- `success`
- `message`
- `output`
- `verification`

That lets FoodLog keep its current UI behavior while the backend implementation changes underneath.

## Security Notes

All Lose It! auth/session material must stay in the Windows API backend.

Do not put any Lose It! cookies, tokens, request signatures, or paid API keys into:

- React code
- `VITE_*` variables
- Git
- `.env.example`
- Browser-local code paths

The HAR itself should be treated as sensitive and should not be committed.

## Recommendation

Proceed with a proof of concept.

The best next step is to build a small backend-only `loseit_api` client that can log one FoodLog item through `saveCustomFoodLogEntry`, using the existing `/food_log` input format and returning a compatible result object.

If that works for a few common foods, the app can move from brittle Selenium-first logging to direct API-first logging with Selenium fallback.
