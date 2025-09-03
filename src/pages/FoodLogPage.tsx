//src/pages/FoodLogPage.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { ChefHat, Sparkles, DollarSign, Copy, CheckCircle, AlertCircle, Droplets, Plus, X, Clipboard, Calendar, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import ImageUpload from '../components/ui/ImageUpload';
import { analyzeFood, estimateCost } from '../lib/openai';
import { logFoodToBackend } from '../lib/api';
import type { FoodItem, FoodEntryCard } from '../types';
import { useSampleData } from '../App';

const FoodLogPage: React.FC = () => {
  const { setLoadSampleData } = useSampleData();
  
  // Helper function to get local date string (not UTC)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ── Multi-Entry State ────────────────────────────────────────────
  const [foodEntries, setFoodEntries] = useState<FoodEntryCard[]>([{
    id: '1',
    date: getLocalDateString(new Date()),
    meal: 'Breakfast',
    brand: '',
    prompt: '',
    images: [],
  }]);
  
  const [logWater, setLogWater] = useState(false);

  // ── UI State ────────────────────────────────────────────────────
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<{[itemIndex: number]: any}>({});

  // ── Computed Values ─────────────────────────────────────────────
  const validEntries = foodEntries.filter(entry => 
    entry.date && entry.meal && entry.brand && entry.prompt
  );
  const totalImages = foodEntries.reduce((sum, entry) => sum + entry.images.length, 0);
  const totalPromptLength = foodEntries.reduce((sum, entry) => sum + entry.prompt.length, 0);
  const estimatedCost = estimateCost('', totalImages) + (totalPromptLength / 1000) * 0.001;
  const isFormValid = validEntries.length > 0;



  // ── Sample Data Loading ──────────────────────────────────────────
  const loadSampleDataFunction = useCallback(async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Sample data for different scenarios
    const sampleData: Array<{
      date: string;
      meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
      brand: string;
      prompt: string;
      images: Promise<File>[];
    }> = [
      {
        date: getLocalDateString(today), // Today (local time)
        meal: 'Dinner' as const,
        brand: 'Sample Restaurant',
        prompt: '- Hummus, served with house bread (had maybe half the hummus and all of the side bread)\n- Big League (mocktail), ritual tequila substitute, lime, orgeat, strawberry\n- SHAWARMA-SPICED PRIME SKIRT STEAK FRITES* za\'atar, feta, berbere red wine jus',
        images: [
          // Load sample images from public folder
          fetch('/big-league-mocktail.jpeg').then(r => r.blob()).then(blob => new File([blob], 'big-league-mocktail.jpeg', { type: 'image/jpeg' })),
          fetch('/hummus-and-bread.jpeg').then(r => r.blob()).then(blob => new File([blob], 'hummus-and-bread.jpeg', { type: 'image/jpeg' })),
          fetch('/house-bread.jpeg').then(r => r.blob()).then(blob => new File([blob], 'house-bread.jpeg', { type: 'image/jpeg' })),
          fetch('/shawarma-steak-frites.jpeg').then(r => r.blob()).then(blob => new File([blob], 'shawarma-steak-frites.jpeg', { type: 'image/jpeg' }))
        ]
      },
      {
        date: getLocalDateString(yesterday), // Yesterday (local time)
        meal: 'Lunch' as const,
        brand: 'Sample Smoothie Shop',
        prompt: '"Bro" smoothie with a blend of banana, peanut butter, protein powder, almond milk',
        images: [
          fetch('/bro-smoothie.jpeg').then(r => r.blob()).then(blob => new File([blob], 'bro-smoothie.jpeg', { type: 'image/jpeg' }))
        ]
      }
    ];

    try {
      // Resolve all images (no compression here - let OpenAI handle it)
      const resolvedSampleData = await Promise.all(
        sampleData.map(async (data) => ({
          ...data,
          images: await Promise.all(data.images)
        }))
      );

      // Update existing food entries with sample data
      setFoodEntries(prevEntries => {
        const updatedEntries = [...prevEntries];
        
        // Fill each existing card with sample data (cycling through if more cards than samples)
        for (let i = 0; i < updatedEntries.length; i++) {
          const sampleIndex = i % resolvedSampleData.length;
          const sample = resolvedSampleData[sampleIndex];
          
          updatedEntries[i] = {
            ...updatedEntries[i],
            date: sample.date,
            meal: sample.meal,
            brand: sample.brand,
            prompt: sample.prompt,
            images: [...sample.images] // Create a copy of the images array
          };
        }
        
        // Only show one toast message
        return updatedEntries;
      });
      
      toast.success(`Loaded sample data into ${foodEntries.length} food card${foodEntries.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error loading sample data:', error);
      toast.error('Failed to load sample data');
    }
  }, [foodEntries.length]);

  // ── Handlers ────────────────────────────────────────────────────
  const addFoodEntry = useCallback(() => {
    const newEntry: FoodEntryCard = {
      id: Date.now().toString(),
      date: getLocalDateString(new Date()),
      meal: 'Breakfast',
      brand: '',
      prompt: '',
      images: [],
    };
    setFoodEntries(prev => [...prev, newEntry]);
  }, []);

  const removeFoodEntry = useCallback((id: string) => {
    setFoodEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  const updateFoodEntry = useCallback((id: string, field: keyof FoodEntryCard, value: any) => {
    setFoodEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  }, []);

  const handleImagesChange = useCallback((id: string, images: File[]) => {
    updateFoodEntry(id, 'images', images);
  }, [updateFoodEntry]);

  const handleAnalyze = useCallback(async () => {
    if (!isFormValid || validEntries.length === 0) {
      toast.error('Please fill in at least one food entry completely');
      return;
    }

    setIsAnalyzing(true);
    setQuestions([]);
    setAnalysisResult(null);
    setShowResults(false);
    setVerificationStatus({});
    toast.dismiss();
    
    try {
      // Combine all valid entries into a single prompt
      const combinedPrompt = validEntries.map((entry, index) => {
        const formattedDate = entry.date.split('-').slice(1).join('/'); // Convert YYYY-MM-DD to MM/DD
        return `Entry ${index + 1} (${formattedDate}, ${entry.meal}, ${entry.brand}):
${entry.prompt}`;
      }).join('\n\n');

      // Combine all images from all entries, filtering out invalid ones
      const allImages = validEntries.reduce((acc: File[], entry) => {
        const validImages = entry.images.filter(img => {
          if (!img || !img.size || img.size === 0) return false;
          if (!img.type || !img.type.startsWith('image/')) return false;
          return true;
        });
        return [...acc, ...validImages];
      }, []);



      // Use the first entry's date and meal, or combine if multiple
      const firstEntry = validEntries[0];
      const hasMultipleMeals = new Set(validEntries.map(e => e.meal)).size > 1;
      const meal = hasMultipleMeals ? 'Mixed' as any : firstEntry.meal;
      
      // Don't override brands - preserve individual brand names from entries



      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timed out after 60 seconds')), 60000)
      );

      const response = await Promise.race([
        analyzeFood({
          prompt: combinedPrompt,
          images: allImages,
          date: firstEntry.date,
          meal: meal,
          brand: 'Multiple Restaurants',
        }) as Promise<any>,
        timeoutPromise
      ]);

      if (!response.success) {
        throw new Error(response.error || 'Analysis failed');
      }

      const { data } = response;
      
      if (data?.needsMoreInfo && data.questions) {
        // AI needs more information
        setQuestions(data.questions);
        toast.error('AI needs more information to provide accurate analysis');
      } else if (data?.items && data.items.length > 0) {
        // Successful analysis - map AI items to entry dates
        const processedItems = data.items.map((item: any, index: number) => {
          // Find which entry this item belongs to based on the AI's analysis
          let targetEntry = validEntries[0]; // Default to first entry
          
          // First try exact date match (most reliable for multi-entry scenarios)
          const dateMatch = validEntries.find(entry => {
            const entryDate = entry.date.split('-').slice(1).join('/'); // Convert to MM/DD
            return item.date === entryDate;
          });
          
          if (dateMatch) {
            targetEntry = dateMatch;
          } else {
            // Try to match by brand name
            const brandMatch = validEntries.find(entry => 
              item.brand && (
                entry.brand.toLowerCase().includes(item.brand.toLowerCase()) ||
                item.brand.toLowerCase().includes(entry.brand.toLowerCase())
              )
            );
            
            if (brandMatch) {
              targetEntry = brandMatch;
            } else {
              // Try to match by meal
              const mealMatch = validEntries.find(entry => 
                entry.meal.toLowerCase() === item.meal?.toLowerCase()
              );
              
              if (mealMatch) {
                targetEntry = mealMatch;
              } else {
                // Fall back to round-robin for unmatched items
                const entryIndex = index % validEntries.length;
                targetEntry = validEntries[entryIndex];
              }
            }
          }
          
          // Use the matched entry's values
          return {
            ...item,
            date: targetEntry.date.split('-').slice(1).join('/'),
            meal: targetEntry.meal,
            brand: targetEntry.brand
          };
        });

        const analysisData = {
          date: validEntries.length === 1 
            ? firstEntry.date.split('-').slice(1).join('/') // Single entry: use its date
            : 'Multiple Dates', // Multiple entries: indicate mixed dates
          meal: meal,
          items: processedItems, // Use processed items with correct entry data
          plainText: data.plainText || '',
          // Store individual entry info for proper date handling
          entryDates: validEntries.map(entry => ({
            date: entry.date.split('-').slice(1).join('/'),
            meal: entry.meal,
            brand: entry.brand
          }))
        };
        
        setAnalysisResult(analysisData);
        setShowResults(true);
        toast.success(`Analysis complete! Found ${data.items.length} food item(s) from ${validEntries.length} entry/entries`);
      } else {
        throw new Error('No food items could be identified');
      }
      
    } catch (error) {
      console.error('Analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      toast.error(errorMessage);
      setQuestions([`Sorry, there was an error: ${errorMessage}. Please try again with more details.`]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [validEntries, isFormValid]);

  const handleLogFood = useCallback(async () => {
    if (!analysisResult) return;

    setIsLogging(true);
    toast.dismiss();
    
    try {
      const result = await logFoodToBackend(analysisResult, logWater);
      
      if (result.success) {
        toast.success('Food logged successfully!');
        
        // Set verification status
        if (result.verification && Object.keys(result.verification).length > 0) {
          setVerificationStatus(result.verification);
        } else if (result.output && result.output.includes('Logging item')) {
          // Parse verification from HTML output if structured data not available
          const parsedVerification = parseVerificationFromHTML(result.output);
          setVerificationStatus(parsedVerification);
        }
        
        if (logWater) {
          toast.success('💧 Water intake also logged');
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Logging failed:', error);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to log food';
      
      if (error instanceof Error) {
        if (error.message.includes('Cannot connect to API server') || 
            error.message.includes('Failed to fetch') || 
            error.message.includes('CORS')) {
          errorMessage = 'API server is not running. Please start the Flask API server.';
        } else if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
          errorMessage = 'API server is not responding. Check server status.';
        } else if (error.message.includes('API error')) {
          errorMessage = `API Error: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLogging(false);
    }
  }, [analysisResult, logWater]);

  // Register loadSampleDataFunction with context for navbar access
  useEffect(() => {
    setLoadSampleData(loadSampleDataFunction);
  }, [setLoadSampleData, loadSampleDataFunction]);

  const handleClear = useCallback(() => {
    setFoodEntries([{
      id: '1',
      date: getLocalDateString(new Date()),
      meal: 'Breakfast',
      brand: '',
      prompt: '',
      images: [],
    }]);
    setLogWater(false);
    setQuestions([]);
    setAnalysisResult(null);
    setShowResults(false);
    setVerificationStatus({});
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

  const handleAnswerQuestions = useCallback(() => {
    // Clear questions and re-analyze with the updated prompt
    setQuestions([]);
    handleAnalyze();
  }, [handleAnalyze]);

  const formatForChatGPT = useCallback((result: any) => {
    if (!result?.items) return '';
    
    const formattedItems = result.items.map((item: FoodItem) => {
      // Use the processed item data directly - it already has correct date/meal/brand
      const itemDate = item.date;
      const itemMeal = item.meal;
      
      // Format serving size exactly like your old site
      const servingSize = item.serving.descriptor 
        ? `${item.serving.amount} ${item.serving.unit} (${item.serving.descriptor})`
        : `${item.serving.amount} ${item.serving.unit}`;

      const lines = [
        `Food Name: ${item.foodName}`,
        `Date: ${itemDate}`,
        `Meal: ${itemMeal}`,
        `Brand: ${item.brand}`,
        `Icon: ${item.icon}`,
        `Serving Size: ${servingSize}`,
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
      
      // Add hydration for drinks - this is what your backend expects for fluid ounces
      if (item.hydration?.isLiquid && (item.hydration.fluidOz || 0) > 0) {
        lines.push(`Hydration: ${item.hydration.fluidOz} fluid ounces`);
      }
      
      return lines.join('\n');
    });
    
    return formattedItems.join('\n\n');
  }, []);

  // Parse verification data from HTML output
  const parseVerificationFromHTML = useCallback((htmlOutput: string) => {
    const verification: {[itemIndex: number]: any} = {};
    
    // Parse the HTML output to extract verification data
    // This is a fallback when the backend doesn't return structured verification
    const lines = htmlOutput.split('<br>');
    let currentItemIndex = -1;
    
    lines.forEach(line => {
      if (line.includes('Logging item')) {
        const match = line.match(/Logging item (\d+) of (\d+):/);
        if (match) {
          currentItemIndex = parseInt(match[1]) - 1; // Convert to 0-based index
          
          // Check if there are error indicators for this item in subsequent lines
          const hasError = lines.some(errorLine => 
            errorLine.includes('Error') || 
            errorLine.includes('Failed') ||
            errorLine.includes('element click intercepted') ||
            errorLine.includes('Traceback') ||
            errorLine.includes('Exception')
          );
          
          verification[currentItemIndex] = {
            foodName: { verified: !hasError, matches: !hasError },
            brand: { verified: !hasError, matches: !hasError },
            icon: { verified: !hasError, matches: !hasError },
            serving: { verified: !hasError, matches: !hasError },
            calories: { verified: !hasError, matches: !hasError },
            fatG: { verified: !hasError, matches: !hasError },
            satFatG: { verified: !hasError, matches: !hasError },
            cholesterolMg: { verified: !hasError, matches: !hasError },
            sodiumMg: { verified: !hasError, matches: !hasError },
            carbsG: { verified: !hasError, matches: !hasError },
            fiberG: { verified: !hasError, matches: !hasError },
            sugarG: { verified: !hasError, matches: !hasError },
            proteinG: { verified: !hasError, matches: !hasError },
            allFieldsMatch: !hasError,
            verificationComplete: true
          };
        }
      }
    });
    
    return verification;
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
          <ChefHat className="w-6 h-6 text-primary" />
          AI Food Analysis
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          Upload food photos for AI-powered nutritional analysis and automatic logging
        </p>
      </div>

      {/* Food Entry Cards */}
      <div className="space-y-4">
        {foodEntries.map((entry, index) => (
          <FoodEntryCardComponent
            key={entry.id}
            entry={entry}
            index={index}
            canRemove={foodEntries.length > 1}
            onUpdate={updateFoodEntry}
            onRemove={removeFoodEntry}
            onImagesChange={handleImagesChange}
            onAdd={addFoodEntry}
            isAnalyzing={isAnalyzing}
            isLogging={isLogging}
            isLastCard={index === foodEntries.length - 1}
            validEntries={validEntries}
            isFormValid={isFormValid}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
          />
        ))}
      </div>

      {/* Log Water Row */}
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
        
        {/* Cost Estimate - moved to bottom right */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <DollarSign className="w-4 h-4" />
          Estimated cost: ${estimatedCost.toFixed(4)}
        </div>
      </div>

      {/* Questions from AI */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              AI Needs More Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="space-y-2">
                {questions.map((question, index) => (
                  <p key={index} className="text-orange-800 dark:text-orange-200">
                    • {question}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please update your description above with more details, then try again.
              </p>
              <Button
                onClick={handleAnswerQuestions}
                disabled={isAnalyzing || !isFormValid}
                isLoading={isAnalyzing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {showResults && analysisResult && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                Analysis Results
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(formatForChatGPT(analysisResult))}
                  className="text-sm"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Results
                </Button>
                <Button
                  onClick={handleLogFood}
                  disabled={isLogging}
                  isLoading={isLogging}
                  size="sm"
                  className="text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {isLogging ? 'Logging... (up to 15 min)' : 'Log to Lose It!'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Food Items */}
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
              {analysisResult.items?.map((item: FoodItem, index: number) => (
                <FoodItemCard 
                  key={index} 
                  item={item} 
                  verificationStatus={verificationStatus[index]}
                  isLogging={isLogging}
                />
              ))}
            </div>

                    {/* Date Information */}
        {analysisResult.entryDates && analysisResult.entryDates.length > 1 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Multiple Dates Detected</span>
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              {analysisResult.entryDates.map((entry: any, index: number) => (
                <div key={index}>
                  • {entry.meal}: {entry.date} ({entry.brand})
                </div>
              ))}
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
              Note: Items will be mapped to their corresponding entry dates based on order. Verify the dates are correct before logging.
            </p>
          </div>
        )}


          </CardContent>
        </Card>
      )}


    </div>
  );
};

// ── Food Item Display Component ─────────────────────────────────────

interface FoodItemCardProps {
  item: FoodItem;
  verificationStatus?: any;
  isLogging: boolean;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, verificationStatus, isLogging }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
      {/* Header with Food Name, Date, Meal, and Food Type */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-base truncate">{item.foodName}</h4>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {item.date || 'N/A'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.meal}
            </span>
            <span>{item.brand}</span>
          </div>
        </div>
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full whitespace-nowrap">
          {item.icon}
        </span>
      </div>
      
      {/* Serving Size */}
      <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
        {item.serving.amount} {item.serving.unit} {item.serving.descriptor && `(${item.serving.descriptor})`}
      </div>
      
      {/* Calories prominently displayed */}
      <div className="text-center mb-3">
        <div className="text-4xl font-bold text-gray-900 dark:text-white">{item.calories}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Calories</div>
      </div>
      
      {/* Compact nutrition grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Fat:</span>
          <span className="font-medium text-gray-900 dark:text-white">{item.fatG}g</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Carbs:</span>
          <span className="font-medium text-gray-900 dark:text-white">{item.carbsG}g</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Sat Fat:</span>
          <span className="font-medium text-gray-900 dark:text-white">{item.satFatG}g</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Fiber:</span>
          <span className="font-medium text-gray-900 dark:text-white">{item.fiberG}g</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Cholesterol:</span>
          <span className="font-medium text-gray-900 dark:text-white">{item.cholesterolMg}mg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Sugar:</span>
          <span className="font-medium text-gray-900 dark:text-white">{item.sugarG}g</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Sodium:</span>
          <span className="font-medium text-gray-900 dark:text-white">{item.sodiumMg}mg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Protein:</span>
          <span className="font-medium text-gray-900 dark:text-white">{item.proteinG}g</span>
        </div>
      </div>
      
      {/* Hydration - Only show for liquids */}
      {item.hydration?.isLiquid && (item.hydration.fluidOz || 0) > 0 && (
        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Hydration:</span>
            <span className="font-medium text-gray-900 dark:text-white">{item.hydration.fluidOz || 0} fl oz</span>
          </div>
        </div>
      )}
      
      {/* Verification Status */}
      {isLogging && (
        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
            Verifying... (up to 15 min)
          </div>
        </div>
      )}
      
      {verificationStatus && verificationStatus.verificationComplete && (
        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs">
            {verificationStatus.allFieldsMatch ? (
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-3 h-3" />
                All fields verified ✓
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-3 h-3" />
                Verification issues detected ✗
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Food Entry Card Component ───────────────────────────────────────

interface FoodEntryCardProps {
  entry: FoodEntryCard;
  index: number;
  canRemove: boolean;
  onUpdate: (id: string, field: keyof FoodEntryCard, value: any) => void;
  onRemove: (id: string) => void;
  onImagesChange: (id: string, images: File[]) => void;
  onAdd: () => void;
  isAnalyzing: boolean;
  isLogging: boolean;
  isLastCard: boolean;
  validEntries: FoodEntryCard[];
  isFormValid: boolean;
  onAnalyze: () => void;
  onClear: () => void;
}

const FoodEntryCardComponent: React.FC<FoodEntryCardProps> = ({ 
  entry, 
  index, 
  canRemove, 
  onUpdate, 
  onRemove, 
  onImagesChange,
  onAdd,
  isAnalyzing,
  isLogging,
  isLastCard,
  validEntries,
  isFormValid,
  onAnalyze,
  onClear
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Food Entry #{index + 1}
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              onClick={onAdd}
              variant="outline"
              size="sm"
              disabled={isAnalyzing || isLogging}
              className="text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Another Food Item
            </Button>
            {canRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(entry.id)}
                className="text-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Fields Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Date *"
            type="date"
            value={entry.date}
            onChange={(e) => onUpdate(entry.id, 'date', e.target.value)}
            required
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Meal *
            </label>
            <select
              value={entry.meal}
              onChange={(e) => onUpdate(entry.id, 'meal', e.target.value as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              required
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snacks">Snacks</option>
            </select>
          </div>
          <Input
            label="Brand/Restaurant *"
            placeholder="e.g., McDonald's, Starbucks"
            value={entry.brand}
            onChange={(e) => onUpdate(entry.id, 'brand', e.target.value)}
            required
          />
        </div>

        {/* What did you eat */}
        <Textarea
          label="What did you eat? *"
          placeholder="Describe your food in detail, including portions, preparation, and any sides or drinks..."
          value={entry.prompt}
          onChange={(e) => onUpdate(entry.id, 'prompt', e.target.value)}
          rows={4}
          helperText="Be as specific as possible for accurate nutritional analysis"
          required
        />

        {/* Photo Upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Photos (optional)
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const clipboardItems = await navigator.clipboard.read();
                  
                  for (const clipboardItem of clipboardItems) {
                    for (const type of clipboardItem.types) {
                      if (type.startsWith('image/')) {
                        const blob = await clipboardItem.getType(type);
                        const file = new File([blob], `clipboard-image-${Date.now()}.png`, { type });
                        
                        if (entry.images.length < 5) {
                          onImagesChange(entry.id, [...entry.images, file]);
                          toast.success('Image pasted from clipboard!');
                          return;
                        } else {
                          toast.error('Maximum 5 images allowed');
                          return;
                        }
                      }
                    }
                  }
                  
                  toast.error('No images found in clipboard');
                } catch (error) {
                  toast.error('Failed to paste from clipboard. Please try copying the image again.');
                }
              }}
              disabled={isAnalyzing || isLogging || entry.images.length >= 5}
              className="text-xs"
            >
              <Clipboard className="w-3 h-3 mr-1" />
              Paste
            </Button>
          </div>
          <ImageUpload
            onImagesChange={(images) => onImagesChange(entry.id, images)}
            images={entry.images}
            maxImages={5}
            maxSizeBytes={10 * 1024 * 1024}
            disabled={isAnalyzing || isLogging}
          />
        </div>

        {/* Entry Status and Analysis Controls for the last card */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {/* Status on the left */}
            <div className="flex items-center gap-4 text-sm">
              <div className={`flex items-center gap-2 ${
                entry.date && entry.meal && entry.brand && entry.prompt 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                <CheckCircle className="w-4 h-4" />
                {entry.date && entry.meal && entry.brand && entry.prompt ? 'Ready to analyze' : 'Incomplete'}
              </div>
              {entry.images.length > 0 && (
                <div className="text-blue-600 dark:text-blue-400">
                  📷 {entry.images.length} photo{entry.images.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Analysis Controls on the right for the last card */}
            {isLastCard && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onClear}
                  disabled={isAnalyzing || isLogging}
                >
                  Clear All
                </Button>
                <Button
                  onClick={onAnalyze}
                  disabled={!isFormValid || isAnalyzing || isLogging}
                  isLoading={isAnalyzing}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  {isAnalyzing ? 'Analyzing...' : `Analyze ${validEntries.length} Item${validEntries.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FoodLogPage;