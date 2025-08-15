// OpenAI API client for food analysis with system/user message separation
import type { FoodItem } from '../types';
import { validateAndNormalizeResponse } from './foodValidator';

interface OpenAIAnalysisRequest {
  prompt: string;
  images: File[];
  date: string;
  meal: string;
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

// Build the system prompt with exact ChatGPT Custom GPT format
function buildSystemPrompt(params: {
  formatted_date: string;
  meal: string;
  brand: string;
  user_prompt: string;
  photos_present_boolean: string;
}): string {
  return `
You are a nutritional analysis expert. Analyze the food shown or described and return a single plain-text block per item using the exact field order and formatting below. Do not include any extra commentary.

Context provided by the app:
Date: ${params.formatted_date}
Meal: ${params.meal}
Brand/Restaurant: ${params.brand}
Food Description: ${params.user_prompt}
Photos available: ${params.photos_present_boolean}

Behavior
- Use the provided Date, Meal, and Brand/Restaurant as given.
- Only ask for clarification if both of these are true:
  1) the description is very unclear or contradictory, and
  2) the photos do not add enough context to identify the item or a reasonable serving estimate.
- Otherwise, make confident, reasonable estimates. Do not ask for exact measurements.
- Prefer visual estimation from photos. When unclear, use typical restaurant standards.
- For restaurant items, use your knowledge of standard menu portions and nutritional data from that restaurant.
- You may use web search to look up restaurant menus and nutrition references, but never include links, citations, or notes in the output. Return only the schema fields.
- Base serving size and calories on what is shown. If you scale calories up or down, scale macros proportionally.
- Drinks, smoothies, soups: report serving in Fluid Ounce. Account for ice volume in the estimate.
- Names: proper case, max 60 chars, shorten where possible (e.g., "w/" for "with").
- Output must be plain text only. No bullets, numbering, bold, or extra notes.
- List each food item as a separate full block. Separate items with a single blank line.
- Serving Size must use exactly one allowed serving type from the SERVING_TYPES list.
- Icon must be exactly one value from the ICON_LIST. Never use "Default" - pick the most appropriate icon based on the food type.
- Icon suggestions: Hummus → "Dip", Bread → "Bread", Steak → "Beef", Mocktail → "Mixed Drink", Salad → "Salad", etc.
- Fields must never be empty for Food Name, Date, Meal, Brand, Serving Size, Calories.
- Values must be numbers only, with units exactly as shown in the schema labels. No parentheticals or extra words.

Allowed serving guidance
- Countable items: use Each (e.g., "3 tacos" = "3 each")
- Beverages or soups: use Fluid Ounce
- Weight-based foods: use Grams or Ounces as appropriate
- When exact weight/measurement unknown: use "serving" with context
- Examples: "1/2 serving", "1 serving", "2 servings"
- Never use "Default" for Icon - pick the most appropriate one

Field order and exact schema
Food Name: <short name, max 60 chars>
Date: <MM/DD>
Meal: <Breakfast|Lunch|Dinner|Snacks>
Brand: <brand or restaurant>
Icon: <one from ICON_LIST>
Serving Size: <amount> <unit> (e.g., "1/2 serving", "3 each", "8 fluid ounces")
Calories: <number>
Fat (g): <number>
Saturated Fat (g): <number>
Cholesterol (mg): <number>
Sodium (mg): <number>
Carbs (g): <number>
Fiber (g): <number>
Sugar (g): <number>
Protein (g): <number>

If fluid ounces are present, append this line:
Hydration: <total beverage fluid ounces as number> Fluid Ounce

SERVING_TYPES:
${SERVING_TYPES}

ICON_LIST:
${ICON_LIST}
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
    
    // Build system prompt with exact parameters
    const systemPrompt = buildSystemPrompt({
      formatted_date: formattedDate,
      meal: request.meal,
      brand: request.brand,
      user_prompt: request.prompt,
      photos_present_boolean: request.images.length > 0 ? 'true' : 'false',
    });

    // Compress images
    const compressedImages = await Promise.all(
      request.images.map(compressImage)
    );

    // Build input for Responses API with web search
    const input = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: request.images.length > 0 
          ? `Analyze the food shown in the images: ${request.prompt}`
          : `Analyze this food description: ${request.prompt}`,
      },
    ] as const;

    // Try with web search enabled (primary and fallback)
    const toolsPrimary = [{ type: "web_search" as const }];
    const toolsFallback = [{ type: "web_search_preview" as const }];

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
              text: request.images.length > 0 
                ? `Analyze the food shown in the images: ${request.prompt}`
                : `Analyze this food description: ${request.prompt}`,
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
          functions: [
            {
              name: "web_search",
              description: "Search the web for real-time information",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query"
                  }
                },
                required: ["query"]
              }
            }
          ],
          function_call: "auto"
        }),
      });

      // If web search fails, try standard completion
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

    // Validate and normalize the response using the validator
    try {
      const normalizedText = validateAndNormalizeResponse(aiResponse);
      const parsedResult = parseOpenAIResponse(normalizedText, request);
      
      return {
        success: true,
        data: parsedResult,
      };
    } catch (validationError) {
      console.warn('Validation failed, falling back to original parsing:', validationError);
      // Fallback to original parsing if validation fails
      const parsedResult = parseOpenAIResponse(aiResponse, request);
      
      return {
        success: true,
        data: parsedResult,
      };
    }

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
      console.log('AI returned 0 values, using fallback parsing');
      const fallbackItems = createFallbackItems(aiResponse, request);
      return {
        items: fallbackItems,
        plainText: aiResponse,
        needsMoreInfo: false,
      };
    }
    
    return {
      items,
      plainText: aiResponse,
      needsMoreInfo: false,
    };
  } catch (error) {
    console.error('Parsing error, using fallback:', error);
    // If parsing fails, use fallback items
    const fallbackItems = createFallbackItems(aiResponse, request);
    return {
      items: fallbackItems,
      plainText: aiResponse,
      needsMoreInfo: false,
    };
  }
};

// Parse the nutritional data format from ChatGPT Custom GPT
const parseNutritionalData = (response: string, request: OpenAIAnalysisRequest): FoodItem[] => {
  const items: FoodItem[] = [];
  
  // Try multiple splitting strategies for different response formats
  let itemSections: string[] = [];
  
  // Strategy 1: Look for "Food Name:" patterns
  if (response.includes('Food Name:')) {
    itemSections = response.split(/(?=Food Name:)/gi).filter(s => s.trim());
  }
  
  // Strategy 2: Look for numbered items (1., 2., etc.)
  if (itemSections.length === 0 && /^\d+\./m.test(response)) {
    itemSections = response.split(/(?=^\d+\.)/m).filter(s => s.trim());
  }
  
  // Strategy 3: Split by double newlines if multiple clear sections
  if (itemSections.length === 0 && response.split('\n\n').length > 2) {
    itemSections = response.split('\n\n').filter(s => s.trim());
  }
  
  // Strategy 4: Single item response
  if (itemSections.length === 0) {
    itemSections = [response];
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
    const lines = section.split('\n').map(l => l.trim());
    
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
    
    return {
      foodName: foodName.substring(0, 60), // Limit to 60 chars as per spec
      brand: request.brand,
      icon: extractValue([/Icon:\s*(.+)/i], 'Default'),
      serving: {
        amount: extractNumber([/Serving Size:\s*(\d+\.?\d*)/i, /Serving:\s*(\d+\.?\d*)/i], 1),
        unit: extractValue([/Serving Size:.*?(\w+(?:\s+\w+)?)\s*$/i, /Serving.*?(\w+)\s*$/i], 'each'),
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

const createFallbackItem = (response: string, request: OpenAIAnalysisRequest): FoodItem | null => {
  // Create a basic item from whatever information we can extract
  return {
    foodName: request.prompt.substring(0, 60) || 'Unknown Food',
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

const createFallbackItems = (response: string, request: OpenAIAnalysisRequest): FoodItem[] => {
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
  
  return items.length > 0 ? items : [createFallbackItem(response, request)!];
};

// Estimate cost for the request
export const estimateCost = (prompt: string, imageCount: number): number => {
  const textTokens = Math.ceil(prompt.length / 4); // Rough token estimate
  const textCost = (textTokens / 1000) * 0.00015; // gpt-4o-mini pricing
  const imageCost = imageCount * 0.00085; // Compressed image cost
  return textCost + imageCost;
};
