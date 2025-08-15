// /src/lib/foodValidator.ts
// Validates and normalizes AI output to your EXACT format.

const ICONS = new Set(
  "Alcohol; Alcohol, White; Almond; Almond Butter; Apple; Apple Sauce; Apple, Gala; Apple, Granny Smith; Apple, Honey Crisp; Apple, Macintosh; Artichoke; Asparagus; Avocado; Bacon; Bagel; Bagel, Blueberry; Bagel, Chocolate Chip; Bagel, Sesame; Baguette; Baked Beans; Balsamic Vinaigrette; Bamboo; Banana; Banana Pepper; Bar; Bean, Black; Bean, Green; Bean, Red; Bean, White; Beef; Beer; BeerDark; Beet; Bell Pepper, Green; Bell Pepper, Red; Bell Pepper, Yellow; Biscuit; Biscuit Cracker; Blackberry; Blueberry; Breadsticks; Breakfast; Breakfast Sandwich; Broccoli; Brownie; Brussels Sprout; Burrito; Butter; Cabbage; Cake; CakeDark; CakeWhite; CakeWhiteDark; Calamari; Calories; Can; Candy; Candy Bar; Carrot; Carrots; Cashew; Casserole; Cauliflower; Celery; Cereal; Cereal Bar; CerealCheerios; CerealCornFlakes; CerealFruitLoops; Cheese; CheeseAmerican; CheeseBlue; CheeseBrie; Cheeseburger; Cheesecake; CheeseCheddar; CheeseGouda; CheesePepperjack; Cherry; CherryMaraschino; Chestnut; Chicken; Chicken Tenders; ChickenGrilled; ChickenWing; Chickpea; Chocolate; Chocolate Chip; Chocolate Chips; ChocolateDark; Churro; Cider; Cinnamon Roll; Clam; Coconut; Coffee; Coleslaw; Com; Combread; Cookie; Cookie, Christmas; Cookie, Molasses; Cookie, Red Velvet; Cookie, Sugar; Cottage Cheese; Crab; Cracker; Cranberry; Cream; Croissant; Crouton; Crumpet; Cucumber; Cupcake; Cupcake, Carrot; Cupcake, Vanilla; Curry; Date; Default; Deli Meat; Dinner Roll; Dip, Green; Dip, Red; Dish; Donut; Donut, Chocolate Iced; Donut, Strawberry Iced; DoubleCheeseburger; Dressing, Ranch; Dumpling; Eclair; Egg; Egg McMuffin; Egg Roll; Eggplant; Enchilada; Falafel; Fern; Fig; Filbert; Fish; Food, Can; Fowl; French Fries; French Toast; Fritter; Frosting, Chocolate; Frosting, Yellow; Fruit Cocktail; Fruit Leather; FruitCake; Game; Garlic; Gobo Root; Gourd; Graham Cracker; Grain; Grapefruit; Grapes; Grilled Cheese; Guava; Gummy Bear; Hamburger; Hamburger Bun; Hamburger Patty; Hamburger, Double; Hash; Hazelnut; Honey; Horseradish; Hot Dog; Hot Dog Bun; Hot Pot; Ice Cream; Ice Cream Bar; Ice Cream Sandwich; Ice Cream, Chocolate; Ice Cream, Strawberry; Iced Coffee; Iced Tea; Jam; Jicama; Juice; Kale; Kebab; Ketchup; Kiwi; Lamb; Lasagna; Latte; Leeks; Lemon; Lemonade; Lime; Liquid; Lobster; Mac And Cheese; Macadamia; Mango; Marshmallow; Mayonnaise; Meatballs; Melon; Milk; Milk Shake; Milk Shake, Chocolate; Milk Shake, Strawberry; Mixed Drink; Mixed Drink, Martini; Mixed Nuts; Muffin; Mushroom; Mustard; Nigiri Sushi; Oatmeal; Octopus; Oil; Okra; Olive, Black; Olive, Green; Omelette; Onion; Orange; Orange Chicken; Orange Juice; Pancakes; Papaya; Parfait; Parsley; Parsnip; Pasta; Pastry; Patty Sandwich; Pavlova; Peach; Peanut; Peanut Butter; Pear; Peas; Pecan; Peppers; Persimmon; Pickle; Pie; Pie, Apple; Pill; Pine Nut; Pineapple; Pistachio; Pita Sandwich; Pizza; Plum; Pocky; Pomegranate; Popcom; Popsicle; Pork; Pork Chop; Pot Pie; Potato; Potato Chip; Potato Salad; Powdered Drink; Prawn; Pretzel; Prune; Pudding; Pumpkin; Quesadilla; Quiche; Radish; Raisin; Raspberry; Ravioli; Recipe; Relish; Rhubarb; Ribs; Rice; Rice Cake; Roll; Romaine Lettuce; Salad; Salad Dressing, Balsamic; Salt; Sandwich; Sauce; Sausage; Seaweed; Seed; Shallot; Shrimp; Smoothie; Snack; Snap Bean; Soft Drink; SoftServeChocolate; SoftServeSwirl; SoftServeVanilla; Souffle; Soup; Sour Cream; Soy Nut; Soy Sauce; Spice, Brown; Spice, Green; Spice, Red; Spice, Yellow; Spinach; Spring Roll; Sprouts; Squash; Squash, Spaghetti; Starfruit; Stew, Brown; Stew, Yellow; Stir Fry; Stir Fry Noodles; Strawberry; Stuffing; Sub Sandwich; Sugar Cookie; Sugar, Brown; Sugar, White; Sushi; Syrup; Taco; Taro; Tater Tots; Tea; Tempura; Toast; Toaster Pastry; Tofu; Tomato; Tomato Soup; Tortilla; Tortilla Chip; Tostada; Turkey; Turnip; Turnover; Vegetable; Waffles; Walnut; Water; Water Chestnut; Watermelon; White Bread; Wine, Red; Wine, White; Wrap; Yam; Yogurt; Zucchini"
    .split("; ")
);

type UnitGroup = "weight" | "volume" | "amount";

// Canonical LOWERCASE unit strings for your Selenium format
const UNITS: Record<UnitGroup, string[]> = {
  weight: ["grams", "kilograms", "micrograms", "milligrams", "ounces", "pounds"],
  volume: [
    "cups",
    "dessertspoons",
    "fluid ounce",
    "gallons",
    "imperial fluid ounces",
    "imperial pints",
    "imperial quarts",
    "liters",
    "metric cups",
    "milliliters",
    "pints",
    "quarts",
    "tablespoons",
    "teaspoons",
  ],
  amount: [
    "bottle",
    "box",
    "can",
    "container",
    "cube",
    "dry cup",
    "each",
    "jar",
    "package",
    "piece",
    "pot",
    "pouch",
    "punnet",
    "scoop",
    "serving",
    "slice",
    "stick",
    "tablet",
  ],
};

// Map a bunch of possible model spellings to your canonical lowercase forms
const UNIT_ALIASES: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const add = (canonical: string, ...syns: string[]) => {
    [canonical, ...syns].forEach(s => (map[s] = canonical));
  };

  // weight
  add("grams", "gram", "g", "gr");
  add("kilograms", "kilogram", "kg");
  add("micrograms", "microgram", "mcg", "µg");
  add("milligrams", "milligram", "mg");
  add("ounces", "ounce", "oz");
  add("pounds", "pound", "lb", "lbs");

  // volume
  add("cups", "cup");
  add("dessertspoons", "dessertspoon");
  add("fluid ounce", "fluid ounces", "fl oz", "fl. oz", "fluid-ounces", "fl-oz");
  add("gallons", "gallon", "gal");
  add("imperial fluid ounces", "imperial fluid ounce");
  add("imperial pints", "imperial pint");
  add("imperial quarts", "imperial quart");
  add("liters", "liter", "l", "ltr");
  add("metric cups", "metric cup");
  add("milliliters", "milliliter", "ml", "mL");
  add("pints", "pint", "pt");
  add("quarts", "quart", "qt");
  add("tablespoons", "tablespoon", "tbsp");
  add("teaspoons", "teaspoon", "tsp");

  // amount
  ["bottle","box","can","container","cube","jar","package","piece","pot","pouch","punnet","scoop","serving","slice","stick","tablet","dry cup","each"]
    .forEach(u => add(u, u)); // identity (kept for completeness)

  return map;
})();

const REQUIRED_FIELDS = [
  "Food Name",
  "Date",
  "Meal",
  "Brand",
  "Icon",
  "Serving Size",
  "Calories",
  "Fat (g)",
  "Saturated Fat (g)",
  "Cholesterol (mg)",
  "Sodium (mg)",
  "Carbs (g)",
  "Fiber (g)",
  "Sugar (g)",
  "Protein (g)",
] as const;

const OPTIONAL_FIELDS = ["Hydration"] as const;

type Fields = Record<(typeof REQUIRED_FIELDS)[number] | (typeof OPTIONAL_FIELDS)[number], string | undefined>;

export function validateAndNormalizeResponse(raw: string): string {
  const items = splitOnBlankLines(raw.trim());
  if (items.length === 0) throw new Error("No items found.");

  console.log('Raw AI response:', raw); // Debug logging

  const normalizedItems = items.map((block, idx) => {
    console.log(`Processing item ${idx + 1}:`, block); // Debug logging
    const fields = parseBlock(block);
    enforceRequired(fields, idx);
    normalizeIcon(fields, idx);
    normalizeServingSize(fields, idx);
    normalizeNumbers(fields, idx);
    normalizeHydration(fields);
    console.log(`Normalized item ${idx + 1}:`, fields); // Debug logging
    return stringifyBlock(fields);
  });

  return normalizedItems.join("\n\n");
}

function splitOnBlankLines(s: string): string[] {
  return s.split(/\n\s*\n/).map(v => v.trim()).filter(Boolean);
}

function parseBlock(block: string): Fields {
  const lines = block.split("\n").map(l => l.trim());
  const fields: Partial<Fields> = {};
  for (const line of lines) {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) throw new Error(`Invalid line format: "${line}"`);
    const key = m[1].trim();
    const val = m[2].trim();
    if (![...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].includes(key as any)) {
      throw new Error(`Unexpected field "${key}".`);
    }
    (fields as any)[key] = val;
  }
  return fields as Fields;
}

function enforceRequired(fields: Fields, idx: number) {
  for (const key of REQUIRED_FIELDS) {
    const v = fields[key];
    if (v == null || v === "") {
      throw new Error(`Missing "${key}" in item ${idx + 1}.`);
    }
  }
  // meal whitelist
  if (!/^(Breakfast|Lunch|Dinner|Snacks)$/.test(fields["Meal"]!)) {
    throw new Error(`Invalid Meal in item ${idx + 1}. Must be Breakfast, Lunch, Dinner, or Snacks.`);
  }
  // Force MM/DD date format (no year)
  normalizeDateField(fields);
}

function normalizeDateField(fields: Fields) {
  const d = fields["Date"];
  if (!d) return;
  const m = d.match(/^\s*(\d{1,2})[/-](\d{1,2})(?:[/-]\d{2,4})?\s*$/);
  if (m) {
    const month = Number(m[1]);
    const day = Number(m[2]);
    fields["Date"] = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
  }
}

function normalizeIcon(fields: Fields, idx: number) {
  const icon = fields["Icon"]!;
  if (!ICONS.has(icon)) throw new Error(`Invalid Icon "${icon}" in item ${idx + 1}.`);
}

function normalizeServingSize(fields: Fields, idx: number) {
  const raw = fields["Serving Size"]!;
  
  // Fix common malformed patterns first
  let cleaned = raw.replace(/\s+/g, ' ').trim();
  
  // Fix "1 2 serving" → "1/2 serving"
  if (cleaned.match(/^(\d+)\s+(\d+)\s+serving$/i)) {
    const num1 = parseInt(cleaned.match(/^(\d+)\s+(\d+)\s+serving$/i)![1]);
    const num2 = parseInt(cleaned.match(/^(\d+)\s+(\d+)\s+serving$/i)![2]);
    if (num1 === 1 && num2 === 2) {
      fields["Serving Size"] = "1/2 serving";
      return;
    }
  }
  
  // Fix "2 2 each" → "2 each"
  if (cleaned.match(/^(\d+)\s+\1\s+each$/i)) {
    const num = parseInt(cleaned.match(/^(\d+)\s+\1\s+each$/i)![1]);
    fields["Serving Size"] = `${num} each`;
    return;
  }
  
  // Handle special cases
  if (cleaned.toLowerCase().includes('serving')) {
    // For "serving" units, just clean up the format
    if (cleaned.match(/^\d+\/\d+\s+serving$/i)) {
      fields["Serving Size"] = cleaned.toLowerCase();
      return;
    }
    if (cleaned.match(/^\d+\s+serving$/i)) {
      fields["Serving Size"] = cleaned.toLowerCase();
      return;
    }
  }
  
  // Accept patterns like "3 Each", "3.5 Each", "8 fluid ounces", "507 grams"
  const m = cleaned.match(/^\s*([\d\s\/.-]+)\s+(.+?)\s*$/i);
  if (!m) throw new Error(`Invalid Serving Size format in item ${idx + 1}. Use "<amount> <unit>".`);
  const amountStr = m[1].trim();
  const unitRaw = m[2].trim().toLowerCase();

  const amount = parseNumberOrFraction(amountStr);
  if (!(amount > 0)) throw new Error(`Invalid Serving Size amount in item ${idx + 1}.`);

  // Canonicalize unit via aliases
  const unitCanonical = UNIT_ALIASES[unitRaw] || UNIT_ALIASES[singularize(unitRaw)] || unitRaw;
  const isAllowed = Object.values(UNITS).some(arr => arr.includes(unitCanonical));
  if (!isAllowed) throw new Error(`Serving unit "${m[2]}" not allowed in item ${idx + 1}.`);

  // Your Selenium format uses lowercase with correct pluralization:
  // - plural if amount !== 1 for countable/measure units (except "each" which doesn't pluralize)
  const finalUnit = pluralizeUnit(unitCanonical, amount);

  fields["Serving Size"] = `${toTrimmed(amount)} ${finalUnit}`;
}

function normalizeHydration(fields: Fields) {
  if (!fields["Hydration"]) return;
  const m = fields["Hydration"]!.match(/^\s*([\d\s\/.-]+)\s+(.*)$/i);
  if (!m) throw new Error(`Invalid Hydration format. Use "<number> fluid ounces".`);
  const amount = parseNumberOrFraction(m[1].trim());
  const unitRaw = m[2].trim().toLowerCase();
  const canonical = UNIT_ALIASES[unitRaw] || unitRaw;
  if (canonical !== "fluid ounce") throw new Error(`Hydration unit must be "fluid ounces".`);
  fields["Hydration"] = `${toTrimmed(amount)} ${pluralizeUnit("fluid ounce", amount)}`;
}

function normalizeNumbers(fields: Fields, idx: number) {
  // Ensure numeric fields contain numbers only
  const numericKeys: (keyof Fields)[] = [
    "Calories",
    "Fat (g)",
    "Saturated Fat (g)",
    "Cholesterol (mg)",
    "Sodium (mg)",
    "Carbs (g)",
    "Fiber (g)",
    "Sugar (g)",
    "Protein (g)",
  ];
  for (const k of numericKeys) {
    const v = fields[k];
    if (!v) throw new Error(`Missing ${k} in item ${idx + 1}.`);
    const num = parseNumberOrFraction(v);
    if (!isFinite(num)) throw new Error(`Invalid number for ${k} in item ${idx + 1}.`);
    fields[k] = toTrimmed(num);
  }
}

function stringifyBlock(fields: Fields): string {
  const lines = REQUIRED_FIELDS.map(k => `${k}: ${fields[k]}`);
  if (fields["Hydration"]) lines.push(`Hydration: ${fields["Hydration"]}`);
  return lines.join("\n");
}

function parseNumberOrFraction(s: string): number {
  // Handles "4 1/2", "1/3", "3.5", "3,500" etc.
  const cleaned = s.replace(/,/g, " ").trim();
  // Mixed number e.g., "4 1/2"
  const mixed = cleaned.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const a = parseFloat(mixed[1]);
    const b = parseFloat(mixed[2]);
    const c = parseFloat(mixed[3]);
    return a + (c ? b / c : 0);
  }
  // Simple fraction e.g., "1/2"
  const frac = cleaned.match(/^(-?\d+)\/(\d+)$/);
  if (frac) {
    const a = parseFloat(frac[1]);
    const b = parseFloat(frac[2]);
    return b ? a / b : NaN;
  }
  // Decimal/integer
  const n = Number(cleaned);
  return n;
}

function toTrimmed(n: number): string {
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(3))).replace(/\.?0+$/, "");
}

function singularize(u: string): string {
  // quick pass for common plurals; we keep "each" invariant
  if (u === "each") return u;
  if (u.endsWith("s")) return u.slice(0, -1);
  return u;
}

function pluralizeUnit(unitCanonical: string, amount: number): string {
  if (unitCanonical === "each") return "each";
  // special case: "fluid ounce" must pluralize to "fluid ounces"
  if (unitCanonical === "fluid ounce") return amount === 1 ? "fluid ounce" : "fluid ounces";
  // simple pluralization for others
  const needsPlural = Math.abs(amount) !== 1;
  if (!needsPlural) {
    // make singular (remove trailing s)
    return singularize(unitCanonical);
  }
  // add s if not present
  return unitCanonical.endsWith("s") ? unitCanonical : `${unitCanonical}s`;
}
