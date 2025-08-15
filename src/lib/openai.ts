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
  
  return `You are a nutritional analysis expert. Analyze this food and provide nutritional information in the exact format specified.

Context:
Date: ${formattedDate}
Meal: ${meal}
Brand/Restaurant: ${brand}

Food Description: ${prompt}

IMPORTANT INSTRUCTIONS:
1. **ESTIMATE PORTIONS VISUALLY** - Use the photos to estimate serving sizes. Don't ask for exact measurements.
2. **RESTAURANT STANDARDS** - Use typical restaurant portion sizes when photos don't show clear measurements.
3. **VISUAL ANALYSIS** - Analyze the plate, glass size, and food proportions in the images.
4. **ONLY ASK QUESTIONS** if the description is completely unclear (e.g., "some food" without photos).
5. **PROVIDE ESTIMATES** for:
   - Use visual cues from photos to estimate portion sizes
   - Apply typical restaurant serving standards when photos don't show clear measurements
   - Analyze plate dimensions, glass sizes, and food proportions
   - Make reasonable estimates rather than asking for precision

6. **FORMAT OUTPUT** exactly as specified in the ChatGPT Custom GPT format.

7. **BE CONFIDENT** - Make reasonable estimates rather than asking for precision.

Respond with either:
- Clarifying questions ONLY if description is completely vague with no photos
- Detailed nutritional breakdown with estimated portions based on visual analysis`;
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
    return {
      items,
      plainText: aiResponse,
      needsMoreInfo: false,
    };
  } catch (error) {
    // If parsing fails, treat as questions
    return {
      items: [],
      plainText: aiResponse,
      needsMoreInfo: true,
      questions: ['Could you provide more specific details about the portions and preparation?'],
    };
  }
};

// Parse the nutritional data format from ChatGPT Custom GPT
const parseNutritionalData = (response: string, request: OpenAIAnalysisRequest): FoodItem[] => {
  const items: FoodItem[] = [];
  
  // Split response by food items (look for "Food Name:" patterns)
  const itemSections = response.split(/(?=Food Name:|Item \d+:|^\d+\.)/m).filter(s => s.trim());
  
  for (const section of itemSections) {
    const item = parseIndividualFoodItem(section, request);
    if (item) {
      items.push(item);
    }
  }
  
  // If no structured items found, create a single item from the overall response
  if (items.length === 0) {
    const fallbackItem = createFallbackItem(response, request);
    if (fallbackItem) {
      items.push(fallbackItem);
    }
  }
  
  return items;
};

const parseIndividualFoodItem = (section: string, request: OpenAIAnalysisRequest): FoodItem | null => {
  try {
    const lines = section.split('\n').map(l => l.trim());
    
    // Extract values using regex patterns
    const extractValue = (pattern: RegExp, defaultValue: any = '') => {
      for (const line of lines) {
        const match = line.match(pattern);
        if (match) return match[1]?.trim() || defaultValue;
      }
      return defaultValue;
    };
    
    const extractNumber = (pattern: RegExp, defaultValue: number = 0) => {
      const value = extractValue(pattern, '0');
      return parseFloat(value.replace(/[^\d.]/g, '')) || defaultValue;
    };
    
    const foodName = extractValue(/Food Name:\s*(.+)/i) || extractValue(/Item.*:\s*(.+)/i) || 'Unknown Food';
    if (foodName === 'Unknown Food' || foodName === '') return null;
    
    return {
      foodName: foodName.substring(0, 60), // Limit to 60 chars as per spec
      brand: request.brand,
      icon: extractValue(/Icon:\s*(.+)/i, 'Default'),
      serving: {
        amount: extractNumber(/Serving Size:\s*(\d+\.?\d*)/i, 1),
        unit: extractValue(/Serving Size:.*?(\w+(?:\s+\w+)?)\s*$/i, 'each'),
        descriptor: extractValue(/Serving Size:.*?\((.+?)\)/i, ''),
      },
      calories: extractNumber(/Calories:\s*(\d+)/i),
      fatG: extractNumber(/Fat.*:\s*(\d+\.?\d*)/i),
      satFatG: extractNumber(/Saturated Fat.*:\s*(\d+\.?\d*)/i),
      cholesterolMg: extractNumber(/Cholesterol.*:\s*(\d+\.?\d*)/i),
      sodiumMg: extractNumber(/Sodium.*:\s*(\d+\.?\d*)/i),
      carbsG: extractNumber(/Carbs.*:\s*(\d+\.?\d*)/i),
      fiberG: extractNumber(/Fiber.*:\s*(\d+\.?\d*)/i),
      sugarG: extractNumber(/Sugar.*:\s*(\d+\.?\d*)/i),
      proteinG: extractNumber(/Protein.*:\s*(\d+\.?\d*)/i),
      hydration: {
        isLiquid: /liquid|drink|beverage|juice|smoothie|cocktail|mocktail|water/i.test(foodName),
        fluidOz: /liquid|drink|beverage|juice|smoothie|cocktail|mocktail|water/i.test(foodName) 
          ? extractNumber(/Hydration:\s*(\d+\.?\d*)/i) 
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

// Estimate cost for the request
export const estimateCost = (prompt: string, imageCount: number): number => {
  const textTokens = Math.ceil(prompt.length / 4); // Rough token estimate
  const textCost = (textTokens / 1000) * 0.00015; // gpt-4o-mini pricing
  const imageCost = imageCount * 0.00085; // Compressed image cost
  return textCost + imageCost;
};
