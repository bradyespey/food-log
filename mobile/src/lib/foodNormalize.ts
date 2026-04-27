import type { FoodItem } from '../types';

export const SERVING_TYPES = 'Serving Weight: Grams, Kilograms, Micrograms, Milligrams, Ounces, Pounds; Serving Volume: Cups, Dessertspoons, Fluid Ounce, Gallons, Imperial Fluid Ounces, Imperial Gallons, Imperial Pints, Imperial Quarts, Liters, Metric Cups, Milliliters, Pints, Quarts, Tablespoons, Teaspoons; Serving Amount: Bottle, Box, Can, Container, Cube, Dry Cup, Each, Ind Package, Jar, Package, Piece, Pot, Pouch, Punnet, Scoop, Serving, Slice, Stick, Tablet';

export const ICON_LIST = 'Alcohol; Alcohol, White; Almond; Almond Butter; Apple; Apple Sauce; Apple, Gala; Apple, Granny Smith; Apple, Honey Crisp; Apple, Macintosh; Artichoke; Asparagus; Avocado; Bacon; Bagel; Bagel, Blueberry; Bagel, Chocolate Chip; Bagel, Sesame; Baguette; Baked Beans; Balsamic Vinaigrette; Bamboo; Banana; Banana Pepper; Bar; Bean, Black; Bean, Green; Bean, Red; Bean, White; Beef; Beer; BeerDark; Beet; Bell Pepper, Green; Bell Pepper, Red; Bell Pepper, Yellow; Biscuit; Biscuit Cracker; Blackberry; Blueberry; Breadsticks; Breakfast; Breakfast Sandwich; Broccoli; Brownie; Brussels Sprout; Burrito; Butter; Cabbage; Cake; CakeDark; CakeWhite; CakeWhiteDark; Calamari; Calories; Can; Candy; Candy Bar; Carrot; Carrots; Cashew; Casserole; Cauliflower; Celery; Cereal; Cereal Bar; CerealCheerios; CerealCornFlakes; CerealFruitLoops; Cheese; CheeseAmerican; CheeseBlue; CheeseBrie; Cheeseburger; Cheesecake; CheeseCheddar; CheeseGouda; CheesePepperjack; Cherry; CherryMaraschino; Chestnut; Chicken; Chicken Tenders; ChickenGrilled; ChickenWing; Chickpea; Chocolate; Chocolate Chip; Chocolate Chips; ChocolateDark; Churro; Cider; Cinnamon Roll; Clam; Coconut; Coffee; Coleslaw; Com; Combread; Cookie; Cookie, Christmas; Cookie, Molasses; Cookie, Red Velvet; Cookie, Sugar; Cottage Cheese; Crab; Cracker; Cranberry; Cream; Croissant; Crouton; Crumpet; Cucumber; Cupcake; Cupcake, Carrot; Cupcake, Vanilla; Curry; Date; Default; Deli Meat; Dinner Roll; Dip, Green; Dip, Red; Dish; Donut; Donut, Chocolate Iced; Donut, Strawberry Iced; DoubleCheeseburger; Dressing, Ranch; Dumpling; Eclair; Egg; Egg McMuffin; Egg Roll; Eggplant; Enchilada; Falafel; Fern; Fig; Filbert; Fish; Food, Can; Fowl; French Fries; French Toast; Fritter; Frosting, Chocolate; Frosting, Yellow; Fruit Cocktail; Fruit Leather; FruitCake; Game; Garlic; Gobo Root; Gourd; Graham Cracker; Grain; Grapefruit; Grapes; Grilled Cheese; Guava; Gummy Bear; Hamburger; Hamburger Bun; Hamburger Patty; Hamburger, Double; Hash; Hazelnut; Honey; Horseradish; Hot Dog; Hot Dog Bun; Hot Pot; Ice Cream; Ice Cream Bar; Ice Cream Sandwich; Ice Cream, Chocolate; Ice Cream, Strawberry; Iced Coffee; Iced Tea; Jam; Jicama; Juice; Kale; Kebab; Ketchup; Kiwi; Lamb; Lasagna; Latte; Leeks; Lemon; Lemonade; Lime; Liquid; Lobster; Mac And Cheese; Macadamia; Mango; Marshmallow; Mayonnaise; Meatballs; Melon; Milk; Milk Shake; Milk Shake, Chocolate; Milk Shake, Strawberry; Mixed Drink; Mixed Drink, Martini; Mixed Nuts; Muffin; Mushroom; Mustard; Nigiri Sushi; Oatmeal; Octopus; Oil; Okra; Olive, Black; Olive, Green; Omelette; Onion; Orange; Orange Chicken; Orange Juice; Pancakes; Papaya; Parfait; Parsley; Parsnip; Pasta; Pastry; Patty Sandwich; Pavlova; Peach; Peanut; Peanut Butter; Pear; Peas; Pecan; Peppers; Persimmon; Pickle; Pie; Pie, Apple; Pill; Pine Nut; Pineapple; Pistachio; Pita Sandwich; Pizza; Plum; Pocky; Pomegranate; Popcom; Popsicle; Pork; Pork Chop; Pot Pie; Potato; Potato Chip; Potato Salad; Powdered Drink; Prawn; Pretzel; Prune; Pudding; Pumpkin; Quesadilla; Quiche; Radish; Raisin; Raspberry; Ravioli; Recipe; Relish; Rhubarb; Ribs; Rice; Rice Cake; Roll; Romaine Lettuce; Salad; Salad Dressing, Balsamic; Salt; Sandwich; Sauce; Sausage; Seaweed; Seed; Shallot; Shrimp; Smoothie; Snack; Snap Bean; Soft Drink; SoftServeChocolate; SoftServeSwirl; SoftServeVanilla; Souffle; Soup; Sour Cream; Soy Nut; Soy Sauce; Spice, Brown; Spice, Green; Spice, Red; Spice, Yellow; Spinach; Spring Roll; Sprouts; Squash; Squash, Spaghetti; Starfruit; Stew, Brown; Stew, Yellow; Stir Fry; Stir Fry Noodles; Strawberry; Stuffing; Sub Sandwich; Sugar Cookie; Sugar, Brown; Sugar, White; Sushi; Syrup; Taco; Taro; Tater Tots; Tea; Tempura; Toast; Toaster Pastry; Tofu; Tomato; Tomato Soup; Tortilla; Tortilla Chip; Tostada; Turkey; Turnip; Turnover; Vegetable; Waffles; Walnut; Water; Water Chestnut; Watermelon; White Bread; Wine, Red; Wine, White; Wrap; Yam; Yogurt; Zucchini';

export const ICON_OPTIONS = ICON_LIST.split('; ').map((i) => i.trim());

export const SERVING_UNIT_OPTIONS = SERVING_TYPES.split(';')
  .flatMap((part) => {
    const afterColon = part.includes(':') ? part.split(':').slice(1).join(':') : part;
    return afterColon.split(',').map((u) => u.trim()).filter(Boolean);
  })
  .filter((unit, idx, arr) => arr.indexOf(unit) === idx);

export function normalizeFoodItem(item: FoodItem): FoodItem {
  const icon = validateIcon(item.icon);
  const properName = truncateFoodName(toProperCase(standardizeFoodName(item.foodName, icon)));
  const normalized: FoodItem = {
    ...item,
    foodName: properName,
    brand: item.brand ? toProperCase(item.brand) : '',
    icon,
    serving: { ...item.serving },
    hydration: item.hydration ?? { isLiquid: false, fluidOz: 0 },
  };

  return fillMissingNutrition(normalizeServingForLoseIt(normalized));
}

export function deduplicateItems(items: FoodItem[]): FoodItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.foodName.toLowerCase().trim()}|${item.date}|${item.meal}|${item.brand.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function validateIcon(icon: string): string {
  if (ICON_OPTIONS.includes(icon)) return icon;
  const iconMap: Record<string, string> = {
    Bread: 'Breadsticks',
    Steak: 'Beef',
    Hummus: 'Dip, Green',
    Dip: 'Dip, Green',
    Mocktail: 'Mixed Drink',
    Cocktail: 'Mixed Drink',
    Drink: 'Mixed Drink',
    Fries: 'French Fries',
    Burger: 'Hamburger',
  };
  return iconMap[icon] || 'Default';
}

function toProperCase(str: string): string {
  if (!str) return str;
  const lowercaseWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'on', 'or', 'the', 'to', 'with', 'w/', 'w']);
  const cleaned = str.replace(/\*+$/, '').trim();
  const parts = cleaned.split(/([\s\-(),]+)/);
  const actualWords = parts.filter((part) => part && !/[\s\-(),]/.test(part));
  const result: string[] = [];
  let wordIndex = 0;
  let inParens = false;

  for (const part of parts) {
    if (part.includes('(')) inParens = true;
    if (/[\s\-(),]/.test(part)) {
      result.push(part);
      if (part.includes(')')) inParens = false;
      continue;
    }
    if (!part) continue;

    const lower = part.toLowerCase();
    const isFirst = wordIndex === 0;
    const isLast = wordIndex === actualWords.length - 1;
    wordIndex++;
    result.push(!isFirst && !isLast && !inParens && lowercaseWords.has(lower) ? lower : capitalizeWord(part));
    if (part.includes(')')) inParens = false;
  }

  return result.join('');
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function truncateFoodName(name: string, maxLength = 60): string {
  if (!name || name.length <= maxLength) return name;
  return name.substring(0, maxLength).trim();
}

function extractLeadingCount(foodName: string): number | null {
  const match = foodName.trim().match(/^(\d+(?:\.\d+)?)\s+/);
  if (!match) return null;
  const count = Number(match[1]);
  return Number.isFinite(count) ? count : null;
}

function stripLeadingCount(foodName: string): string {
  return foodName.trim().replace(/^(\d+(?:\.\d+)?)\s+/, '').trim();
}

function standardizeFoodName(foodName: string, icon: string): string {
  let name = foodName.trim().replace(/,+$/g, '').trim();
  name = name.replace(/\bwith\s+\d+\s+syrup\s+packets?\b/i, 'with Syrup');
  name = name.replace(/\bneat\b/i, '').replace(/\s+/g, ' ').trim();

  if (/taco/i.test(name) || icon === 'Taco') {
    const lowered = name.toLowerCase();
    if (lowered.includes('chicken') && lowered.includes('cheese')) return 'Chicken and Cheese Tacos';
    if (lowered.includes('chicken')) return 'Chicken Tacos';
    if (lowered.includes('cheese')) return 'Cheese Tacos';
    if (lowered.includes('corn tortilla')) return 'Corn Tortilla Tacos';
    return 'Tacos';
  }

  if (extractLeadingCount(name) !== null) name = stripLeadingCount(name);
  return name;
}

function isLikelyLiquid(foodName: string, icon: string): boolean {
  const liquidIcons = new Set(['Juice', 'Smoothie', 'Coffee', 'Tea', 'Water', 'Milk', 'Soft Drink', 'Iced Coffee', 'Iced Tea', 'Beer', 'Wine, Red', 'Wine, White', 'Mixed Drink', 'Mixed Drink, Martini']);
  if (liquidIcons.has(icon)) return true;
  return /juice|smoothie|coffee|tea|water|milk|beer|wine|martini|toddy|cocktail|mocktail|drink/i.test(foodName);
}

function normalizeServingForLoseIt(item: FoodItem): FoodItem {
  const normalized: FoodItem = { ...item, serving: { ...item.serving } };
  const isLiquid = isLikelyLiquid(normalized.foodName, normalized.icon);
  const countable = /taco|burger|sandwich|piece|pieces|wings?|nuggets?/i.test(normalized.foodName) || normalized.icon === 'Taco';

  if (countable) {
    const countFromName = extractLeadingCount(item.foodName);
    if (countFromName !== null) {
      normalized.serving.amount = countFromName;
      normalized.foodName = stripLeadingCount(normalized.foodName);
    }
    normalized.serving.unit = 'Each';
    return normalized;
  }

  if (isLiquid) {
    const { amount, unit } = normalized.serving;
    if (unit === 'Milliliters') {
      normalized.serving.amount = Math.max(1, Math.round((amount / 29.5735) * 10) / 10);
      normalized.serving.unit = 'Fluid Ounce';
    } else if (unit === 'Liters') {
      normalized.serving.amount = Math.max(1, Math.round((amount * 33.814) * 10) / 10);
      normalized.serving.unit = 'Fluid Ounce';
    } else if (unit !== 'Fluid Ounce') {
      normalized.serving.unit = 'Fluid Ounce';
      if (amount <= 2) normalized.serving.amount = normalized.icon === 'Smoothie' ? 16 : 12;
    }
  } else if (normalized.serving.unit === 'Fluid Ounce') {
    normalized.serving.unit = 'Ounces';
  }

  return normalized;
}

function fillMissingNutrition(item: FoodItem): FoodItem {
  const filled: FoodItem = { ...item };
  const allZero = (filled.calories ?? 0) === 0 && (filled.fatG ?? 0) === 0 && (filled.carbsG ?? 0) === 0 && (filled.proteinG ?? 0) === 0;
  const isLiquid = isLikelyLiquid(filled.foodName, filled.icon);

  if (allZero) {
    if (filled.icon === 'Taco' || /taco/i.test(filled.foodName)) {
      const count = filled.serving.unit === 'Each' ? Math.max(1, Number(filled.serving.amount) || 1) : 1;
      filled.calories = 250 * count;
      filled.fatG = 12 * count;
      filled.satFatG = 4 * count;
      filled.cholesterolMg = 60 * count;
      filled.sodiumMg = 500 * count;
      filled.carbsG = 25 * count;
      filled.fiberG = 2 * count;
      filled.sugarG = 2 * count;
      filled.proteinG = 15 * count;
    } else if (isLiquid) {
      filled.calories = filled.icon === 'Juice' ? 140 : filled.icon.includes('Mixed Drink') ? 250 : 120;
    }
  }

  if (!isLiquid && (filled.sodiumMg ?? 0) === 0 && (filled.calories ?? 0) >= 200) {
    filled.sodiumMg = filled.brand?.toLowerCase() === 'homemade' ? 200 : 700;
  }

  return filled;
}
