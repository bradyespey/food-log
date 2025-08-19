import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { CheckCircle, Droplets, Copy, PenTool } from 'lucide-react';
import { logFoodToBackend } from '../lib/api';
import { toast, Toaster } from 'react-hot-toast';



export default function ManualPage() {
  const [isLogging, setIsLogging] = useState(false);
  const [logResult, setLogResult] = useState('');
  const [foodText, setFoodText] = useState('');
  const [logWater, setLogWater] = useState(true);

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
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Logging failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to log food';
      setLogResult(`❌ ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsLogging(false);
    }
  }, [foodText, logWater]);

  const handleClear = useCallback(() => {
    setFoodText('');
    setLogResult('');
    toast.success('Cleared all data');
  }, []);

  const handleExample = useCallback(() => {
    const exampleText = `Food Name: Cafe Vanilla Coffee
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

Food Name: Greek Yogurt with Berries
Date: 08/17
Meal: Breakfast
Brand: Chobani
Icon: Yogurt
Serving Size: 1 cup
Calories: 140
Fat (g): 0
Saturated Fat (g): 0
Cholesterol (mg): 10
Sodium (mg): 65
Carbs (g): 20
Fiber (g): 0
Sugar (g): 16
Protein (g): 20`;

    setFoodText(exampleText);
    toast.success('Example data loaded!');
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
    <div className="space-y-8 px-4 max-w-5xl mx-auto">
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
      <div className="text-center space-y-2 py-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
          <PenTool className="w-8 h-8 text-primary" />
          Manual Food Log
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Paste pre-formatted food items for direct logging to Lose It!
        </p>
      </div>

      {/* Main Input Card - Simple like your old LoseIt app */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-green-600 dark:text-green-400" />
              Food Log Text
            </CardTitle>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isLogging}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={handleExample}
                disabled={isLogging}
              >
                Example
              </Button>
              <Button
                onClick={handleLogFood}
                disabled={!foodText.trim() || isLogging}
                isLoading={isLogging}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                {isLogging ? 'Logging...' : 'Log Food'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {/* Log Water Toggle - like your old app */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
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

          {/* Item count indicator */}
          {foodText && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {foodText.split('\n\n').filter(item => item.trim()).length} food item(s) ready to log
            </div>
          )}
        </CardContent>
      </Card>

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
