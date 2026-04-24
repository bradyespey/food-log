// API client for backend food logging
import type { FoodItem } from '../types';

interface LogFoodResponse {
  success: boolean;
  message: string;
  output?: string;
  verification?: {
    [itemIndex: number]: any;
  };
}

const formatFoodItemForLogging = (item: FoodItem, date: string, meal: string): string => {
  const lines = [
    `Food Name: ${item.foodName}`,
    `Date: ${date}`,
    `Meal: ${meal}`,
    `Brand: ${item.brand || ''}`,
    `Icon: ${item.icon}`,
    `Serving Size: ${item.serving.amount} ${item.serving.unit}`,
    `Calories: ${item.calories}`,
    `Fat (g): ${item.fatG}`,
    `Saturated Fat (g): ${item.satFatG}`,
    `Cholesterol (mg): ${item.cholesterolMg}`,
    `Sodium (mg): ${item.sodiumMg}`,
    `Carbs (g): ${item.carbsG}`,
    `Fiber (g): ${item.fiberG}`,
    `Sugar (g): ${item.sugarG}`,
    `Protein (g): ${item.proteinG}`,
  ];

  if (item.hydration?.isLiquid && (item.hydration.fluidOz || 0) > 0) {
    lines.push(`Hydration: ${item.hydration.fluidOz || 0} fluid ounces`);
  }

  return lines.join('\n');
};

export const logFoodToBackend = async (
  analysisResult: any,
  logWater: boolean = false
): Promise<LogFoodResponse> => {
  try {
    let formattedItems: string[];

    if (analysisResult.food_items && Array.isArray(analysisResult.food_items)) {
      formattedItems = analysisResult.food_items;
    } else if (analysisResult.items && Array.isArray(analysisResult.items)) {
      formattedItems = analysisResult.items.map((item: FoodItem) =>
        formatFoodItemForLogging(item, item.date, item.meal)
      );
    } else {
      throw new Error('No valid food items found in the analysis result');
    }

    const payload = {
      food_items: formattedItems,
      log_water: logWater,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60 * 1000);

    const response = await fetch('/.netlify/functions/food-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      if (result.verification && Object.keys(result.verification).length > 0) {
        return {
          success: false,
          message: result.error || result.message || 'Food logging failed',
          output: result.output || '',
          verification: result.verification || {},
        };
      }
      throw new Error(`API error (${response.status}): ${result.error || result.message || 'Unknown error'}`);
    }

    return {
      success: result.success || true,
      message: result.message || 'Food logged successfully!',
      output: result.output || result.message || 'Food logged to Lose It!',
      verification: result.verification || {},
    };

  } catch (error) {
    console.error('Food logging error:', error);

    let errorMessage = 'Failed to log food';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out after 60 seconds.';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        errorMessage = 'Cannot connect to server. Please ensure the Netlify dev server is running.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};
