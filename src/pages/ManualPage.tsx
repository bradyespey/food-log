import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { CheckCircle } from 'lucide-react';
import { logFoodToBackend } from '../lib/api';
import { toast, Toaster } from 'react-hot-toast';

interface ManualFoodItem {
  foodName: string;
  date: string;
  meal: string;
  brand: string;
  icon: string;
  serving: {
    amount: number;
    unit: string;
  };
  calories: number;
  fatG: number;
  satFatG: number;
  cholesterolMg: number;
  sodiumMg: number;
  carbsG: number;
  fiberG: number;
  sugarG: number;
  proteinG: number;
}

export default function ManualPage() {
  const [isLogging, setIsLogging] = useState(false);
  const [logResult, setLogResult] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    meal: 'Dinner',
    brand: '',
    prompt: '',
    logWater: false,
  });

  const [foodItems, setFoodItems] = useState<ManualFoodItem[]>([]);

  const handleAnalyze = useCallback(async () => {
    if (!formData.prompt.trim()) {
      toast.error('Please enter food description');
      return;
    }

    try {
      // Parse the manual food format
      const items = parseManualFoodFormat(formData.prompt);
      if (items.length === 0) {
        toast.error('Could not parse food format. Please use the exact format shown.');
        return;
      }

      setFoodItems(items);
      toast.success(`Parsed ${items.length} food items`);
    } catch (error) {
      console.error('Parsing failed:', error);
      toast.error('Failed to parse food format');
    }
  }, [formData.prompt]);

  const handleLogFood = useCallback(async () => {
    if (foodItems.length === 0) return;

    setIsLogging(true);
    setLogResult('');
    toast.dismiss();
    
    try {
      // Convert to the format expected by the API
      const analysisResult = {
        date: formData.date,
        meal: formData.meal,
        items: foodItems
      };

      const result = await logFoodToBackend(analysisResult, formData.logWater);
      
      if (result.success) {
        setLogResult(`✅ ${result.message}\n\n${result.output || ''}`);
        toast.success('Food logged successfully!');
        
        if (formData.logWater) {
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
  }, [foodItems, formData.date, formData.meal, formData.logWater]);

  const handleClear = useCallback(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      meal: 'Dinner',
      brand: '',
      prompt: '',
      logWater: false,
    });
    setFoodItems([]);
    setLogResult('');
  }, []);

  const handleSampleData = useCallback(() => {
    const samplePrompt = `Food Name: Big League (Mocktail)
Date: ${new Date().toISOString().split('T')[0]}
Meal: Dinner
Brand: Sample Restaurant
Icon: Mixed Drink
Serving Size: 8 fluid ounces
Calories: 120
Fat (g): 0
Saturated Fat (g): 0
Cholesterol (mg): 0
Sodium (mg): 10
Carbs (g): 30
Fiber (g): 0
Sugar (g): 25
Protein (g): 0

Food Name: Hummus w/ House Bread
Date: ${new Date().toISOString().split('T')[0]}
Meal: Dinner
Brand: Sample Restaurant
Icon: Dip
Serving Size: 0.5 serving
Calories: 150
Fat (g): 8
Saturated Fat (g): 1
Cholesterol (mg): 0
Sodium (mg): 300
Carbs (g): 18
Fiber (g): 4
Sugar (g): 1
Protein (g): 5

Food Name: Shawarma-Spiced Prime Skirt Steak Frites
Date: ${new Date().toISOString().split('T')[0]}
Meal: Dinner
Brand: Sample Restaurant
Icon: Beef
Serving Size: 1 serving
Calories: 600
Fat (g): 35
Saturated Fat (g): 10
Cholesterol (mg): 100
Sodium (mg): 800
Carbs (g): 40
Fiber (g): 5
Sugar (g): 2
Protein (g): 40`;

    setFormData(prev => ({
      ...prev,
      date: new Date().toISOString().split('T')[0],
      meal: 'Dinner',
      brand: 'Sample Restaurant',
      prompt: samplePrompt,
    }));
    toast.success('Sample data loaded!');
  }, []);

  const parseManualFoodFormat = (text: string): ManualFoodItem[] => {
    const items: ManualFoodItem[] = [];
    const foodBlocks = text.split('\n\n').filter(block => block.trim());
    
    for (const block of foodBlocks) {
      const lines = block.split('\n').filter(line => line.trim());
      const item: any = {};
      
      for (const line of lines) {
        const [key, ...valueParts] = line.split(': ');
        const value = valueParts.join(': ').trim();
        
        switch (key.trim()) {
          case 'Food Name':
            item.foodName = value;
            break;
          case 'Date':
            item.date = value;
            break;
          case 'Meal':
            item.meal = value;
            break;
          case 'Brand':
            item.brand = value;
            break;
          case 'Icon':
            item.icon = value;
            break;
          case 'Serving Size':
            const [amount, unit] = value.split(' ');
            item.serving = {
              amount: parseFloat(amount) || 1,
              unit: unit || 'serving'
            };
            break;
          case 'Calories':
            item.calories = parseInt(value) || 0;
            break;
          case 'Fat (g)':
            item.fatG = parseInt(value) || 0;
            break;
          case 'Saturated Fat (g)':
            item.satFatG = parseInt(value) || 0;
            break;
          case 'Cholesterol (mg)':
            item.cholesterolMg = parseInt(value) || 0;
            break;
          case 'Sodium (mg)':
            item.sodiumMg = parseInt(value) || 0;
            break;
          case 'Carbs (g)':
            item.carbsG = parseInt(value) || 0;
            break;
          case 'Fiber (g)':
            item.fiberG = parseInt(value) || 0;
            break;
          case 'Sugar (g)':
            item.sugarG = parseInt(value) || 0;
            break;
          case 'Protein (g)':
            item.proteinG = parseInt(value) || 0;
            break;
        }
      }
      
      if (item.foodName && item.calories !== undefined) {
        items.push(item as ManualFoodItem);
      }
    }
    
    return items;
  };

  return (
    <div className="space-y-8 px-4 max-w-5xl mx-auto">
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Manual Food Logging
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Direct food entry in structured format for quick logging without AI analysis
        </p>
      </div>

      {/* Sample Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleSampleData}
            variant="outline"
            className="w-full"
          >
            📋 Load Sample Data
          </Button>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
            Loads sample food items for testing and demonstration
          </p>
        </CardContent>
      </Card>

      {/* Food Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>Food Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meal
              </label>
              <select
                value={formData.meal}
                onChange={(e) => setFormData(prev => ({ ...prev, meal: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Brand/Restaurant
              </label>
              <Input
                type="text"
                placeholder="e.g., Sample Restaurant"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Food Items (use exact format below)
            </label>
            <Textarea
              placeholder="Paste food items in the exact format shown below..."
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Format: Food Name, Date, Meal, Brand, Icon, Serving Size, Calories, Fat, etc.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="logWater"
              checked={formData.logWater}
              onChange={(e) => setFormData(prev => ({ ...prev, logWater: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="logWater" className="text-sm text-gray-700 dark:text-gray-300">
              Log water intake for drinks
            </label>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleAnalyze}
              variant="outline"
              className="flex-1"
            >
              🔍 Parse & Validate
            </Button>
            <Button 
              onClick={handleClear}
              variant="outline"
              className="flex-1"
            >
              🗑️ Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parsed Results */}
      {foodItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Parsed Food Items ({foodItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {foodItems.map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{item.foodName}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.brand}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.serving.amount} {item.serving.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{item.calories} cal</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Icon: {item.icon}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                    {/* Nutrition Facts - Exactly like Lose It! app */}
                    <div className="col-span-full space-y-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Nutrition Facts
                      </div>
                      
                      {/* Amount and Serving - Like Lose It! */}
                      <div className="flex justify-between text-sm border-b border-gray-200 dark:border-gray-600 pb-2">
                        <span className="text-gray-500 dark:text-gray-400">Amount</span>
                        <span className="text-gray-500 dark:text-gray-400">1 Serving</span>
                      </div>
                      
                      {/* Compact nutrition display - like Lose It! app */}
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                        {/* Calories prominently displayed */}
                        <div className="text-center mb-4">
                          <div className="text-5xl font-bold text-gray-900 dark:text-white">{item.calories}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Calories</div>
                        </div>
                        
                        {/* Compact nutrient grid */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Total Fat:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{item.fatG}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Sat Fat:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{item.satFatG}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Cholesterol:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{item.cholesterolMg}mg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Sodium:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{item.sodiumMg}mg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Total Carbs:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{item.carbsG}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Fiber:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{item.fiberG}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Sugars:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{item.sugarG}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Protein:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{item.proteinG}g</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Button 
                onClick={handleLogFood}
                disabled={isLogging}
                isLoading={isLogging}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="w-full"
              >
                {isLogging ? 'Logging...' : 'Log to Lose It!'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              className="text-sm text-gray-700 dark:text-gray-300 space-y-2"
              dangerouslySetInnerHTML={{ __html: logResult.replace(/\n/g, '<br>') }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
