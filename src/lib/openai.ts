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

// Simple icon validation - let the AI handle most of it with better prompting
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

// Image compression utility
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

// Comprehensive post-processing to fix malformed serving sizes
function fixServingSizes(text: string): string {
  let fixed = text;
  
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

- Remove all formatting (bold, bullets, numbering, etc) - keep all text plain
- Follow order strictly: Food Name, Date, Meal, Brand, Icon, Serving Size, Calories, Fat (g), Saturated Fat (g), Cholesterol (mg), Sodium (mg), Carbs (g), Fiber (g), Sugar (g), Protein (g)
- Use reliable sources/standardized estimates, look up restaurant nutrition online if needed
- Meal must be: Breakfast, Lunch, Dinner, or Snacks
- Max 60 character food names, shorten where possible (e.g., "w/" for "with"), proper case
- For Icons, select exactly from the ICON_LIST below
- For serving sizes, use standard types from SERVING_TYPES and convert fractions to decimals (1/4 = 0.25)
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
`.trim();
}

export const analyzeFood = async (request: OpenAIAnalysisRequest): Promise<OpenAIResponse> => {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const formattedDate = new Date(request.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
    
    // Build simplified system prompt
    const systemPrompt = buildSystemPrompt();

    // Compress images
    const compressedImages = await Promise.all(
      request.images.map(compressImage)
    );

    // Build input for Responses API with web search
    // const input = [
    //   {
    //     role: 'system',
    //     content: systemPrompt,
    //   },
    //   {
    //     role: 'user',
    //     content: request.images.length > 0 
    //       ? `Analyze the food shown in the images: ${request.prompt}`
    //       : `Analyze this food description: ${request.prompt}`,
    //   },
    // ] as const;

    // Try with web search enabled (primary and fallback)
    // const toolsPrimary = [{ type: "web_search" as const }];
    // const toolsFallback = [{ type: "web_search_preview" as const }];

    // Build the API request
    const apiRequest = {
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Date: ${formattedDate}
Meal: ${request.meal}
Brand/Restaurant: ${request.brand}

${request.images.length > 0 
  ? `Analyze the food shown in the ${request.images.length} image(s). Look at portion sizes, plate/glass sizes, garnishes, rims, sides. Account for ice in drinks. Description: ${request.prompt}`
  : `Analyze this food description: ${request.prompt}`}`,
            },
            ...compressedImages.map(imageData => ({
              type: 'image_url',
              image_url: {
                url: imageData,
              },
            })),
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.2,
    };

    // Try with web search first
    let resp;
    try {
      resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...apiRequest,
          tools: [{ type: "web_search" }],
        }),
      });

      // If web search fails, fall back to standard completion
      if (!resp.ok && resp.status === 400) {
        console.warn('Web search failed, falling back to standard completion');
        resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiRequest),
        });
      }
    } catch (e: any) {
      // If any error occurs, try standard completion
      console.warn('API error, falling back to standard completion:', e);
      resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequest),
      });
    }

    if (!resp.ok) {
      throw new Error(`OpenAI API error: ${resp.status}`);
    }

    const data = await resp.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // ALWAYS apply serving size fixes first, before any parsing
    const fixedResponse = fixServingSizes(aiResponse);

    // Parse the fixed response directly - skip validation for now
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
    
    // If parsing failed and we got 0 values, use fallback
    if (items.length > 0 && items.every(item => item.calories === 0)) {
      const fallbackItems = createFallbackItems(aiResponse, request);
      return {
        items: fallbackItems,
        plainText: aiResponse, // Keep original for fallback
        needsMoreInfo: false,
      };
    }
    
    return {
      items,
      plainText: aiResponse, // This should be the fixed response
      needsMoreInfo: false,
    };
  } catch (error) {
    console.error('Parsing error, using fallback:', error);
    // If parsing fails, use fallback items
    const fallbackItems = createFallbackItems(aiResponse, request);
    return {
      items: fallbackItems,
      plainText: aiResponse, // Keep original for fallback
      needsMoreInfo: false,
    };
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
    itemSections = cleanedResponse.split(/(?=Food Name:)/gi).filter(s => s.trim());
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
  
  // If still no items, create fallback items based on description
  if (items.length === 0) {
    const fallbackItems = createFallbackItems(response, request);
    items.push(...fallbackItems);
  }
  
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
    
    const foodName = extractValue([/Food Name:\s*(.+)/i, /Item.*:\s*(.+)/i, /^(.+?):/i], 'Unknown Food');
    if (foodName === 'Unknown Food' || foodName === '') return null;
    
    // Extract date and meal from the AI response
    const date = extractValue([/Date:\s*(.+)/i], request.date);
    const extractedMeal = extractValue([/Meal:\s*(.+)/i], request.meal);
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
      brand: request.brand,
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

const createFallbackItem = (_response: string, request: OpenAIAnalysisRequest): FoodItem | null => {
  // Create a basic item from whatever information we can extract
  return {
    foodName: request.prompt.substring(0, 60) || 'Unknown Food',
    date: request.date,
    meal: request.meal,
    brand: request.brand,
    icon: 'Default',
    serving: {
      amount: 1,
      unit: 'portion',
      descriptor: '',
    },
    calories: 0,
    fatG: 0,
    satFatG: 0,
    cholesterolMg: 0,
    sodiumMg: 0,
    carbsG: 0,
    fiberG: 0,
    sugarG: 0,
    proteinG: 0,
    hydration: {
      isLiquid: false,
      fluidOz: 0,
    },
  };
};

const createFallbackItems = (_response: string, request: OpenAIAnalysisRequest): FoodItem[] => {
  // Extract food items from the user's description as fallback
  const items: FoodItem[] = [];
  const prompt = request.prompt.toLowerCase();
  
  // Common food patterns to extract multiple items
  const foodIndicators = [
    'hummus', 'bread', 'mocktail', 'steak', 'fries', 'salad', 'chicken', 'pizza',
    'burger', 'sandwich', 'soup', 'pasta', 'rice', 'fish', 'beef', 'pork',
    'dessert', 'cake', 'ice cream', 'cocktail', 'drink', 'wine', 'beer'
  ];
  
  for (const food of foodIndicators) {
    if (prompt.includes(food)) {
      items.push({
        foodName: food.charAt(0).toUpperCase() + food.slice(1),
        date: request.date,
        meal: request.meal,
        brand: request.brand,
        icon: 'Default',
        serving: { amount: 1, unit: 'portion', descriptor: '' },
        calories: 200, // Reasonable default
        fatG: 8, satFatG: 2, cholesterolMg: 10, sodiumMg: 300,
        carbsG: 20, fiberG: 2, sugarG: 3, proteinG: 12,
        hydration: { 
          isLiquid: ['mocktail', 'cocktail', 'drink', 'wine', 'beer'].includes(food), 
          fluidOz: ['mocktail', 'cocktail', 'drink'].includes(food) ? 8 : 0 
        },
      });
    }
  }
  
  return items.length > 0 ? items : [createFallbackItem(_response, request)!];
};

// Estimate cost for the request
export const estimateCost = (prompt: string, imageCount: number): number => {
  const textTokens = Math.ceil(prompt.length / 4); // Rough token estimate
  const textCost = (textTokens / 1000) * 0.00015; // gpt-4o-mini pricing
  const imageCost = imageCount * 0.00085; // Compressed image cost
  return textCost + imageCost;
};
