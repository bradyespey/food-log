// OpenAI API client for food analysis
import type { FoodItem } from '../types';

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

// Build the prompt following ChatGPT Custom GPT format
const buildPrompt = (request: OpenAIAnalysisRequest): string => {
  const { prompt, date, meal, brand } = request;
  const formattedDate = new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
  
  return `You are a nutritional analysis expert. Analyze this food and provide nutritional information in the EXACT format specified below.

Context:
Date: ${formattedDate}
Meal: ${meal}
Brand/Restaurant: ${brand}

Food Description: ${prompt}

CRITICAL INSTRUCTIONS:
1. **ANALYZE PHOTOS VISUALLY** - Use the photos to estimate serving sizes and portions
2. **USE RESTAURANT STANDARDS** - Apply typical restaurant portion sizes when photos don't show clear measurements
3. **BE CONFIDENT** - Make reasonable estimates rather than asking for precision
4. **FOLLOW FORMAT EXACTLY** - Use the format below for each food item

REQUIRED OUTPUT FORMAT (follow exactly):
Food Name: [Food Name]
Date: ${formattedDate}
Meal: ${meal}
Brand: ${brand}
Icon: [Select from: Default, Mixed Drink, Chicken, Beef, Bread, Dip, etc.]
Serving Size: [amount] [unit]
Calories: [number]
Fat (g): [number]
Saturated Fat (g): [number]
Cholesterol (mg): [number]
Sodium (mg): [number]
Carbs (g): [number]
Fiber (g): [number]
Sugar (g): [number]
Protein (g): [number]

For drinks, add: Hydration: [fluid ounces] fluid ounces

IMPORTANT: Provide nutritional breakdown for each food item separately. Do not ask questions unless the description is completely vague with no photos.`;
};

export const analyzeFood = async (request: OpenAIAnalysisRequest): Promise<OpenAIResponse> => {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Compress images
    const compressedImages = await Promise.all(
      request.images.map(compressImage)
    );

    // Build the messages
    const messages: any[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildPrompt(request),
          },
          ...compressedImages.map(imageData => ({
            type: 'image_url',
            image_url: {
              url: imageData,
            },
          })),
        ],
      },
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse the response
    const parsedResult = parseOpenAIResponse(aiResponse, request);
    
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
