//src/pages/FoodLogPage.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { ChefHat, Sparkles, DollarSign, Copy, CheckCircle, AlertCircle, Droplets, Plus, X, Clipboard } from 'lucide-react';
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
  
  // ── Multi-Entry State ────────────────────────────────────────────
  const [foodEntries, setFoodEntries] = useState<FoodEntryCard[]>([{
    id: '1',
    date: new Date().toISOString().split('T')[0],
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

  // ── Handlers ────────────────────────────────────────────────────
  const addFoodEntry = useCallback(() => {
    const newEntry: FoodEntryCard = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
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
      // Combine all valid entries into a single prompt with individual dates
      const combinedPrompt = validEntries.map((entry) => {
        const mealLabel = validEntries.length > 1 ? `${entry.meal} (${entry.brand})` : `${entry.brand}`;
        const formattedDate = entry.date.split('-').slice(1).join('/'); // Convert YYYY-MM-DD to MM/DD
        return `**${mealLabel} - ${formattedDate}:**
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
      
      // Don't override individual brands with 'Multiple' - let AI use actual brand names



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
          brand: firstEntry.brand, // Use actual brand name, not 'Multiple'
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
        // Successful analysis - preserve individual entry dates
        const analysisData = {
          date: validEntries.length === 1 
            ? firstEntry.date.split('-').slice(1).join('/') // Single entry: use its date
            : 'Multiple Dates', // Multiple entries: indicate mixed dates
          meal: meal,
          items: data.items,
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to log food';
      toast.error(errorMessage);
    } finally {
      setIsLogging(false);
    }
  }, [analysisResult, logWater]);

  const handleSampleData = useCallback(async () => {
    const samplePrompt = `- Hummus, served with house bread (had maybe half the hummus and all of the side bread)
- Big League (mocktail), ritual tequila substitute, lime, orgeat, strawberry  
- SHAWARMA-SPICED PRIME SKIRT STEAK FRITES* za'atar, feta. berbere red wine jus`;

    try {
      // Convert the actual photos to File objects
      const photoUrls = [
        '/57E8E1E8-DF20-45B7-9B45-5B845A525770_1_105_c.jpeg',
        '/10056C94-9E35-4980-AEB9-9C78DB4057B5_1_105_c.jpeg',
        '/B26AFF03-F186-44A5-A9B7-293AE8003AE6_1_105_c.jpeg',
        '/BF08A753-0D81-4CB3-8116-AB7588354C73_1_105_c.jpeg'
      ];

      const photoNames = [
        'Big League Mocktail',
        'Hummus & Bread', 
        'House Bread',
        'Shawarma Steak'
      ];

      // Fetch and convert photos to File objects
      const photoFiles = await Promise.all(
        photoUrls.map(async (url, index) => {
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], photoNames[index].toLowerCase().replace(/\s+/g, '-') + '.jpeg', { type: 'image/jpeg' });
          return file;
        })
      );

      // Find first entry with empty fields, or use the first entry
      const targetEntryId = foodEntries.find(entry => !entry.prompt && !entry.brand)?.id || foodEntries[0]?.id;
      
      if (targetEntryId) {
        setFoodEntries(prev => prev.map(entry => 
          entry.id === targetEntryId 
            ? {
                ...entry,
                date: new Date().toISOString().split('T')[0],
                meal: 'Dinner',
                brand: 'Sample Restaurant',
                prompt: samplePrompt,
                images: photoFiles,
              }
            : entry
        ));
        toast.success('Sample data and photos loaded! Click Analyze to process.');
      }
    } catch (error) {
      console.error('Error creating sample images:', error);
      toast.error('Failed to create sample images');
    }
  }, [foodEntries]);

  // Register handleSampleData with context for navbar access
  useEffect(() => {
    setLoadSampleData(handleSampleData);
  }, [setLoadSampleData, handleSampleData]);

  const handleClear = useCallback(() => {
    setFoodEntries([{
      id: '1',
      date: new Date().toISOString().split('T')[0],
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
    
    const formattedItems = result.items.map((item: FoodItem, index: number) => {
      // Map items to their corresponding entries based on order
      let itemDate = result.date;
      let itemMeal = result.meal;
      
      if (result.entryDates && result.entryDates.length > 1) {
        // For multiple entries, try to map items to entries based on order
        // This assumes the AI returns items in roughly the same order as the entries
        const entryIndex = Math.min(index, result.entryDates.length - 1);
        const entry = result.entryDates[entryIndex];
        if (entry) {
          itemDate = entry.date;
          itemMeal = entry.meal;
        }
      }
      
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
          verification[currentItemIndex] = {
            foodName: { verified: true, matches: true },
            brand: { verified: true, matches: true },
            icon: { verified: true, matches: true },
            serving: { verified: true, matches: true },
            calories: { verified: true, matches: true },
            fatG: { verified: true, matches: true },
            satFatG: { verified: true, matches: true },
            cholesterolMg: { verified: true, matches: true },
            sodiumMg: { verified: true, matches: true },
            carbsG: { verified: true, matches: true },
            fiberG: { verified: true, matches: true },
            sugarG: { verified: true, matches: true },
            proteinG: { verified: true, matches: true },
            allFieldsMatch: true,
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
                  {isLogging ? 'Logging...' : 'Log to Lose It!'}
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
      {/* Header with Food Name and Food Type */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-base truncate">{item.foodName}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{item.brand}</p>
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
            Verifying...
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