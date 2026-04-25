import type { Handler } from '@netlify/functions'
import { getLoseItCookie } from './lib/firebase-admin'

// ── GWT constants ──────────────────────────────────────────────────────────────
const GWT_MODULE_BASE      = 'https://d3hsih69yn4d89.cloudfront.net/web/'
const LOSEIT_SERVICE_URL   = 'https://www.loseit.com/web/service'
const USER_AGENT           = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'

// GWT_BODY_PERMUTATION identifies the compiled GWT bundle whose type hashes are
// embedded in the string table below. It is NOT the same as the header permutation.
// All type hash suffixes (e.g. ServiceRequestToken/1076571655) come from this bundle.
// Update this (along with all type hashes) only if Lose It! recompiles their Java code.
const GWT_BODY_PERMUTATION = '2755A092A086CADF822A722370D298F9'

const USER_ID  = 8790093
const USERNAME = 'Brady'
const TIMEZONE = -5

// Nutrient ID → Lose It! internal key
// Derived by observation: sent known values at old keys, read back what Lose It! displayed.
// Original HAR analysis had every non-calorie key wrong (all shifted).
const NUTRIENT_KEYS: Record<string, number> = {
  calories:      0,   // confirmed ✓
  fat:           3,   // was 4 (4 is actually sat fat)
  saturated_fat: 4,   // was 13 (13 is actually protein)
  cholesterol:   8,   // was 12 (12 is actually sugar)
  sodium:        9,   // was 10 (10 is actually carbs)
  carbs:         10,  // was 3  (3 is actually fat)
  fiber:         11,  // was 8  (8 is actually cholesterol)
  sugar:         12,  // was 11 (11 is actually fiber)
  protein:       13,  // was 9  (9 is actually sodium)
}

// Serving unit label → FoodMeasure type integer
// All 41 IDs confirmed from HAR captures 12–15.
// Both singular and plural forms map to the same ID — Lose It! pluralises when amount > 1.
// IDs 18, 28–31, 44 are gaps in the sequence; ID 40 is a mystery second Tablespoon unit.
const SERVING_UNIT_MAP: Record<string, number> = {
  'Teaspoon':              1,  'Teaspoons':              1,
  'Tablespoon':            2,  'Tablespoons':            2,
  'Cup':                   3,  'Cups':                   3,
  'Piece':                 4,  'Pieces':                 4,
  'Each':                  5,
  'Ounce':                 6,  'Ounces':                 6,
  'Pound':                 7,  'Pounds':                 7,
  'Gram':                  8,  'Grams':                  8,
  'Kilogram':              9,  'Kilograms':              9,
  'Fluid Ounce':           10, 'Fluid Ounces':           10,
  'Milliliter':            11, 'Milliliters':            11,
  'Liter':                 12, 'Liters':                 12,
  'Gallon':                13, 'Gallons':                13,
  'Pint':                  14, 'Pints':                  14,
  'Quart':                 15, 'Quarts':                 15,
  'Milligram':             16, 'Milligrams':             16,
  'Microgram':             17, 'Micrograms':             17,
  'Bottle':                19,
  'Box':                   20,
  'Can':                   21,
  'Cube':                  22,
  'Jar':                   23,
  'Stick':                 24,
  'Tablet':                25,
  'Slice':                 26,
  'Serving':               27, 'Servings':               27,
  'Ind Package':           32,
  'Scoop':                 33,
  'Metric Cup':            34, 'Metric Cups':            34,
  'Dry Cup':               35, 'Dry Cups':               35,
  'Imperial Fluid Ounce':  36, 'Imperial Fluid Ounces':  36,
  'Imperial Gallon':       37, 'Imperial Gallons':       37,
  'Imperial Quart':        38, 'Imperial Quarts':        38,
  'Imperial Pint':         39, 'Imperial Pints':         39,
  'Dessertspoon':          41, 'Dessertspoons':          41,
  'Pot':                   42,
  'Punnet':                43,
  'Container':             45,
  'Package':               46,
  'Pouch':                 47,
}

const MEAL_TYPE_MAP: Record<string, number> = {
  Breakfast: 0,
  Lunch:     1,
  Dinner:    2,
  Snacks:    3,
}

// Lose It! epoch is effectively Dec 31, 2000 (day 1 = Jan 1, 2001).
// HAR confirmed: April 22 local → day 9243, so (April22 - Jan1_2001).days=9242 → need +1.
const LOSEIT_EPOCH = new Date('2000-12-31').getTime()

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysSinceEpoch(dateStr: string): number {
  // dateStr format: MM/DD
  const [month, day] = dateStr.split('/').map(Number)
  const year = new Date().getFullYear()
  const target = new Date(year, month - 1, day)
  if (target > new Date()) target.setFullYear(year - 1)
  return Math.round((target.getTime() - LOSEIT_EPOCH) / 86400000)
}

function uuidToSignedBytes(uuidHex: string): number[] {
  // Remove hyphens, convert each byte pair to signed int
  const hex = uuidHex.replace(/-/g, '')
  const bytes: number[] = []
  for (let i = 0; i < 32; i += 2) {
    const b = parseInt(hex.slice(i, i + 2), 16)
    bytes.push(b > 127 ? b - 256 : b)
  }
  return bytes
}

function makeZToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return 'Z' + Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function fmtNum(v: number): string {
  return Number.isInteger(v) ? String(v) : String(v)
}

function normalizeServingUnit(raw: string): string {
  const s = raw.trim().toLowerCase()
  // Multi-word first (before single-word checks)
  if (s === 'imperial fluid ounce' || s === 'imperial fluid ounces' || s === 'imp fl oz') return 'Imperial Fluid Ounce'
  if (s === 'imperial gallon'  || s === 'imperial gallons')  return 'Imperial Gallon'
  if (s === 'imperial quart'   || s === 'imperial quarts')   return 'Imperial Quart'
  if (s === 'imperial pint'    || s === 'imperial pints')    return 'Imperial Pint'
  if (s === 'metric cup'       || s === 'metric cups')       return 'Metric Cup'
  if (s === 'dry cup'          || s === 'dry cups')          return 'Dry Cup'
  if (s === 'ind package'      || s === 'ind. package' || s === 'individual package') return 'Ind Package'
  if (s === 'fluid ounce' || s === 'fluid ounces' || /^fl\.?\s*oz\.?s?$/.test(s)) return 'Fluid Ounce'
  // Weight
  if (s === 'ounce'  || s === 'ounces'  || s === 'oz')                     return 'Ounce'
  if (s === 'pound'  || s === 'pounds'  || s === 'lb' || s === 'lbs')      return 'Pound'
  if (s === 'gram'   || s === 'grams'   || s === 'g')                      return 'Gram'
  if (s === 'kilogram'  || s === 'kilograms'  || s === 'kg')               return 'Kilogram'
  if (s === 'milligram' || s === 'milligrams' || s === 'mg')               return 'Milligram'
  if (s === 'microgram' || s === 'micrograms' || s === 'mcg' || s === 'ug') return 'Microgram'
  // Volume
  if (s === 'milliliter' || s === 'milliliters' || s === 'ml')             return 'Milliliter'
  if (s === 'liter'  || s === 'liters'  || s === 'litre' || s === 'litres' || s === 'l') return 'Liter'
  if (s === 'gallon' || s === 'gallons' || s === 'gal')                    return 'Gallon'
  if (s === 'pint'   || s === 'pints'   || s === 'pt')                     return 'Pint'
  if (s === 'quart'  || s === 'quarts'  || s === 'qt')                     return 'Quart'
  if (s === 'cup'    || s === 'cups')                                       return 'Cup'
  if (s === 'tablespoon' || s === 'tablespoons' || s === 'tbsp' || s === 'tbs') return 'Tablespoon'
  if (s === 'teaspoon'   || s === 'teaspoons'   || s === 'tsp')            return 'Teaspoon'
  if (s === 'dessertspoon' || s === 'dessertspoons' || s === 'dsp')        return 'Dessertspoon'
  // Amount
  if (s === 'each'    || s === 'ea')                                        return 'Each'
  if (s === 'serving' || s === 'servings')                                  return 'Serving'
  if (s === 'piece'   || s === 'pieces'  || s === 'pc' || s === 'pcs')     return 'Piece'
  if (s === 'scoop'   || s === 'scoops')                                    return 'Scoop'
  if (s === 'slice'   || s === 'slices')                                    return 'Slice'
  if (s === 'bottle'  || s === 'bottles')                                   return 'Bottle'
  if (s === 'box'     || s === 'boxes')                                     return 'Box'
  if (s === 'can'     || s === 'cans')                                      return 'Can'
  if (s === 'jar'     || s === 'jars')                                      return 'Jar'
  if (s === 'stick'   || s === 'sticks')                                    return 'Stick'
  if (s === 'tablet'  || s === 'tablets')                                   return 'Tablet'
  if (s === 'package' || s === 'packages' || s === 'pkg')                  return 'Package'
  if (s === 'pouch'   || s === 'pouches')                                   return 'Pouch'
  if (s === 'container' || s === 'containers')                              return 'Container'
  if (s === 'cube'    || s === 'cubes')                                     return 'Cube'
  if (s === 'pot'     || s === 'pots')                                      return 'Pot'
  if (s === 'punnet'  || s === 'punnets')                                   return 'Punnet'
  // Title-case fallback for anything else
  return raw.trim().replace(/\b\w/g, c => c.toUpperCase())
}

function iconCode(displayName: string): string {
  // Lose It! stores icon names without spaces/punctuation: "Ranch Dressing" → "RanchDressing"
  if (!displayName || displayName === 'Default') return 'P__________'
  return displayName.replace(/[^A-Za-z0-9]/g, '')
}

// ── GWT body builders ──────────────────────────────────────────────────────────

function buildSearchFoodsBody(query: string, headerPerm: string): string {
  const st = [
    GWT_MODULE_BASE,
    GWT_BODY_PERMUTATION,                                                    // 2 — body perm (NOT header perm)
    'com.loseit.core.client.service.LoseItRemoteService',                    // 3
    'searchFoods',                                                           // 4
    'com.loseit.core.client.service.ServiceRequestToken/1076571655',        // 5
    'java.lang.String/2004016611',                                           // 6
    'I',                                                                     // 7
    'Z',                                                                     // 8
    'com.loseit.core.client.model.UserId/4281239478',                        // 9
    USERNAME,                                                                // 10
    query,                                                                   // 11
    'en-US',                                                                 // 12
  ]
  const params = `1|2|3|4|6|5|6|6|7|8|8|5|0|9|${USER_ID}|10|${TIMEZONE}|11|12|16|1|1`
  return `7|0|${st.length}|${st.join('|')}|${params}|`
}

function buildSaveFoodBody(item: Record<string, string | number>, headerPerm: string): { body: string; foodBytes: number[] } {
  const foodName    = String(item['Food Name'] || '')
  const brand       = String(item['Brand'] || '')
  const mealName    = String(item['Meal'] || 'Dinner')
  const mealType    = MEAL_TYPE_MAP[mealName] ?? 2
  const dateStr     = String(item['Date'] || '')
  const dayNumber   = daysSinceEpoch(dateStr)

  const servingRaw    = String(item['Serving Size'] || '1 Each')
  // Split on first space so multi-word units like "Fluid Ounce" stay intact
  const servingMatch  = servingRaw.match(/^(\d+(?:\.\d+)?)\s+(.+)$/)
  const servingAmount = servingMatch ? parseFloat(servingMatch[1]) || 1 : 1
  const servingUnit   = normalizeServingUnit(servingMatch ? servingMatch[2] : 'Each')
  const measureType   = SERVING_UNIT_MAP[servingUnit] ?? 5

  const allNutrients: Record<number, number> = {
    [NUTRIENT_KEYS.calories]:      Number(item['Calories'] || 0),
    [NUTRIENT_KEYS.carbs]:         Number(item['Carbs (g)'] || 0),
    [NUTRIENT_KEYS.fat]:           Number(item['Fat (g)'] || 0),
    [NUTRIENT_KEYS.fiber]:         Number(item['Fiber (g)'] || 0),
    [NUTRIENT_KEYS.protein]:       Number(item['Protein (g)'] || 0),
    [NUTRIENT_KEYS.sodium]:        Number(item['Sodium (mg)'] || 0),
    [NUTRIENT_KEYS.sugar]:         Number(item['Sugar (g)'] || 0),
    [NUTRIENT_KEYS.cholesterol]:   Number(item['Cholesterol (mg)'] || 0),
    [NUTRIENT_KEYS.saturated_fat]: Number(item['Saturated Fat (g)'] || 0),
  }
  // Send all 9 nutrients including zeros — Lose It! shows "-" for missing keys, not 0
  const nutrients = allNutrients

  const foodUuid  = crypto.randomUUID()
  const entryUuid = crypto.randomUUID()
  const foodBytes  = uuidToSignedBytes(foodUuid)
  const entryBytes = uuidToSignedBytes(entryUuid)
  const zDate  = makeZToken()
  const zEntry = makeZToken()
  const icon   = iconCode(String(item['Icon'] || ''))

  const st = [
    GWT_MODULE_BASE,                                                                          // 1
    GWT_BODY_PERMUTATION,                                                                     // 2 — body perm
    'com.loseit.core.client.service.LoseItRemoteService',                                     // 3
    'saveCustomFoodLogEntry',                                                                  // 4
    'com.loseit.core.client.service.ServiceRequestToken/1076571655',                          // 5
    'com.loseit.core.client.model.FoodLogEntry/264522954',                                    // 6
    'java.lang.String/2004016611',                                                            // 7
    'Z',                                                                                      // 8
    'com.loseit.core.client.model.UserId/4281239478',                                         // 9
    USERNAME,                                                                                  // 10
    'com.loseit.core.client.model.FoodIdentifier/2763145970',                                 // 11
    icon,                                                                                      // 12 — icon code (HAR: "RanchDressing", spaces stripped)
    foodName,                                                                                  // 13 — food name (diary display label)
    brand,                                                                                     // 14 — brand / restaurant
    'com.loseit.core.client.model.interfaces.FoodProductType/2860616120',                     // 15
    'com.loseit.core.client.model.SimplePrimaryKey/3621315060',                               // 16
    '[B/3308590456',                                                                           // 17
    'com.loseit.core.client.model.FoodLogEntryContext/4082213671',                            // 18
    'com.loseit.core.shared.model.DayDate/1611136587',                                        // 19
    'java.util.Date/3385151746',                                                               // 20
    'com.loseit.core.client.model.interfaces.FoodLogEntryType/1152459170',                    // 21
    'com.loseit.core.client.model.interfaces.FoodLogEntryTypeExtra/4048538730',               // 22
    'com.loseit.core.client.model.FoodServing/1858865662',                                    // 23
    'com.loseit.core.client.model.FoodNutrients/1097231324',                                  // 24
    'java.util.HashMap/1797211028',                                                            // 25
    'com.loseit.healthdata.model.shared.food.FoodMeasurement/2371921172',                     // 26
    'java.lang.Double/858496421',                                                              // 27
    'com.loseit.core.client.model.FoodServingSize/63998910',                                  // 28
    'com.loseit.core.client.model.FoodMeasure/1457474932',                                    // 29
    'en-US',                                                                                   // 30
  ]

  // Nutrient map: 25|count|26|key|27|value|...
  const nutrientEntries = Object.entries(nutrients)
    .sort(([a], [b]) => Number(a) - Number(b))
    .flatMap(([k, v]) => [26, Number(k), 27, fmtNum(v)])
  const nutrientMap = ['25', String(Object.keys(nutrients).length), ...nutrientEntries.map(String)]

  const foodUuidSection  = ['16', '17', '16', ...foodBytes.map(String)]
  const entryUuidSection = ['16', '17', '16', ...entryBytes.map(String)]

  const p: string[] = [
    // GWT header: module|perm|service|method
    '1', '2', '3', '4',
    // param count = 5
    '5',
    // ServiceRequestToken (7 fields decoded from HAR)
    '5', '6', '7', '8', '8', '5', '0',
    // UserId: type|id|username|timezone
    '9', String(USER_ID), '10', String(TIMEZONE),
    // FoodLogEntry type + FoodIdentifier header
    '6', '11',
    // FoodIdentifier: id | icon (pos2) | null | foodName (pos4=diary label) | brand
    // HAR confirmed: icon at index 12, foodName at index 13, brand at index 14
    '-1', '12', '0', '13', '14',
    // FoodProductType: type|0|-1|0|A
    '15', '0', '-1', '0', 'A',
    // Food UUID (SimplePrimaryKey with byte array)
    ...foodUuidSection,
    // FoodLogEntryContext
    '18', '0',
    // DayDate with Date field and Z-token
    '19', '20', zDate, String(dayNumber), String(TIMEZONE), '0', '-1', '0', '0', '0', '0',
    // FoodLogEntryType (meal) and FoodLogEntryTypeExtra
    '21', String(mealType), '22', '3',
    // FoodServing + FoodNutrients + flags
    '23', '24', '1', '1',
    // Nutrient HashMap
    ...nutrientMap,
    // FoodServingSize: type|1|1|FoodMeasure|measure_type|1|amount|amount|0|P__________
    // HAR confirmed: serving icon code "P__________" is always inline (not a string table ref)
    '28', '1', '1', '29', String(measureType), '1',
    fmtNum(servingAmount), fmtNum(servingAmount), '0', 'P__________',
    // Log entry Z-token
    zEntry,
    // Log entry UUID
    ...entryUuidSection,
    // Locale + trailing flags
    '30', '0', '1',
  ]

  // getFood looks up the food item definition by foodUuid, not the log entry by entryUuid
  return { body: `7|0|${st.length}|${st.join('|')}|${p.join('|')}|`, foodBytes }
}

// ── Diary readback (getFood) ───────────────────────────────────────────────────
// Confirmed from HAR 17-read-food-data.har.
// Calls getFood with the entry UUID bytes generated during saveCustomFoodLogEntry.
// Response contains actual nutrient values in pattern: {value},18,{key}

function buildGetFoodBody(foodBytes: number[]): string {
  const st = [
    GWT_MODULE_BASE,
    GWT_BODY_PERMUTATION,
    'com.loseit.core.client.service.LoseItRemoteService',
    'getFood',
    'com.loseit.core.client.service.ServiceRequestToken/1076571655',
    'com.loseit.core.client.model.interfaces.IPrimaryKey',
    'java.lang.String/2004016611',
    'com.loseit.core.client.model.UserId/4281239478',
    USERNAME,
    'com.loseit.core.client.model.SimplePrimaryKey/3621315060',
    '[B/3308590456',
  ]
  const p = [
    '1', '2', '3', '4',
    '3',                                               // 3 params
    '5', '6', '7', '5', '0',                          // ServiceRequestToken
    '8', String(USER_ID), '9', String(TIMEZONE),      // UserId
    '10', '11', '16', ...foodBytes.map(String), '0', // SimplePrimaryKey with food item UUID bytes
  ]
  return `7|0|${st.length}|${st.join('|')}|${p.join('|')}|`
}

interface GetFoodResult {
  nutrients: Record<number, number>
  strings: Set<string>  // all quoted strings in response — includes food name, brand, icon
}

function parseGetFoodResponse(responseText: string): GetFoodResult | null {
  if (!responseText.startsWith('//OK')) return null
  // Nutrients: confirmed pattern {value},18,{key} (HAR 17-read-food-data.har)
  const nutrients: Record<number, number> = {}
  for (const m of responseText.matchAll(/([0-9]+(?:\.[0-9]+)?),18,(\d+)/g)) {
    nutrients[Number(m[2])] = parseFloat(m[1])
  }
  // String table: food name + brand are quoted strings in the GWT response (confirmed HAR 17)
  const strings = new Set<string>()
  for (const m of responseText.matchAll(/"([^"]+)"/g)) strings.add(m[1])
  if (Object.keys(nutrients).length === 0 && strings.size === 0) return null
  return { nutrients, strings }
}

// ── Water logging (GWT RPC) ───────────────────────────────────────────────────
// Confirmed from HAR 16-water-logging.har.
// The CustomGoal object fields below are fixed to Brady's water goal (account-specific).
// To use for other accounts, discover these via a fresh HAR capture of the Goals water page.

const WATER_SAVE_STRING_TABLE = [
  GWT_MODULE_BASE,                                                                    // 1
  GWT_BODY_PERMUTATION,                                                               // 2
  'com.loseit.core.client.service.LoseItRemoteService',                               // 3
  'saveCustomGoalValue',                                                              // 4
  'com.loseit.core.client.service.ServiceRequestToken/1076571655',                   // 5
  'com.loseit.core.client.model.CustomGoal/3094185758',                              // 6
  'com.loseit.core.shared.model.DayDate/1611136587',                                 // 7
  'java.util.Date/3385151746',                                                        // 8
  'D',                                                                                // 9
  'com.loseit.core.client.model.UserId/4281239478',                                  // 10
  USERNAME,                                                                           // 11
  'java.lang.Double/858496421',                                                       // 12
  'Drink more than a specified amount of water each day.',                            // 13
  'com.loseit.core.client.model.CustomGoalType/3025174884',                          // 14
  'water',                                                                            // 15
  'com.loseit.core.client.model.CustomGoalMeasureFrequency/3968844069',              // 16
  'Water Intake',                                                                     // 17
  '',                                                                                 // 18
  'com.loseit.core.client.model.SimplePrimaryKey/3621315060',                        // 19
  '[B/3308590456',                                                                    // 20
]

// Fixed params that encode Brady's water CustomGoal object.
// Only the date/value suffix (appended at call time) changes per request.
// Z-tokens OO$pBbo / Y0_NC7o / ZIla1iI are object-level correlation IDs in the goal;
// UUID bytes are Brady's water goal primary key — both are fixed to this account.
const WATER_SAVE_FIXED_PREFIX =
  `1|2|3|4|6|5|6|7|8|9|9|5|0|10|${USER_ID}|11|${TIMEZONE}` +
  `|6|12|-1|0|0|13|7|8|OO$pBbo|-1|${TIMEZONE}|14|2|151|151|15|16|0|17|18|12|-1|12|-1` +
  `|7|8|Y0_NC7o|8425|${TIMEZONE}|-1|15|ZIla1iI` +
  `|19|20|16|-68|-65|-89|99|123|-24|77|-47|-105|-50|-78|23|-100|109|-58|22`

function buildWaterGetBody(dayNum: number): string {
  const st = [
    GWT_MODULE_BASE,
    GWT_BODY_PERMUTATION,
    'com.loseit.core.client.service.LoseItRemoteService',
    'getCustomGoalValues',
    'com.loseit.core.client.service.ServiceRequestToken/1076571655',
    'java.lang.String/2004016611',
    'com.loseit.core.shared.model.DayDate/1611136587',
    'com.loseit.core.client.model.UserId/4281239478',
    USERNAME,
    'water',
    'java.util.Date/3385151746',
  ]
  const zDate  = makeZToken()
  const params = `1|2|3|4|3|5|6|7|5|0|8|${USER_ID}|9|${TIMEZONE}|10|7|11|${zDate}|${dayNum}|${TIMEZONE}|`
  return `7|0|${st.length}|${st.join('|')}|${params}`
}

function buildWaterSaveBody(dayNum: number, totalOz: number): string {
  const n      = WATER_SAVE_STRING_TABLE.length
  const zDate  = makeZToken()
  const zVal   = makeZToken()
  const suffix = `7|8|${zDate}|${dayNum}|${TIMEZONE}|8|${zVal}|${fmtNum(totalOz)}|-1|`
  return `7|0|${n}|${WATER_SAVE_STRING_TABLE.join('|')}|${WATER_SAVE_FIXED_PREFIX}|${suffix}`
}

function parseCurrentWaterOz(responseText: string): number {
  // Response pattern: "Z_token",{OZ},"Z_token",... — first float after a Z-token is the current value.
  // From HAR: "ZFkkdbI",100.1,"ZFkkc74",10,-1.0,11,0,-5,8630 → 100.1 oz on day 8630 (confirmed).
  const m = responseText.match(/"[^"]+",([0-9]+(?:\.[0-9]+)?),/)
  if (m) {
    const val = parseFloat(m[1])
    if (Number.isFinite(val) && val >= 0 && val < 10000) return val
  }
  return 0
}

async function logWaterForDate(
  dateStr: string,
  addOz: number,
  gwtHeaders: Record<string, string>,
  outputLines: string[],
): Promise<void> {
  const dayNum = daysSinceEpoch(dateStr)

  // Read current total for this date
  let currentOz = 0
  try {
    const getResp = await fetch(LOSEIT_SERVICE_URL, {
      method:  'POST',
      headers: gwtHeaders,
      body:    buildWaterGetBody(dayNum),
      signal:  AbortSignal.timeout(15000),
    })
    const getText = await getResp.text()
    if (getText.startsWith('//OK')) currentOz = parseCurrentWaterOz(getText)
  } catch {
    // If read fails, assume 0 and proceed with addOz as the total
  }

  const newTotal = Math.round((currentOz + addOz) * 10) / 10
  try {
    const saveResp = await fetch(LOSEIT_SERVICE_URL, {
      method:  'POST',
      headers: gwtHeaders,
      body:    buildWaterSaveBody(dayNum, newTotal),
      signal:  AbortSignal.timeout(15000),
    })
    const saveText = await saveResp.text()
    if (saveText.startsWith('//OK')) {
      outputLines.push(`  💧 Water: ${dateStr} ${currentOz}→${newTotal} fl oz (+${addOz})`)
    } else {
      outputLines.push(`  ⚠ Water save error for ${dateStr}: ${saveText.slice(0, 80)}`)
    }
  } catch (err) {
    outputLines.push(`  ⚠ Water network error for ${dateStr}: ${err}`)
  }
}

function parseGwtResponse(text: string): { status: 'ok' | 'exception' | 'unknown' | 'auth_failed'; raw: string } {
  if (text.startsWith('//OK'))  return { status: 'ok',          raw: text }
  if (text.startsWith('//EX')) return { status: 'exception',   raw: text }
  // Auth failure: Lose It! redirected to login page — response is HTML, not GWT
  if (text.trimStart().startsWith('<!') || text.trimStart().startsWith('<html')) {
    return { status: 'auth_failed', raw: text.slice(0, 100) }
  }
  return { status: 'unknown', raw: text.slice(0, 300) }
}

// ── Food item text parser (mirrors utils.py parse_food_items) ─────────────────

function parseFoodItem(text: string, logWater: boolean): Record<string, string | number | boolean> | null {
  const item: Record<string, string | number | boolean> = {}
  for (const line of text.trim().split('\n')) {
    const colonIdx = line.indexOf(': ')
    if (colonIdx > 0) {
      item[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 2).trim()
    }
  }
  if (Object.keys(item).length === 0) return null

  // Parse fluid_ounces from serving size
  const serving = String(item['Serving Size'] || '')
  if (serving.toLowerCase().includes('fluid ounce') || serving.toLowerCase().includes('fluid oz')) {
    item['fluid_ounces'] = parseFloat(serving.split(' ')[0]) || 0
  } else {
    item['fluid_ounces'] = 0
  }
  item['log_water'] = logWater
  return item
}

// ── Netlify Function handler ───────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  // Prefer per-user cookie from Firestore; fall back to env var
  const authHeader = event.headers['authorization'] || event.headers['Authorization']
  const cookie = (await getLoseItCookie(authHeader)) || process.env.LOSEIT_COOKIE?.trim()
  if (!cookie) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Lose It! session not configured. Open Settings and paste your Lose It! cookie.',
        errorCode: 'loseit_not_configured',
      }),
    }
  }
  const headerPerm = process.env.LOSEIT_GWT_PERMUTATION?.trim() || '79FCB90B69F5FF2C7877662E5529652C'

  // ── Parse request ─────────────────────────────────────────────────────────
  let foodItemTexts: string[] = []
  let logWater = false
  try {
    const body = JSON.parse(event.body || '{}')
    foodItemTexts = body.food_items || []
    logWater = Boolean(body.log_water)
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: 'Invalid JSON body' }),
    }
  }

  if (!foodItemTexts.length) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: 'No food items provided' }),
    }
  }

  // ── GWT request headers ───────────────────────────────────────────────────
  const gwtHeaders: Record<string, string> = {
    'Content-Type':          'text/x-gwt-rpc; charset=UTF-8',
    'x-gwt-module-base':     GWT_MODULE_BASE,
    'x-gwt-permutation':     headerPerm,
    'x-loseit-gwtversion':   'devmode',
    'x-loseit-hoursfromgmt': String(TIMEZONE),
    'origin':                'https://www.loseit.com',
    'referer':               'https://www.loseit.com/',
    'User-Agent':            USER_AGENT,
    'Cookie':                cookie,
  }

  // ── Log each food item ────────────────────────────────────────────────────
  const outputLines: string[] = []
  const verification: Record<string, unknown> = {}
  const logged: Record<string, string | number | boolean>[]    = []
  const failed:  Record<string, string | number | boolean>[]   = []
  const startTime = Date.now()

  // Accumulate fluid oz per date (for water logging after all food items are done)
  const waterByDate: Map<string, number> = new Map()

  for (let i = 0; i < foodItemTexts.length; i++) {
    const foodItem = parseFoodItem(foodItemTexts[i], logWater)
    if (!foodItem) {
      outputLines.push(`Item ${i + 1}: skipped (could not parse)`)
      continue
    }

    const name = String(foodItem['Food Name'] || `Item ${i + 1}`)
    outputLines.push(`Logging item ${i + 1} of ${foodItemTexts.length}: ${name}`)

    try {
      const { body: gwtBody, foodBytes } = buildSaveFoodBody(foodItem, headerPerm)
      const resp = await fetch(LOSEIT_SERVICE_URL, {
        method:  'POST',
        headers: gwtHeaders,
        body:    gwtBody,
        signal:  AbortSignal.timeout(20000),
      })

      const respText  = await resp.text()
      const gwtResult = parseGwtResponse(respText)

      if (gwtResult.status === 'ok') {
        logged.push(foodItem)
        outputLines.push(`  ✓ Accepted by Lose It! (${name})`)

        // Read back from diary and verify actual stored values
        let readback: GetFoodResult | null = null
        try {
          const getResp = await fetch(LOSEIT_SERVICE_URL, {
            method:  'POST',
            headers: gwtHeaders,
            body:    buildGetFoodBody(foodBytes),
            signal:  AbortSignal.timeout(15000),
          })
          readback = parseGetFoodResponse(await getResp.text())
        } catch { /* non-fatal — fall back to accepted-only verification */ }

        verification[String(i)] = buildVerification(foodItem, 'accepted', undefined, readback)

        // Track fluid oz for water logging (only from successfully logged items)
        if (logWater) {
          const fluidOz = Number(foodItem['fluid_ounces'] || 0)
          if (fluidOz > 0) {
            const dateStr = String(foodItem['Date'] || '')
            waterByDate.set(dateStr, (waterByDate.get(dateStr) ?? 0) + fluidOz)
          }
        }
      } else if (gwtResult.status === 'auth_failed') {
        // Cookie expired — bail early, no point retrying remaining items
        failed.push(foodItem)
        outputLines.push(`  ✗ Lose It! session expired — update your cookie in Settings`)
        verification[String(i)] = buildVerification(foodItem, 'failed', 'auth_failed')
        return {
          statusCode: 401,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: false,
            message: 'Your Lose It! session has expired. Open Settings and paste a fresh cookie.',
            errorCode: 'loseit_session_expired',
            output: outputLines.join('\n'),
            verification,
          }),
        }
      } else {
        failed.push(foodItem)
        outputLines.push(`  ✗ GWT error for ${name}: ${gwtResult.raw.slice(0, 120)}`)
        verification[String(i)] = buildVerification(foodItem, 'failed', gwtResult.raw)
      }
    } catch (err) {
      failed.push(foodItem)
      outputLines.push(`  ✗ Network error for ${name}: ${err}`)
      verification[String(i)] = buildVerification(foodItem, 'failed', String(err))
    }
  }

  // ── Water logging ─────────────────────────────────────────────────────────
  if (logWater && waterByDate.size > 0) {
    for (const [dateStr, addOz] of waterByDate) {
      await logWaterForDate(dateStr, addOz, gwtHeaders, outputLines)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const allOk   = failed.length === 0 && logged.length > 0
  const message = allOk
    ? `Successfully logged ${logged.length} of ${foodItemTexts.length} items in ${elapsed}s`
    : `Logged ${logged.length} of ${foodItemTexts.length} items in ${elapsed}s (${failed.length} failed)`

  return {
    statusCode: allOk ? 200 : 207,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: allOk,
      message,
      output:  outputLines.join('\n'),
      verification,
    }),
  }
}

// ── Verification builder ──────────────────────────────────────────────────────

function buildVerification(
  item: Record<string, string | number | boolean>,
  status: 'accepted' | 'failed',
  error?: string,
  readback?: GetFoodResult | null,
): object {
  const ok = status === 'accepted'
  const hasReadback = ok && readback != null
  const { nutrients: actualNutrients, strings: responseStrings } = readback ?? { nutrients: {}, strings: new Set<string>() }

  const nutrientKeyMap: Record<string, { key: number; label: string }> = {
    calories:     { key: NUTRIENT_KEYS.calories,      label: 'Calories' },
    fatG:         { key: NUTRIENT_KEYS.fat,           label: 'Fat (g)' },
    satFatG:      { key: NUTRIENT_KEYS.saturated_fat, label: 'Saturated Fat (g)' },
    cholesterolMg:{ key: NUTRIENT_KEYS.cholesterol,   label: 'Cholesterol (mg)' },
    sodiumMg:     { key: NUTRIENT_KEYS.sodium,        label: 'Sodium (mg)' },
    carbsG:       { key: NUTRIENT_KEYS.carbs,         label: 'Carbs (g)' },
    fiberG:       { key: NUTRIENT_KEYS.fiber,         label: 'Fiber (g)' },
    sugarG:       { key: NUTRIENT_KEYS.sugar,         label: 'Sugar (g)' },
    proteinG:     { key: NUTRIENT_KEYS.protein,       label: 'Protein (g)' },
  }

  const fields: Record<string, unknown> = {}
  let allMatch = ok
  const mismatches: string[] = []

  // Food name — confirmed present in getFood response string table (HAR 17)
  const expectedName  = String(item['Food Name'] || '')
  const expectedBrand = String(item['Brand'] || '')
  const nameActual    = hasReadback ? (responseStrings.has(expectedName)  ? expectedName  : null) : null
  const brandActual   = hasReadback ? (responseStrings.has(expectedBrand) ? expectedBrand : null) : null
  const nameMatches   = hasReadback ? nameActual  !== null : ok
  const brandMatches  = hasReadback ? brandActual !== null : ok
  if (hasReadback && !nameMatches)  { allMatch = false; mismatches.push(`foodName: '${expectedName}' not found in diary`) }
  if (hasReadback && !brandMatches) { allMatch = false; mismatches.push(`brand: '${expectedBrand}' not found in diary`) }
  fields['foodName'] = { expected: expectedName,  actual: nameActual,  matches: nameMatches }
  fields['brand']    = { expected: expectedBrand, actual: brandActual, matches: brandMatches }

  // Nutrients — compared by value with 0.1 tolerance for float rounding
  for (const [field, { key, label }] of Object.entries(nutrientKeyMap)) {
    const exp    = Number(item[label] || 0)
    const actual = hasReadback ? (actualNutrients[key] ?? null) : null
    const matches = hasReadback
      ? actual !== null && Math.abs(actual - exp) < 0.1
      : ok
    if (hasReadback && !matches) {
      allMatch = false
      mismatches.push(`${field}: expected ${exp}, got ${actual}`)
    }
    fields[field] = { expected: exp, actual, matches }
  }

  const level = !ok ? 'failed' : hasReadback ? (allMatch ? 'verified' : 'mismatch') : 'accepted'

  return {
    ...fields,
    allFieldsMatch:       allMatch,
    verificationComplete: true,
    verificationLevel:    level,
    ...(mismatches.length ? { mismatches } : {}),
    ...(error ? { error } : {}),
  }
}
