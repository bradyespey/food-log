// API client for backend food logging
import type { FoodItem } from '../types';

// interface LogFoodRequest {
//   foodData: FoodItem[];
//   logWater?: boolean;
// }

interface LogFoodResponse {
  success: boolean;
  message: string;
  output?: string;
}

// Convert FoodItem to the text format expected by the Selenium automation
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

  // Add hydration if it's a liquid with fluid ounces
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
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiUsername = import.meta.env.VITE_API_USERNAME;
    const apiPassword = import.meta.env.VITE_API_PASSWORD;

    if (!apiBaseUrl) {
      throw new Error('API base URL not configured');
    }

    // Convert each food item to the expected text format
    const formattedItems = analysisResult.items.map((item: FoodItem) =>
      formatFoodItemForLogging(item, analysisResult.date, analysisResult.meal)
    );

    // Prepare the request payload
    const payload = {
      food_items: formattedItems,
      log_water: logWater,
    };

    // Make the API call with basic authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiUsername && apiPassword) {
      headers['Authorization'] = `Basic ${btoa(`${apiUsername}:${apiPassword}`)}`;
    }

    // Debug header disabled until backend CORS confirms allow-list for X-Debug-Mode
    // const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
    // if (debugMode) {
    //   headers['X-Debug-Mode'] = 'true';
    // }

    const response = await fetch(`${apiBaseUrl}/food_log`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    return {
      success: true,
      message: 'Food logged successfully!',
      output: result.output || result.message || 'Food logged to Lose It!',
    };

  } catch (error) {
    console.error('Food logging error:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to log food',
    };
  }
};

// Health check for the backend API
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    
    if (!apiBaseUrl) {
      return false;
    }

    const response = await fetch(`${apiBaseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};
