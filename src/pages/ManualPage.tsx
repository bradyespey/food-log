import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { CheckCircle, Droplets, Copy, PenTool } from 'lucide-react';
import { logFoodToBackend } from '../lib/api';
import { toast, Toaster } from 'react-hot-toast';
import { useSampleData } from '../App';




export default function ManualPage() {
  const [isLogging, setIsLogging] = useState(false);
  const [logResult, setLogResult] = useState('');
  const [foodText, setFoodText] = useState('');
  const [logWater, setLogWater] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('foodlog-logwater');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Sample data context
  const { setLoadSampleData } = useSampleData();

  // Sample data loading function for Manual page
  const loadSampleDataFunction = useCallback(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Helper function to get local date string
    const getLocalDateString = (date: Date): string => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}/${day}`;
    };

    const sampleData = `Food Name: Hummus w/ House Bread
Date: ${getLocalDateString(today)}
Meal: Dinner
Brand: Sample Restaurant
Icon: Dip, Green
Serving Size: 4 ounces
Calories: 300
Fat (g): 15
Saturated Fat (g): 2
Cholesterol (mg): 0
Sodium (mg): 400
Carbs (g): 35
Fiber (g): 5
Sugar (g): 2
Protein (g): 8

Food Name: Big League Mocktail
Date: ${getLocalDateString(today)}
Meal: Dinner
Brand: Sample Restaurant
Icon: Mixed Drink
Serving Size: 12 fluid ounces
Calories: 150
Fat (g): 0
Saturated Fat (g): 0
Cholesterol (mg): 0
Sodium (mg): 10
Carbs (g): 38
Fiber (g): 0
Sugar (g): 30
Protein (g): 0

Food Name: Shawarma-Spiced Prime Skirt Steak Frites
Date: ${getLocalDateString(today)}
Meal: Dinner
Brand: Sample Restaurant
Icon: Beef
Serving Size: 8 ounces
Calories: 600
Fat (g): 35
Saturated Fat (g): 15
Cholesterol (mg): 120
Sodium (mg): 1200
Carbs (g): 40
Fiber (g): 5
Sugar (g): 2
Protein (g): 50

Food Name: Bro Smoothie
Date: ${getLocalDateString(yesterday)}
Meal: Lunch
Brand: Sample Smoothie Shop
Icon: Smoothie
Serving Size: 16 fluid ounces
Calories: 400
Fat (g): 15
Saturated Fat (g): 3
Cholesterol (mg): 0
Sodium (mg): 200
Carbs (g): 50
Fiber (g): 5
Sugar (g): 25
Protein (g): 20`;

    setFoodText(sampleData);
    toast.success('Sample data loaded!');
  }, []);

  // Register the sample data function with the context
  useEffect(() => {
    setLoadSampleData(loadSampleDataFunction);
  }, [setLoadSampleData, loadSampleDataFunction]);

  // Save logWater state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('foodlog-logwater', JSON.stringify(logWater));
    }
  }, [logWater]);

  const handleLogFood = useCallback(async () => {
    if (!foodText.trim()) {
      toast.error('Please paste food items to log');
      return;
    }

    setIsLogging(true);
    setLogResult('');
    toast.dismiss();
    
    try {
      // Split food items by double newlines and create individual food item strings
      const foodItems = foodText.split('\n\n')
        .filter(item => item.trim())
        .map(item => item.trim())
        .filter(item => item.includes('Food Name:')); // Only include valid food items

      if (foodItems.length === 0) {
        toast.error('No food items found. Please paste in the correct format.');
        return;
      }

      // Send data in the exact same format as your old LoseIt app
      const result = await logFoodToBackend({ 
        food_items: foodItems,
        log_water: logWater 
      }, logWater);
      
      if (result.success) {
        setLogResult(`✅ ${result.message}\n\n${result.output || ''}`);
        toast.success(`Food logged successfully! (${foodItems.length} items)`);
        
        if (logWater) {
          setLogResult(prev => prev + '\n💧 Water intake also logged');
        }
      } else {
        // Check if this is a server connection error (no verification data)
        if (!result.verification || Object.keys(result.verification).length === 0) {
          // This is likely a server connection error
          let errorMessage = result.message || 'Failed to log food';
          
          if (errorMessage.includes('Cannot connect to API server') || 
              errorMessage.includes('Failed to fetch') || 
              errorMessage.includes('CORS')) {
            errorMessage = '❌ API Server Not Running\n\n💡 Please start the Flask API server:\n   cd C:\\Projects\\API\n   python3 app.py';
          } else if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
            errorMessage = '❌ API Server Not Responding\n\n💡 The Flask API server may be starting up or crashed.\n   Check the server logs and restart if needed.';
          } else {
            errorMessage = `❌ ${errorMessage}`;
          }
          
          setLogResult(errorMessage);
          toast.error('API server connection failed');
          return;
        }
        
        // Parse verification details for better error display
        const verificationDetails = result.verification || {};
        const failedItems = Object.values(verificationDetails).map((item: any) => {
          const missingFields: string[] = [];
          const failedFields: string[] = [];
          
          Object.entries(item).forEach(([key, field]: [string, any]) => {
            if (key !== 'allFieldsMatch' && key !== 'verificationComplete' && key !== 'missingFields' && key !== 'failureReason') {
              if (field?.matches === false) {
                if (field?.actual === 'MISSING FROM INPUT') {
                  missingFields.push(key);
                } else if (field?.actual?.startsWith('FAILED:')) {
                  failedFields.push(key);
                }
              }
            }
          });
          
          return {
            name: item.foodName?.expected || 'Unknown Item',
            missingFields: missingFields,
            failedFields: failedFields,
            failureReason: item.failureReason,
            actualMissingFields: item.missingFields || []
          };
        });

        let errorMessage = `❌ Verification Failed\n\n`;
        let hasFieldIssues = false;
        let hasLoggingIssues = false;
        
        failedItems.forEach(item => {
          errorMessage += `• ${item.name}\n`;
          
          if (item.failureReason) {
            errorMessage += `  Issue: ${item.failureReason}\n`;
            hasLoggingIssues = true;
          }
          
          if (item.actualMissingFields.length > 0) {
            errorMessage += `  Missing required fields: ${item.actualMissingFields.join(', ')}\n`;
            hasFieldIssues = true;
          }
          
          if (item.failedFields.length > 0) {
            errorMessage += `  Failed to log: ${item.failedFields.join(', ')}\n`;
            hasLoggingIssues = true;
          }
        });
        
        // Provide specific guidance based on the type of issue
        if (hasFieldIssues) {
          errorMessage += `\n💡 Field Name Issues:\n`;
          errorMessage += `   Use exact field names: Fat (g), Carbs (g), Fiber (g), Sugar (g), Protein (g), Calories\n`;
          errorMessage += `   Common mistakes: "Total Fat (g)" → "Fat (g)", "Total Carbohydrate (g)" → "Carbs (g)"`;
        }
        
        if (hasLoggingIssues && !hasFieldIssues) {
          errorMessage += `\n💡 Logging Issues:\n`;
          errorMessage += `   The food data was correct but failed to log to LoseIt.\n`;
          errorMessage += `   This may be due to network issues or LoseIt website changes.`;
        }
        
        setLogResult(errorMessage);
        toast.error('Food logging verification failed');
        return;
      }
    } catch (error) {
      console.error('Logging failed:', error);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to log food';
      let errorType = 'unknown';
      
      if (error instanceof Error) {
        if (error.message.includes('Cannot connect to API server') || 
            error.message.includes('Failed to fetch') || 
            error.message.includes('CORS')) {
          errorMessage = '❌ API Server Not Running\n\n💡 Please start the Flask API server:\n   cd C:\\Projects\\API\n   python3 app.py';
          errorType = 'server_down';
        } else if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
          errorMessage = '❌ API Server Not Responding\n\n💡 The Flask API server may be starting up or crashed.\n   Check the server logs and restart if needed.';
          errorType = 'server_error';
        } else if (error.message.includes('API error')) {
          errorMessage = `❌ API Error\n\n${error.message}`;
          errorType = 'api_error';
        } else {
          errorMessage = `❌ ${error.message}`;
          errorType = 'general_error';
        }
      }
      
      setLogResult(errorMessage);
      
      // Show appropriate toast based on error type
      if (errorType === 'server_down') {
        toast.error('API server is not running');
      } else if (errorType === 'server_error') {
        toast.error('API server not responding');
      } else {
        toast.error('Food logging failed');
      }
    } finally {
      setIsLogging(false);
    }
  }, [foodText, logWater]);

  const handleClear = useCallback(() => {
    setFoodText('');
    setLogResult('');
    toast.success('Cleared all data');
  }, []);



  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  }, []);



  return (
    <div className="space-y-4 px-4 max-w-5xl mx-auto">
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
          },
        }}
      />

      {/* Page Header */}
      <div className="text-center space-y-1 py-1">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-3">
          <PenTool className="w-6 h-6 text-primary" />
          Manual Food Log
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          Paste pre-formatted food items for direct logging to Lose It!
        </p>
      </div>

      {/* Main Input Card - Simple like your old LoseIt app */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-green-600 dark:text-green-400" />
              Food Log Text
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isLogging}
                size="sm"
                className="text-sm"
              >
                Clear
              </Button>
              <Button
                onClick={handleLogFood}
                disabled={!foodText.trim() || isLogging}
                isLoading={isLogging}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                size="sm"
                className="text-sm"
              >
                {isLogging ? 'Logging... (up to 15 min)' : 'Log Food'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main textarea - like your old LoseIt app */}
          <Textarea
            placeholder="Paste your food log text here...

Example format:
Food Name: Cafe Vanilla Coffee
Date: 08/17
Meal: Breakfast
Brand: Keurig
Icon: Coffee
Serving Size: 8 fluid ounces
Calories: 60
Fat (g): 2
Saturated Fat (g): 0.5
Cholesterol (mg): 0
Sodium (mg): 100
Carbs (g): 10
Fiber (g): 0
Sugar (g): 8
Protein (g): 1

(Separate multiple items with blank lines)"
            value={foodText}
            onChange={(e) => setFoodText(e.target.value)}
            rows={20}
            className="font-mono text-sm resize-none"
          />

          {/* Item count indicator */}
          {foodText && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {foodText.split('\n\n').filter(item => item.trim()).length} food item(s) ready to log
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Water Row - moved outside the box like AI page */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="logWater"
            checked={logWater}
            onChange={(e) => setLogWater(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="logWater" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Droplets className="w-4 h-4 text-blue-500" />
            Log Water
          </label>
        </div>
        
        {foodText && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(foodText)}
            leftIcon={<Copy className="w-4 h-4" />}
          >
            Copy Text
          </Button>
        )}
      </div>

      {/* Logging Results */}
      {logResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Logging Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="text-sm text-gray-700 dark:text-gray-300 space-y-2 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ 
                __html: logResult
                  .replace(/\n/g, '<br>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
