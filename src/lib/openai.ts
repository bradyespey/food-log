// OpenAI API client for food analysis with system/user message separation
import type { FoodItem } from '../types';
// import { validateAndNormalizeResponse } from './foodValidator';

interface OpenAIAnalysisRequest {
  prompt: string;
  images: File[];
  date: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  brand: string;
}

interface OpenAIResponse {
  success: boolean;
  data?: {
    items: FoodItem[];
    plainText: string;
    needsMoreInfo?: boolean;
    questions?: string[];
  };
  error?: string;
}

// Keep these centralized so you can edit without touching the prompt text
const SERVING_TYPES = "Serving Weight: Grams, Kilograms, Micrograms, Milligrams, Ounces, Pounds; Serving Volume: Cups, Dessertspoons, Fluid Ounce, Gallons, Imperial Fluid Ounces, Imperial Pints, Imperial Quarts, Liters, Metric Cups, Milliliters, Pints, Quarts, Tablespoons, Teaspoons; Serving Amount: Bottle, Box, Can, Container, Cube, Dry Cup, Each, Jar, Package, Piece, Pot, Pouch, Punnet, Scoop, Serving, Slice, Stick, Tablet";

const ICON_LIST = "Alcohol; Alcohol, White; Almond; Almond Butter; Apple; Apple Sauce; Apple, Gala; Apple, Granny Smith; Apple, Honey Crisp; Apple, Macintosh; Artichoke; Asparagus; Avocado; Bacon; Bagel; Bagel, Blueberry; Bagel, Chocolate Chip; Bagel, Sesame; Baguette; Baked Beans; Balsamic Vinaigrette; Bamboo; Banana; Banana Pepper; Bar; Bean, Black; Bean, Green; Bean, Red; Bean, White; Beef; Beer; BeerDark; Beet; Bell Pepper, Green; Bell Pepper, Red; Bell Pepper, Yellow; Biscuit; Biscuit Cracker; Blackberry; Blueberry; Breadsticks; Breakfast; Breakfast Sandwich; Broccoli; Brownie; Brussels Sprout; Burrito; Butter; Cabbage; Cake; CakeDark; CakeWhite; CakeWhiteDark; Calamari; Calories; Can; Candy; Candy Bar; Carrot; Carrots; Cashew; Casserole; Cauliflower; Celery; Cereal; Cereal Bar; CerealCheerios; CerealCornFlakes; CerealFruitLoops; Cheese; CheeseAmerican; CheeseBlue; CheeseBrie; Cheeseburger; Cheesecake; CheeseCheddar; CheeseGouda; CheesePepperjack; Cherry; CherryMaraschino; Chestnut; Chicken; Chicken Tenders; ChickenGrilled; ChickenWing; Chickpea; Chocolate; Chocolate Chip; Chocolate Chips; ChocolateDark; Churro; Cider; Cinnamon Roll; Clam; Coconut; Coffee; Coleslaw; Com; Combread; Cookie; Cookie, Christmas; Cookie, Molasses; Cookie, Red Velvet; Cookie, Sugar; Cottage Cheese; Crab; Cracker; Cranberry; Cream; Croissant; Crouton; Crumpet; Cucumber; Cupcake; Cupcake, Carrot; Cupcake, Vanilla; Curry; Date; Default; Deli Meat; Dinner Roll; Dip, Green; Dip, Red; Dish; Donut; Donut, Chocolate Iced; Donut, Strawberry Iced; DoubleCheeseburger; Dressing, Ranch; Dumpling; Eclair; Egg; Egg McMuffin; Egg Roll; Eggplant; Enchilada; Falafel; Fern; Fig; Filbert; Fish; Food, Can; Fowl; French Fries; French Toast; Fritter; Frosting, Chocolate; Frosting, Yellow; Fruit Cocktail; Fruit Leather; FruitCake; Game; Garlic; Gobo Root; Gourd; Graham Cracker; Grain; Grapefruit; Grapes; Grilled Cheese; Guava; Gummy Bear; Hamburger; Hamburger Bun; Hamburger Patty; Hamburger, Double; Hash; Hazelnut; Honey; Horseradish; Hot Dog; Hot Dog Bun; Hot Pot; Ice Cream; Ice Cream Bar; Ice Cream Sandwich; Ice Cream, Chocolate; Ice Cream, Strawberry; Iced Coffee; Iced Tea; Jam; Jicama; Juice; Kale; Kebab; Ketchup; Kiwi; Lamb; Lasagna; Latte; Leeks; Lemon; Lemonade; Lime; Liquid; Lobster; Mac And Cheese; Macadamia; Mango; Marshmallow; Mayonnaise; Meatballs; Melon; Milk; Milk Shake; Milk Shake, Chocolate; Milk Shake, Strawberry; Mixed Drink; Mixed Drink, Martini; Mixed Nuts; Muffin; Mushroom; Mustard; Nigiri Sushi; Oatmeal; Octopus; Oil; Okra; Olive, Black; Olive, Green; Omelette; Onion; Orange; Orange Chicken; Orange Juice; Pancakes; Papaya; Parfait; Parsley; Parsnip; Pasta; Pastry; Patty Sandwich; Pavlova; Peach; Peanut; Peanut Butter; Pear; Peas; Pecan; Peppers; Persimmon; Pickle; Pie; Pie, Apple; Pill; Pine Nut; Pineapple; Pistachio; Pita Sandwich; Pizza; Plum; Pocky; Pomegranate; Popcom; Popsicle; Pork; Pork Chop; Pot Pie; Potato; Potato Chip; Potato Salad; Powdered Drink; Prawn; Pretzel; Prune; Pudding; Pumpkin; Quesadilla; Quiche; Radish; Raisin; Raspberry; Ravioli; Recipe; Relish; Rhubarb; Ribs; Rice; Rice Cake; Roll; Romaine Lettuce; Salad; Salad Dressing, Balsamic; Salt; Sandwich; Sauce; Sausage; Seaweed; Seed; Shallot; Shrimp; Smoothie; Snack; Snap Bean; Soft Drink; SoftServeChocolate; SoftServeSwirl; SoftServeVanilla; Souffle; Soup; Sour Cream; Soy Nut; Soy Sauce; Spice, Brown; Spice, Green; Spice, Red; Spice, Yellow; Spinach; Spring Roll; Sprouts; Squash; Squash, Spaghetti; Starfruit; Stew, Brown; Stew, Yellow; Stir Fry; Stir Fry Noodles; Strawberry; Stuffing; Sub Sandwich; Sugar Cookie; Sugar, Brown; Sugar, White; Sushi; Syrup; Taco; Taro; Tater Tots; Tea; Tempura; Toast; Toaster Pastry; Tofu; Tomato; Tomato Soup; Tortilla; Tortilla Chip; Tostada; Turkey; Turnip; Turnover; Vegetable; Waffles; Walnut; Water; Water Chestnut; Watermelon; White Bread; Wine, Red; Wine, White; Wrap; Yam; Yogurt; Zucchini";

/**
 * Validates and normalizes icon names against the allowed icon list.
 * Returns the icon if valid, or a mapped fallback, or 'Default'.
 */
function validateIcon(icon: string): string {
  const iconList = ICON_LIST.split('; ').map(i => i.trim());
  
  // If exact match, return it
  if (iconList.includes(icon)) {
    return icon;
  }
  
  // Simple fallbacks for common mismatches
  const iconMap: Record<string, string> = {
    'Bread': 'Breadsticks',
    'Steak': 'Beef',
    'Hummus': 'Dip, Green',
    'Mocktail': 'Mixed Drink',
  };
  
  return iconMap[icon] || 'Default';
}

/**
 * Compresses an image file to WebP format with max 1280px dimension.
 * Returns base64 data URL.
 */
const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Limit to 1280px max width/height
      const maxSize = 1280;
      let { width, height } = img;
      
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', 0.8));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Fixes malformed serving sizes in AI responses.
 * Removes markdown formatting, fixes duplicate numbers, and normalizes patterns.
 */
function fixServingSizes(text: string): string {
  let fixed = text;
  
  // Remove markdown formatting (bolding)
  fixed = fixed.replace(/\*\*/g, '');
  
  // Fix "0.5 5 serving" → "0.5 serving" (decimal + space + number + serving)
  fixed = fixed.replace(/Serving Size:\s*(\d+\.\d+)\s+\d+\s+serving/gi, 'Serving Size: $1 serving');
  
  // Fix "1 1 serving" → "1 serving" (same number repeated)
  fixed = fixed.replace(/Serving Size:\s*(\d+)\s+\1\s+serving/gi, 'Serving Size: $1 serving');
  
  // Fix "2 2 each" → "2 each" (same number repeated with each)
  fixed = fixed.replace(/Serving Size:\s*(\d+)\s+\1\s+each/gi, 'Serving Size: $1 each');
  
  // Fix "1 2 serving" → "0.5 serving" (fraction pattern)
  fixed = fixed.replace(/Serving Size:\s*1\s+2\s+serving/gi, 'Serving Size: 0.5 serving');
  
  // Fix "0.5 5 each" → "0.5 each" (decimal + space + number + each)
  fixed = fixed.replace(/Serving Size:\s*(\d+\.\d+)\s+\d+\s+each/gi, 'Serving Size: $1 each');
  
  // Fix "1 1 each" → "1 each" (same number repeated with each)
  fixed = fixed.replace(/Serving Size:\s*(\d+)\s+\1\s+each/gi, 'Serving Size: $1 each');
  
  // Fix any other double number patterns with common units
  fixed = fixed.replace(/Serving Size:\s*(\d+\.?\d*)\s+\d+\.?\d*\s+(serving|each|ounces?|grams?|cups?|tablespoons?|teaspoons?)/gi, 'Serving Size: $1 $2');
  
  // Fix patterns like "0.5 5 fluid ounces" → "0.5 fluid ounces"
  fixed = fixed.replace(/Serving Size:\s*(\d+\.\d+)\s+\d+\s+(fluid ounces?)/gi, 'Serving Size: $1 $2');
  
  // Fix patterns like "1 1 fluid ounces" → "1 fluid ounce"
  fixed = fixed.replace(/Serving Size:\s*(\d+)\s+\1\s+(fluid ounces?)/gi, 'Serving Size: $1 $2');
  
  // Fix any remaining double number patterns (catch-all)
  fixed = fixed.replace(/Serving Size:\s*(\d+\.?\d*)\s+\d+\.?\d*\s+(\w+)/gi, 'Serving Size: $1 $2');
  
  // Additional catch-all for any remaining malformed patterns
  if (fixed.includes('Serving Size:') && /\d+\s+\d+\s+\w+/.test(fixed)) {
    fixed = fixed.replace(/Serving Size:\s*(\d+\.?\d*)\s+\d+\.?\d*\s+(\w+)/gi, 'Serving Size: $1 $2');
  }
  
  // Force fix the specific patterns you're seeing
  fixed = fixed.replace(/Serving Size: 0\.5 5 serving/g, 'Serving Size: 0.5 serving');
  fixed = fixed.replace(/Serving Size: 1 1 serving/g, 'Serving Size: 1 serving');
  fixed = fixed.replace(/Serving Size: 1 2 serving/g, 'Serving Size: 0.5 serving');
  
  // Final safety check - if any serving size still has multiple numbers, take the first one
  fixed = fixed.replace(/Serving Size: (\d+\.?\d*)\s+\d+\.?\d*\s+(\w+)/g, 'Serving Size: $1 $2');
  
  return fixed;
}

// Build system prompt based on successful Custom GPT approach
function buildSystemPrompt(): string {
  return `
You provide detailed nutritional information for food and drink items for logging in food apps. Follow these guidelines exactly:

CRITICAL ANALYSIS REQUIREMENTS:
- When analyzing multiple entries, each food item must use the Date, Meal, and Brand from its specific entry
- For "Entry 1 (09/01, Lunch, McDonald's)", all food items from that entry use: Date: 09/01, Meal: Lunch, Brand: McDonald's
- For "Entry 2 (08/31, Breakfast, Taco Bell)", all food items from that entry use: Date: 08/31, Meal: Breakfast, Brand: Taco Bell
- Never use generic brand names - always use the specific brand listed in parentheses for each entry
- When user provides partial nutrition data (e.g., "Calories: 690, Fat: 43g, Carbs: 43g, Protein: 40g"), estimate the missing values (like sodium, cholesterol, fiber, sugar) based on the food type - do NOT set them to 0
- Use valid serving sizes from SERVING_TYPES only - NEVER use "bowl", "plate", "platter", "dish", "portion", or similar invalid units
- CRITICAL: "portion" is NOT a valid serving type - use "Serving" from Serving Amount category instead
- If you're unsure about serving size, default to "1 Serving" (capital S, from Serving Amount category) instead of using invalid units
- Estimate based on photo context: small plate = 1 Serving, large plate = 2-3 Serving, etc.
- List each distinct food item separately - do not combine similar items
- ONLY list food items that are explicitly mentioned or clearly implied in the description
- Do NOT create multiple versions of similar items (e.g., don't create both "bread" and "additional bread")
- Do NOT infer extra items that aren't clearly specified (e.g., if user says "smoothie", don't also add "milkshake")
- Be conservative - stick to what's actually described rather than expanding the list
- For accompaniments like "served with bread", include the bread as ONE item, not multiple
- If description mentions "burger and fries", create exactly 2 items: burger + fries
- If description mentions "smoothie", create exactly 1 smoothie item (not smoothie + milkshake)
- Do NOT create multiple versions of similar items (e.g., don't create both "bread" and "additional bread")

- CRITICAL: PRESERVE FULL FOOD NAMES - Do NOT strip or shorten food names unless they exceed 60 characters
- If user says "Big League (mocktail)", use "Big League" as the Food Name, NOT just "Mocktail"
- If user says "SHAWARMA-SPICED PRIME SKIRT STEAK FRITES", preserve the full name or split into "Shawarma-Spiced Prime Skirt Steak" and "Frites" as separate items
- Do NOT strip descriptive words like "Shawarma-Spiced", "Prime", "Skirt" from food names
- Only shorten if the name exceeds 60 characters, and then use abbreviations like "w/" for "with"
- Remove all formatting (bold, bullets, numbering, etc) - keep all text plain
- Follow order strictly: Food Name, Date, Meal, Brand, Icon, Serving Size, Calories, Fat (g), Saturated Fat (g), Cholesterol (mg), Sodium (mg), Carbs (g), Fiber (g), Sugar (g), Protein (g)
- CRITICAL: Each food item MUST include the exact Date, Meal, and Brand from its corresponding entry in the format:
  Date: MM/DD
  Meal: Breakfast/Lunch/Dinner/Snacks  
  Brand: [exact brand name from entry]
- Use reliable sources/standardized estimates, look up restaurant nutrition online if needed
- Meal must be: Breakfast, Lunch, Dinner, or Snacks
- Max 60 character food names, but preserve full names when possible - only shorten if necessary
- For Icons, select exactly from the ICON_LIST below - Icon must ALWAYS be one of the listed types
- For serving sizes, use standard types from SERVING_TYPES and convert fractions to decimals (1/4 = 0.25)
- CRITICAL: Serving Size unit MUST be one of: Grams, Kilograms, Micrograms, Milligrams, Ounces, Pounds, Cups, Dessertspoons, Fluid Ounce, Gallons, Imperial Fluid Ounces, Imperial Pints, Imperial Quarts, Liters, Metric Cups, Milliliters, Pints, Quarts, Tablespoons, Teaspoons, Bottle, Box, Can, Container, Cube, Dry Cup, Each, Jar, Package, Piece, Pot, Pouch, Punnet, Scoop, Serving, Slice, Stick, Tablet
- NEVER use "portion" - use "Serving" from the Serving Amount category instead
- List drinks/smoothies/soups in fluid ounces first for water intake tracking
- Base estimates on photos when provided - account for ice in drinks
- If photos include nutritional labels, use those exact values combined with visual portion context
- For example: if you see a plate of spaghetti with nutrition labels from the box/sauce/meat, calculate based on the actual portion shown on the plate using the label data
- List each food item separately with blank line between items
- Use today's date unless specified
- Values must be clean numbers without extra text
- Include sodium from salt/tajin on rims when applicable
- User context: 6'1" 200lb male for portion estimation

SERVING_TYPES (use exactly one):
${SERVING_TYPES}

ICON_LIST (use exactly one):
${ICON_LIST}

Example format:
Food Name: Brisket Tacos
Date: 6/30
Meal: Lunch
Brand: Torchy's Tacos
Icon: Taco
Serving Size: 3.5 each
Calories: 1100
Fat (g): 67
Saturated Fat (g): 27
Cholesterol (mg): 210
Sodium (mg): 3000
Carbs (g): 80
Fiber (g): 10
Sugar (g): 5
Protein (g): 50

CRITICAL EXAMPLES - Preserve Full Names:
- If user says "Big League (mocktail)", Food Name should be "Big League" (NOT "Mocktail")
- If user says "SHAWARMA-SPICED PRIME SKIRT STEAK FRITES", create:
  Food Name: Shawarma-Spiced Prime Skirt Steak
  Food Name: Frites
  (NOT "Steak" and "Wine")
- Always preserve the full descriptive name from the user's input
- If a dish has multiple components, list them separately but keep their full names
`.trim();
}

/**
 * Converts a string to proper title case, handling common words, parentheses, and special characters.
 * - Capitalizes first and last words
 * - Lowercases common words (a, an, and, as, at, but, by, for, from, in, into, nor, of, on, or, the, to, with)
 * - Capitalizes words inside parentheses (e.g., "Mocktail" in "Big League (Mocktail)")
 * - Removes trailing asterisks
 */
function toProperCase(str: string): string {
  if (!str) return str;
  
  // Words to keep lowercase (unless first/last word)
  const lowercaseWords = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into',
    'nor', 'of', 'on', 'or', 'the', 'to', 'with', 'w/', 'w'
  ]);
  
  // Remove trailing asterisks and clean up
  let cleaned = str.replace(/\*+$/, '').trim();
  
  // Track if we're inside parentheses
  let inParens = false;
  const allParts = cleaned.split(/([\s\-(),]+)/);
  const result: string[] = [];
  let wordIndex = 0;
  const actualWords: string[] = [];
  
  // First pass: collect actual words
  for (const part of allParts) {
    if (part && !/[\s\-(),]/.test(part)) {
      actualWords.push(part);
    }
  }
  
  // Second pass: process with context
  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    
    // Track parentheses state
    if (part.includes('(')) inParens = true;
    if (part.includes(')')) inParens = false;
    
    // Preserve separators
    if (/[\s\-(),]/.test(part)) {
      result.push(part);
      continue;
    }
    
    if (!part) continue;
    
    const lowerPart = part.toLowerCase();
    const isFirstWord = wordIndex === 0;
    const isLastWord = wordIndex === actualWords.length - 1;
    wordIndex++;
    
    // Always capitalize first and last word
    if (isFirstWord || isLastWord) {
      result.push(capitalizeWord(part));
      continue;
    }
    
    // Words in parentheses should be capitalized (e.g., "Mocktail")
    if (inParens) {
      result.push(capitalizeWord(part));
      continue;
    }
    
    // Lowercase common words, capitalize others
    if (lowercaseWords.has(lowerPart)) {
      result.push(lowerPart);
    } else {
      result.push(capitalizeWord(part));
    }
  }
  
  return result.join('');
}

/**
 * Capitalizes a single word, handling all-caps, mixed case, and normal words.
 */
function capitalizeWord(word: string): string {
  if (!word) return word;
  // Handle all caps (SHAWARMA -> Shawarma)
  if (word === word.toUpperCase() && word.length > 1) {
    return word.charAt(0) + word.slice(1).toLowerCase();
  }
  // Handle mixed case (preserve existing like "McDonald's")
  if (word.charAt(0) === word.charAt(0).toUpperCase()) {
    return word.charAt(0) + word.slice(1).toLowerCase();
  }
  // Default: capitalize first letter
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Truncates food name to specified max length (default 60 characters).
 */
function truncateFoodName(name: string, maxLength: number = 60): string {
  if (!name || name.length <= maxLength) return name;
  return name.substring(0, maxLength).trim();
}

/**
 * Main function to analyze food from images and text using OpenAI via Flask backend.
 * Returns structured food items with nutritional data, proper casing, and 60-char name limits.
 */
export const analyzeFood = async (request: OpenAIAnalysisRequest): Promise<OpenAIResponse> => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiUsername = import.meta.env.VITE_API_USERNAME;
    const apiPassword = import.meta.env.VITE_API_PASSWORD;

    if (!apiBaseUrl) {
      throw new Error('API base URL not configured');
    }

    // Build system prompt to send to backend
    const systemPrompt = buildSystemPrompt();

    // Compress images to base64
    const compressedImages = await Promise.all(
      request.images.map(compressImage)
    );

    // Extract base64 data from data URLs
    const base64Images = compressedImages.map(imgData => {
      if (imgData.startsWith('data:image')) {
        return imgData.split(',')[1];
      }
      return imgData;
    });

    // Build request payload
    const payload = {
      systemPrompt: systemPrompt,
      prompt: request.images.length > 0 
        ? `Analyze the food shown in the ${request.images.length} image(s). Look carefully at portion sizes, plate/glass sizes, visible garnishes, rims, sides, and all details. Account for ice in drinks. For each entry, use the exact Date, Meal, and Brand specified in parentheses.\n\nFood Entries:\n${request.prompt}`
        : `Analyze these food entries. For each entry, use the exact Date, Meal, and Brand specified in parentheses.\n\nFood Entries:\n${request.prompt}`,
      images: base64Images,
      date: request.date,
      meal: request.meal,
      brand: request.brand,
    };

    // Make API call with basic authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiUsername && apiPassword) {
      headers['Authorization'] = `Basic ${btoa(`${apiUsername}:${apiPassword}`)}`;
    }

    const response = await fetch(`${apiBaseUrl}/food_log/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }

    // Handle Structured Outputs (JSON response)
    if (result.data?.items && Array.isArray(result.data.items) && result.data.items.length > 0) {
      const structuredItems = result.data.items.map((item: any) => ({
        foodName: truncateFoodName(toProperCase(item.food_name)),
        date: item.date,
        meal: item.meal,
        brand: item.brand || '',
        icon: validateIcon(item.icon),
        serving: {
          amount: item.serving_amount,
          unit: item.serving_unit,
          descriptor: ''
        },
        calories: item.calories,
        fatG: item.fat_g,
        satFatG: item.saturated_fat_g,
        cholesterolMg: item.cholesterol_mg,
        sodiumMg: item.sodium_mg,
        carbsG: item.carbs_g,
        fiberG: item.fiber_g,
        sugarG: item.sugar_g,
        proteinG: item.protein_g,
        hydration: {
          isLiquid: false, // Default, can be inferred if needed
          fluidOz: 0
        }
      }));

      return {
        success: true,
        data: {
          items: structuredItems,
          plainText: JSON.stringify(result.data.items, null, 2),
          needsMoreInfo: false
        }
      };
    }

    // Fallback for text response (if structured output wasn't used or failed)
    const aiResponse = result.data?.plainText;

    if (!aiResponse) {
      throw new Error('No response from API');
    }

    // ALWAYS apply serving size fixes first, before any parsing
    const fixedResponse = fixServingSizes(aiResponse);

    // Parse the fixed response directly
    const parsedResult = parseOpenAIResponse(fixedResponse, request);
    
    // Always use the fixed response for plainText
    parsedResult.plainText = fixedResponse;
    
    return {
      success: true,
      data: parsedResult,
    };

  } catch (error) {
    console.error('OpenAI Analysis Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
    };
  }
};

// Parse OpenAI response into structured format
const parseOpenAIResponse = (aiResponse: string, request: OpenAIAnalysisRequest) => {
  // Check if the response contains questions
  const questionPatterns = [
    /what size|how much|how many|could you specify|need more information|clarification/i,
    /\?/g, // Contains question marks
  ];
  
  const hasQuestions = questionPatterns.some(pattern => pattern.test(aiResponse));
  
  if (hasQuestions) {
    // Extract questions
    const questions = aiResponse
      .split('\n')
      .filter(line => line.trim().includes('?') || line.trim().toLowerCase().includes('question'))
      .map(q => q.trim())
      .filter(q => q.length > 0);
    
    return {
      items: [],
      plainText: aiResponse,
      needsMoreInfo: true,
      questions: questions.length > 0 ? questions : [aiResponse],
    };
  }

  // Try to parse structured food data
  try {
    const items = parseNutritionalData(aiResponse, request);
    
    if (items.length === 0) {
       throw new Error("No food items found in AI response");
    }
    
    return {
      items,
      plainText: aiResponse,
      needsMoreInfo: false,
    };
  } catch (error) {
    console.error('Parsing error:', error);
    throw error; // Re-throw to show error instead of fallback
  }
};

// Parse the nutritional data format from ChatGPT Custom GPT
const parseNutritionalData = (response: string, request: OpenAIAnalysisRequest): FoodItem[] => {
  // Apply serving size fixes again at parsing level
  const cleanedResponse = fixServingSizes(response);
  
  const items: FoodItem[] = [];
  
  // Try multiple splitting strategies for different response formats
  let itemSections: string[] = [];
  
  // Strategy 1: Look for "Food Name:" patterns
  if (cleanedResponse.includes('Food Name:')) {
    const introPatterns = [
      /^here'?s?\s+(the|a|an)/i,
      /^this\s+is/i,
      /^based\s+on/i,
      /^nutritional\s+analysis/i,
      /^analysis\s+for/i,
      /^food\s+items?\s+based/i,
    ];
    
    itemSections = cleanedResponse.split(/(?=Food Name:)/gi)
      .filter(s => {
        const trimmed = s.trim();
        // Skip sections that are just introductory text
        if (!trimmed || trimmed.length < 10) return false;
        // Skip if it matches intro patterns
        if (introPatterns.some(pattern => pattern.test(trimmed))) return false;
        // Only include sections that start with "Food Name:" or have nutritional data
        return trimmed.startsWith('Food Name:') || /(Food Name|Calories|Fat|Carbs|Protein|Serving Size):/i.test(trimmed);
      });
  }
  
  // Strategy 2: Look for numbered items (1., 2., etc.)
  if (itemSections.length === 0 && /^\d+\./m.test(cleanedResponse)) {
    itemSections = cleanedResponse.split(/(?=^\d+\.)/m).filter(s => s.trim());
  }
  
  // Strategy 3: Split by double newlines if multiple clear sections
  if (itemSections.length === 0 && cleanedResponse.split('\n\n').length > 2) {
    itemSections = cleanedResponse.split('\n\n').filter(s => s.trim());
  }
  
  // Strategy 4: Single item response
  if (itemSections.length === 0) {
    itemSections = [cleanedResponse];
  }
  
  for (const section of itemSections) {
    const item = parseIndividualFoodItem(section, request);
    if (item) {
      items.push(item);
    }
  }
  
  // If still no items, do NOT create fallback
  // if (items.length === 0) {
  //   const fallbackItems = createFallbackItems(response, request);
  //   items.push(...fallbackItems);
  // }
  
  return items;
};

const parseIndividualFoodItem = (section: string, request: OpenAIAnalysisRequest): FoodItem | null => {
  try {
    // First, apply serving size fixes to this section
    const cleanedSection = fixServingSizes(section);
    const lines = cleanedSection.split('\n').map(l => l.trim());
    
    // Extract values using multiple regex patterns (more flexible)
    const extractValue = (patterns: RegExp[], defaultValue: any = '') => {
      for (const pattern of patterns) {
        for (const line of lines) {
          const match = line.match(pattern);
          if (match) return match[1]?.trim() || defaultValue;
        }
      }
      return defaultValue;
    };
    
    const extractNumber = (patterns: RegExp[], defaultValue: number = 0) => {
      const value = extractValue(patterns, '0');
      const num = parseFloat(value.replace(/[^\d.]/g, ''));
      return isNaN(num) ? defaultValue : num;
    };
    
    const foodName = extractValue([/Food Name:\s*(.+)/i, /Item.*:\s*(.+)/i], 'Unknown Food');
    
    // Skip sections that are just introductory text or don't have actual food data
    if (foodName === 'Unknown Food' || foodName === '') return null;
    
    // Filter out common introductory phrases that might be parsed as food names
    const introPhrases = [
      /^here'?s?\s+(the|a|an)/i,
      /^this\s+is/i,
      /^based\s+on/i,
      /^nutritional\s+analysis/i,
      /^analysis\s+for/i,
      /^food\s+items?\s+based/i,
    ];
    
    if (introPhrases.some(pattern => pattern.test(foodName))) {
      return null;
    }
    
    // Also skip if this section doesn't have any nutritional data
    const hasNutritionData = lines.some(line => 
      /(Calories|Fat|Carbs|Protein|Serving Size):/i.test(line)
    );
    
    if (!hasNutritionData) {
      return null;
    }
    
    // Extract date and meal from the AI response with improved patterns
    const date = extractValue([
      /Date:\s*(.+)/i, 
      /^Date:\s*(.+)/i,
      /Date\s*:\s*(.+)/i
    ], request.date);
    
    const extractedMeal = extractValue([
      /Meal:\s*(.+)/i, 
      /^Meal:\s*(.+)/i,
      /Meal\s*:\s*(.+)/i
    ], request.meal);
    
    const meal = (extractedMeal === 'Breakfast' || extractedMeal === 'Lunch' || extractedMeal === 'Dinner' || extractedMeal === 'Snacks') 
      ? extractedMeal 
      : request.meal as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
    
    // Extract serving size with better pattern matching
    const servingSizeLine = lines.find(line => line.startsWith('Serving Size:'));
    let servingAmount = 1;
    let servingUnit = 'each';
    
    if (servingSizeLine) {
      // Use the cleaned serving size line
      const servingMatch = servingSizeLine.match(/Serving Size:\s*(\d+\.?\d*)\s+(\w+(?:\s+\w+)?)/i);
      if (servingMatch) {
        servingAmount = parseFloat(servingMatch[1]) || 1;
        servingUnit = servingMatch[2].toLowerCase();
      }
    }
    
    return {
      foodName: foodName.substring(0, 60), // Limit to 60 chars as per spec
      date: date,
      meal: meal,
      brand: extractValue([
        /Brand:\s*(.+)/i, 
        /^Brand:\s*(.+)/i,
        /Brand\s*:\s*(.+)/i,
        /Restaurant:\s*(.+)/i,
        /^Restaurant:\s*(.+)/i
      ], request.brand), // Extract brand from AI response with improved patterns
              icon: validateIcon(extractValue([/Icon:\s*(.+)/i], 'Default')),
        serving: {
          amount: servingAmount,
          unit: servingUnit,
          descriptor: extractValue([/Serving Size:.*?\((.+?)\)/i], ''),
        },
      calories: extractNumber([/Calories:\s*(\d+)/i, /Cal:\s*(\d+)/i, /Energy:\s*(\d+)/i], 0),
      fatG: extractNumber([/Fat.*:\s*(\d+\.?\d*)/i, /Total Fat.*:\s*(\d+\.?\d*)/i], 0),
      satFatG: extractNumber([/Saturated Fat.*:\s*(\d+\.?\d*)/i, /Sat Fat.*:\s*(\d+\.?\d*)/i], 0),
      cholesterolMg: extractNumber([/Cholesterol.*:\s*(\d+\.?\d*)/i, /Chol.*:\s*(\d+\.?\d*)/i], 0),
      sodiumMg: extractNumber([/Sodium.*:\s*(\d+\.?\d*)/i, /Salt.*:\s*(\d+\.?\d*)/i], 0),
      carbsG: extractNumber([/Carbs.*:\s*(\d+\.?\d*)/i, /Carbohydrates.*:\s*(\d+\.?\d*)/i], 0),
      fiberG: extractNumber([/Fiber.*:\s*(\d+\.?\d*)/i, /Dietary Fiber.*:\s*(\d+\.?\d*)/i], 0),
      sugarG: extractNumber([/Sugar.*:\s*(\d+\.?\d*)/i, /Total Sugar.*:\s*(\d+\.?\d*)/i], 0),
      proteinG: extractNumber([/Protein.*:\s*(\d+\.?\d*)/i], 0),
      hydration: {
        isLiquid: /liquid|drink|beverage|juice|smoothie|cocktail|mocktail|water/i.test(foodName),
        fluidOz: /liquid|drink|beverage|juice|smoothie|cocktail|mocktail|water/i.test(foodName) 
          ? extractNumber([/Hydration:\s*(\d+\.?\d*)/i, /Fluid.*:\s*(\d+\.?\d*)/i]) 
          : 0,
      },
    };
    
  } catch (error) {
    console.error('Error parsing individual food item:', error);
    return null;
  }
};



/**
 * Estimates the cost of an OpenAI API request based on prompt length and image count.
 * Uses gpt-4o-mini pricing.
 */
export const estimateCost = (prompt: string, imageCount: number): number => {
  const textTokens = Math.ceil(prompt.length / 4); // Rough token estimate
  const textCost = (textTokens / 1000) * 0.00015; // gpt-4o-mini pricing
  const imageCost = imageCount * 0.00085; // Compressed image cost
  return textCost + imageCost;
};
