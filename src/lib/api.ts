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
  verification?: {
    [itemIndex: number]: any;
  };
}

// Convert FoodItem to the text format expected by the Selenium automation
const formatFoodItemForLogging = (item: FoodItem, date: string, meal: string): string => {
  // Use the item's individual date and meal directly (they're already correctly mapped)
  const itemDate = date;
  const itemMeal = meal;

  const lines = [
    `Food Name: ${item.foodName}`,
    `Date: ${itemDate}`,
    `Meal: ${itemMeal}`,
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

    let formattedItems: string[];
    
    // Check if we have direct food_items (from Manual page) or structured items (from AI analysis)
    if (analysisResult.food_items && Array.isArray(analysisResult.food_items)) {
      // Direct food items from Manual page - use them as-is
      formattedItems = analysisResult.food_items;
    } else if (analysisResult.items && Array.isArray(analysisResult.items)) {
      // Structured items from AI analysis - convert to text format
      formattedItems = analysisResult.items.map((item: FoodItem) =>
        formatFoodItemForLogging(item, item.date, item.meal)
      );
    } else {
      throw new Error('No valid food items found in the analysis result');
    }

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

    // Debug mode is now controlled by .env HEADLESS_MODE on the Flask server

    const response = await fetch(`${apiBaseUrl}/food_log`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      // Even for error responses, check if we have verification data
      if (result.verification && Object.keys(result.verification).length > 0) {
        return {
          success: false,
          message: result.error || result.message || 'Food logging failed',
          output: result.output || '',
          verification: result.verification || {},
        };
      } else {
        // No verification data, this is a real error
        throw new Error(`API error (${response.status}): ${result.error || result.message || 'Unknown error'}`);
      }
    }

    return {
      success: result.success || true,
      message: result.message || 'Food logged successfully!',
      output: result.output || result.message || 'Food logged to Lose It!',
      verification: result.verification || {},
    };

  } catch (error) {
    console.error('Food logging error:', error);
    
    // Provide clearer error messages for common issues
    let errorMessage = 'Failed to log food';
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        errorMessage = 'Cannot connect to API server. Please ensure the Flask API is running.';
      } else if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
        errorMessage = 'API server is not responding. Please check if the Flask API is running.';
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
