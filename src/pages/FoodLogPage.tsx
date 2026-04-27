//src/pages/FoodLogPage.tsx

import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { ChefHat, Sparkles, Copy, CheckCircle, AlertCircle, Droplets, X, Clipboard, Calendar, Clock, Edit2, Save, XCircle, Trash2, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import ImageUpload from '../components/ui/ImageUpload';
import { analyzeFood, estimateCost, ICON_OPTIONS, SERVING_UNIT_OPTIONS } from '../lib/openai';
import { logFoodToBackend } from '../lib/api';
import type { FoodItem, FoodEntryCard } from '../types';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { useSampleData } from '../App';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLoseIt } from '../contexts/LoseItContext';
import { toastOptions } from '../components/ui/toastOptions';
import { SAMPLE_FOOD_ENTRIES } from '../../shared/sampleFoodEntries';

const parseVerificationFromHTML = (htmlOutput: string) => {
  const verification: {[itemIndex: number]: any} = {};
  const lines = htmlOutput.split('<br>');

  lines.forEach(line => {
    if (!line.includes('Logging item')) return;

    const match = line.match(/Logging item (\d+) of (\d+):/);
    if (!match) return;

    const currentItemIndex = parseInt(match[1]) - 1;
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
      verificationComplete: true,
    };
  });

  return verification;
};

const FoodLogPage: React.FC = () => {
  const { setLoadSampleData, setClearData } = useSampleData();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { setStatus: setLoseItStatus, openSettings } = useLoseIt();
  
  // Helper function to get local date string (not UTC)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ── Multi-Entry State ────────────────────────────────────────────
  const [foodEntries, setFoodEntries] = useState<FoodEntryCard[]>([
    {
      id: '1',
      date: getLocalDateString(new Date()),
      meal: 'Breakfast',
      brand: '',
      prompt: '',
      images: [],
    },
    {
      id: '2',
      date: getLocalDateString(new Date()),
      meal: 'Breakfast',
      brand: '',
      prompt: '',
      images: [],
    }
  ]);
  
  const [logWater, setLogWater] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('foodlog-logwater');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Save logWater state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('foodlog-logwater', JSON.stringify(logWater));
    }
  }, [logWater]);

  // ── UI State ────────────────────────────────────────────────────
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<{[itemIndex: number]: any}>({});
  
  // Editing state for analysis results
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editedAnalysisResult, setEditedAnalysisResult] = useState<any>(null);
  
  // Ref for auto-scrolling to analysis results
  const analysisResultsRef = useRef<HTMLDivElement>(null);
  const foodEntriesRef = useRef(foodEntries);
  foodEntriesRef.current = foodEntries;

  // ── Computed Values ─────────────────────────────────────────────
  const validEntries = foodEntries.filter(entry => 
    entry.date && entry.meal && entry.brand && entry.prompt
  );
  const totalImages = foodEntries.reduce((sum, entry) => sum + entry.images.length, 0);
  const totalPromptLength = foodEntries.reduce((sum, entry) => sum + entry.prompt.length, 0);
  const estimatedCost = estimateCost('', totalImages) + (totalPromptLength / 1000) * 0.001;
  const isFormValid = validEntries.length > 0;
  const currentAnalysisResult = editedAnalysisResult || analysisResult;
  const analyzedItemCount = currentAnalysisResult?.items?.length || 0;
  const verifiedItemCount = Object.values(verificationStatus).filter((item: any) =>
    item?.verificationComplete && item?.verificationLevel !== 'failed' && item?.allFieldsMatch !== false
  ).length;

  // ── Sample Data Loading ──────────────────────────────────────────
  const loadSampleDataFunction = useCallback(async () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const sampleDates = { 0: today, [-2]: twoDaysAgo };
    const sampleData = SAMPLE_FOOD_ENTRIES.map((sample) => {
      const date = sampleDates[sample.dateOffsetDays as keyof typeof sampleDates] ?? today;
      return {
        date: getLocalDateString(date),
        meal: sample.meal,
        brand: sample.brand,
        prompt: sample.prompt,
        images: sample.imageNames.map((imageName) =>
          fetch(`/${imageName}`).then(r => r.blob()).then(blob => new File([blob], imageName, { type: 'image/jpeg' }))
        ),
      };
    });

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
    // Get the date from the last entry, or use today's date if no entries exist
    const lastEntryDate = foodEntries.length > 0 
      ? foodEntries[foodEntries.length - 1].date 
      : getLocalDateString(new Date());
    
    const newEntry: FoodEntryCard = {
      id: Date.now().toString(),
      date: lastEntryDate, // Inherit date from previous entry
      meal: 'Breakfast',
      brand: '',
      prompt: '',
      images: [],
    };
    setFoodEntries(prev => [...prev, newEntry]);
    window.setTimeout(() => {
      document.getElementById(`food-entry-${newEntry.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  }, [foodEntries]);

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

  // Global ⌘V / Ctrl+V: paste image from clipboard into first entry with room (for Mac Photos workflow)
  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        const target = e.target as Node;
        if (target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target as HTMLElement).isContentEditable)) return;
        try {
          const clipboardItems = await navigator.clipboard.read();
          for (const item of clipboardItems) {
            for (const type of item.types) {
              if (type.startsWith('image/')) {
                const blob = await item.getType(type);
                const file = new File([blob], `pasted-${Date.now()}.png`, { type });
                e.preventDefault();
                const entries = foodEntriesRef.current;
                const entry = entries.find((ent) => ent.images.length < 5);
                if (!entry) {
                  toast.error('Maximum 5 images per entry');
                  return;
                }
                setFoodEntries((prev) =>
                  prev.map((ent) =>
                    ent.id === entry.id ? { ...ent, images: [...ent.images, file] } : ent
                  )
                );
                toast.success('Image pasted');
                return;
              }
            }
          }
        } catch {
          // No clipboard access or no image; let default paste happen
        }
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

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
EntryID: ${entry.id}
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
          
          // First: if we have EntryID, use it (most reliable when dates/brands overlap)
          const entryIdMatch = item.entryId
            ? validEntries.find((e) => e.id === String(item.entryId))
            : undefined;
          if (entryIdMatch) {
            targetEntry = entryIdMatch;
          } else {
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
        setEditedAnalysisResult(null); // Reset edited state on new analysis
        setEditingItemIndex(null); // Reset editing state
        setShowResults(true);
        toast.success(`Analysis complete! Found ${data.items.length} food item(s) from ${validEntries.length} entry/entries`);
        
        // Auto-scroll to analysis results
        setTimeout(() => {
          analysisResultsRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
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

  // ── Analysis Result Editing Handlers ───────────────────────────────
  const handleEditItem = useCallback((index: number, updatedItem: FoodItem) => {
    const currentResult = editedAnalysisResult || analysisResult;
    if (!currentResult?.items) return;
    
    const updatedItems = [...currentResult.items];
    updatedItems[index] = updatedItem;
    
    const updatedResult = {
      ...currentResult,
      items: updatedItems
    };
    
    setEditedAnalysisResult(updatedResult);
  }, [analysisResult, editedAnalysisResult]);

  const handleDeleteItem = useCallback((index: number) => {
    const currentResult = editedAnalysisResult || analysisResult;
    if (!currentResult?.items) return;
    
    const updatedItems = currentResult.items.filter((_: any, i: number) => i !== index);
    
    const updatedResult = {
      ...currentResult,
      items: updatedItems
    };
    
    setEditedAnalysisResult(updatedResult);
    
    // Clear editing state if we deleted the item being edited
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
    } else if (editingItemIndex !== null && editingItemIndex > index) {
      // Adjust editing index if we deleted an item before the one being edited
      setEditingItemIndex(editingItemIndex - 1);
    }
  }, [analysisResult, editedAnalysisResult, editingItemIndex]);

  const handleMultiplyItem = useCallback((index: number, multiplier: number) => {
    const currentResult = editedAnalysisResult || analysisResult;
    if (!currentResult?.items) return;
    
    const item = currentResult.items[index];
    if (!item) return;
    
    const multipliedItem = {
      ...item,
      calories: Math.round(item.calories * multiplier),
      fatG: Math.round(item.fatG * multiplier * 10) / 10,
      satFatG: Math.round(item.satFatG * multiplier * 10) / 10,
      cholesterolMg: Math.round(item.cholesterolMg * multiplier),
      sodiumMg: Math.round(item.sodiumMg * multiplier),
      carbsG: Math.round(item.carbsG * multiplier * 10) / 10,
      fiberG: Math.round(item.fiberG * multiplier * 10) / 10,
      sugarG: Math.round(item.sugarG * multiplier * 10) / 10,
      proteinG: Math.round(item.proteinG * multiplier * 10) / 10,
      // Don't multiply serving size, only nutrition values
    };
    
    handleEditItem(index, multipliedItem);
    toast.success(`Nutrition values multiplied by ${multiplier}x`);
  }, [analysisResult, editedAnalysisResult, handleEditItem]);

  const handleToggleEdit = useCallback((index: number) => {
    setEditingItemIndex(editingItemIndex === index ? null : index);
  }, [editingItemIndex]);

  const handleClear = useCallback(() => {
    setFoodEntries([
      {
        id: Date.now().toString(),
        date: getLocalDateString(new Date()),
        meal: 'Breakfast',
        brand: '',
        prompt: '',
        images: [],
      },
      {
        id: (Date.now() + 1).toString(),
        date: getLocalDateString(new Date()),
        meal: 'Breakfast',
        brand: '',
        prompt: '',
        images: [],
      }
    ]);
    setAnalysisResult(null);
    setEditedAnalysisResult(null);
    setShowResults(false);
    setQuestions([]);
    setVerificationStatus({});
    setEditingItemIndex(null);
    toast.success('Cleared all data');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLogFood = useCallback(async () => {
    if (!session?.isAuthenticated) {
      toast.error('Please sign in to log food to Lose It!');
      navigate('/login');
      return;
    }

    const currentResult = editedAnalysisResult || analysisResult;
    if (!currentResult) return;

    setIsLogging(true);
    toast.dismiss();
    
    try {
      const result = await logFoodToBackend(currentResult, logWater);

      // Auth failures: mark expired and prompt to update cookie
      if (result.errorCode === 'loseit_session_expired' || result.errorCode === 'loseit_not_configured') {
        setLoseItStatus('expired');
        toast.error(result.message, { duration: 8000 });
        openSettings();
        return;
      }

      if (result.success) {
        setLoseItStatus('ok');
        toast.success('Food logged successfully!');

        if (result.verification && Object.keys(result.verification).length > 0) {
          setVerificationStatus(result.verification);
        } else if (result.output && result.output.includes('Logging item')) {
          const parsedVerification = parseVerificationFromHTML(result.output);
          setVerificationStatus(parsedVerification);
        }

        if (logWater) {
          toast.success('💧 Water intake also logged');
        }
      } else {
        if (result.verification && Object.keys(result.verification).length > 0) {
          setVerificationStatus(result.verification);
        }
        throw new Error(result.output ? `${result.message}\n\n${result.output}` : result.message);
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
  }, [
    editedAnalysisResult,
    analysisResult,
    logWater,
    navigate,
    openSettings,
    session?.isAuthenticated,
    setLoseItStatus,
  ]);

  // Register shell actions and run controls with context for navbar access
  const { setAddFoodEntry, setRunControls } = useSampleData();
  useEffect(() => {
    setLoadSampleData(loadSampleDataFunction);
    setClearData(handleClear);
    setAddFoodEntry(addFoodEntry);
  }, [setLoadSampleData, setClearData, setAddFoodEntry, loadSampleDataFunction, handleClear, addFoodEntry]);

  useEffect(() => {
    setRunControls({
      readyCount: validEntries.length,
      photoCount: totalImages,
      resultCount: analyzedItemCount,
      verifiedCount: verifiedItemCount,
      estimatedCost,
      logWater,
      setLogWater,
      analyzeLabel: isAnalyzing ? 'Analyzing...' : `Analyze ${validEntries.length}`,
      logLabel: !session?.isAuthenticated ? 'Sign in to Log' : isLogging ? 'Logging...' : 'Log to Lose It!',
      canAnalyze: isFormValid && !isAnalyzing && !isLogging,
      canLog: Boolean(session?.isAuthenticated) && !isLogging,
      isAnalyzing,
      isLogging,
      showLogButton: Boolean(showResults && currentAnalysisResult),
      nextAction: showResults && currentAnalysisResult ? 'log' : 'analyze',
      onAnalyze: handleAnalyze,
      onLog: handleLogFood,
    });

    return () => setRunControls(null);
  }, [
    analyzedItemCount,
    currentAnalysisResult,
    estimatedCost,
    handleAnalyze,
    handleLogFood,
    isAnalyzing,
    isFormValid,
    isLogging,
    logWater,
    session?.isAuthenticated,
    setRunControls,
    showResults,
    totalImages,
    validEntries.length,
    verifiedItemCount,
  ]);

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
    const currentResult = result || editedAnalysisResult || analysisResult;
    if (!currentResult?.items) return '';
    
    const formattedItems = currentResult.items.map((item: FoodItem) => {
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
  }, [editedAnalysisResult, analysisResult]);

  const runStats = [
    ['Cards', foodEntries.length],
    ['Ready', validEntries.length],
    ['Photos', totalImages],
    ['Results', analyzedItemCount],
    ['Verified', verifiedItemCount],
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-24 lg:pb-6">
      <Toaster 
        position="top-center" 
        toastOptions={toastOptions}
      />
      
      {/* Page Header */}
      <div className="surface rounded-lg p-4 sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_auto] xl:items-start">
          <div className="min-w-0">
            <h1 className="font-display flex items-center gap-3 text-3xl leading-tight text-foreground sm:text-4xl">
              <ChefHat className="w-7 h-7 text-primary" />
              AI Food Analysis
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Current Run
              </span>
              {runStats.map(([label, value]) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{value}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden items-center gap-3 rounded-full border border-border bg-card/50 px-3 py-2 text-xs text-muted-foreground md:inline-flex lg:hidden">
            <label htmlFor="headerLogWater" className="inline-flex cursor-pointer items-center gap-2 font-semibold text-foreground">
              <input
                id="headerLogWater"
                type="checkbox"
                checked={logWater}
                onChange={(event) => setLogWater(event.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <Droplets className="h-4 w-4 text-accent" />
              Water
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-5">

      {/* Food Entry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {foodEntries.map((entry, index) => (
          <div key={entry.id} id={`food-entry-${entry.id}`} className="scroll-mt-24">
            <FoodEntryCardComponent
              entry={entry}
              index={index}
              canRemove={foodEntries.length > 1}
              onUpdate={updateFoodEntry}
              onRemove={removeFoodEntry}
              onImagesChange={handleImagesChange}
              isAnalyzing={isAnalyzing}
              isLogging={isLogging}
            />
          </div>
        ))}
      </div>

      {/* Questions from AI */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-accent" />
              AI Needs More Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-accent/25 bg-accent/10 p-4">
              <div className="space-y-2">
                {questions.map((question, index) => (
                  <p key={index} className="text-sm text-foreground">
                    • {question}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
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
        <div ref={analysisResultsRef}>
          <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Review before logging</p>
                <CardTitle className="mt-1 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Analysis Results
                </CardTitle>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {editedAnalysisResult && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditedAnalysisResult(null);
                      setEditingItemIndex(null);
                      toast.success('Reverted to original analysis');
                    }}
                    size="sm"
                    className="text-sm text-accent hover:text-accent"
                  >
                    Reset All Edits
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(formatForChatGPT(editedAnalysisResult || analysisResult))}
                  className="text-sm"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Results
                </Button>
                {!session?.isAuthenticated && (
                  <div className="flex items-center gap-1 rounded-lg border border-accent/25 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                    <AlertCircle className="w-3 h-3" />
                    Sign in required to log food
                  </div>
                )}
                <Button
                  onClick={handleLogFood}
                  disabled={isLogging || !session?.isAuthenticated}
                  isLoading={isLogging}
                  size="sm"
                  className={`text-sm ${!session?.isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={!session?.isAuthenticated ? 'Please sign in to log food to Lose It!' : ''}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {isLogging ? 'Logging...' : !session?.isAuthenticated ? 'Sign in to Log' : 'Log to Lose It!'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Food Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
              {currentAnalysisResult.items?.map((item: FoodItem, index: number) => {
                const originalItem = analysisResult.items[index];
                return (
                  <FoodItemCard 
                    key={index} 
                    item={item}
                    originalItem={originalItem}
                    verificationStatus={verificationStatus[index]}
                    isLogging={isLogging}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                    onMultiply={handleMultiplyItem}
                    index={index}
                    isEditing={editingItemIndex === index}
                    onToggleEdit={handleToggleEdit}
                  />
                );
              })}
            </div>

                    {/* Date Information */}
        {analysisResult.entryDates && analysisResult.entryDates.length > 1 && (
          <div className="rounded-lg border border-accent/25 bg-accent/10 p-4">
            <div className="flex items-center gap-2 text-accent mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Multiple Dates Detected</span>
            </div>
            <div className="text-sm text-foreground space-y-1">
              {analysisResult.entryDates.map((entry: any, index: number) => (
                <div key={index}>
                  • {entry.meal}: {entry.date} ({entry.brand})
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Items will be mapped to their corresponding entry dates based on order. Verify the dates are correct before logging.
            </p>
          </div>
        )}


          </CardContent>
        </Card>
        </div>
      )}


        </div>
      </div>

      <div className="mobile-safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={!isFormValid || isAnalyzing || isLogging}
            isLoading={isAnalyzing}
            leftIcon={<Sparkles className="w-4 h-4" />}
            className="flex-1"
          >
            {isAnalyzing ? 'Analyzing...' : `Analyze ${validEntries.length}`}
          </Button>
          {showResults && currentAnalysisResult && (
            <Button
              onClick={handleLogFood}
              disabled={isLogging || !session?.isAuthenticated}
              isLoading={isLogging}
              variant="secondary"
              className="flex-1"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {session?.isAuthenticated ? 'Log' : 'Sign In'}
            </Button>
          )}
        </div>
      </div>

    </div>
  );
};

// ── Food Item Display Component ─────────────────────────────────────

interface FoodItemCardProps {
  item: FoodItem;
  originalItem?: FoodItem;
  verificationStatus?: any;
  isLogging: boolean;
  onEdit?: (index: number, updatedItem: FoodItem) => void;
  onDelete?: (index: number) => void;
  onMultiply?: (index: number, multiplier: number) => void;
  index: number;
  isEditing?: boolean;
  onToggleEdit?: (index: number) => void;
}

const FoodItemCard: React.FC<FoodItemCardProps> = memo(({ 
  item, 
  originalItem,
  verificationStatus, 
  isLogging, 
  onEdit, 
  onDelete, 
  onMultiply, 
  index, 
  isEditing, 
  onToggleEdit 
}) => {
  const [editedItem, setEditedItem] = useState<FoodItem>(item);
  
  // Reset edited item when switching edit mode or when item changes
  useEffect(() => {
    setEditedItem(item);
  }, [item, isEditing]);
  
  const handleSave = () => {
    onEdit?.(index, editedItem);
    onToggleEdit?.(index);
    toast.success('Food item updated!');
  };
  
  const handleCancel = () => {
    setEditedItem(item);
    onToggleEdit?.(index);
  };

  const handleReset = () => {
    if (originalItem) {
      setEditedItem(originalItem);
      onEdit?.(index, originalItem);
      toast.success('Item reset to original values');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };
  return (
    <div className={`rounded-lg border border-border bg-card/75 shadow-sm ${isEditing ? 'p-4' : 'p-3'}`}>
      {/* Row 1: Food Name and Action Buttons */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 ${isEditing ? 'mb-3' : 'mb-2'}`}>
        {isEditing ? (
          <>
            <Input
              value={editedItem.foodName}
              onChange={(e) => setEditedItem({...editedItem, foodName: e.target.value})}
              onKeyDown={handleKeyDown}
              className={`flex-1 font-semibold ${isEditing ? 'text-base' : 'text-sm'}`}
              placeholder="Food name"
              tabIndex={1}
            />
            <div className="flex items-center gap-1.5 sm:gap-1">
              {originalItem && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="text-xs px-2 py-1 sm:px-1.5 sm:py-0.5 h-7 sm:h-6 text-accent hover:text-accent"
                  tabIndex={17}
                  title="Reset to original"
                >
                  Reset
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleSave}
                className="text-xs px-2 py-1 sm:px-1.5 sm:py-0.5 h-7 sm:h-6 text-primary hover:text-primary"
                tabIndex={18}
                title="Save changes"
              >
                <Save className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="text-xs px-2 py-1 sm:px-1.5 sm:py-0.5 h-7 sm:h-6 text-destructive hover:text-destructive"
                tabIndex={19}
                title="Cancel editing"
              >
                <XCircle className="w-3 h-3" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <h4 className="min-w-0 text-sm font-semibold text-foreground">{item.foodName}</h4>
            <span className="rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary whitespace-nowrap">
              {item.icon}
            </span>
          </>
        )}
      </div>

      {/* Row 2: Restaurant and Food Type */}
      {isEditing ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs mb-3">
            <Input
              value={editedItem.brand}
              onChange={(e) => setEditedItem({...editedItem, brand: e.target.value})}
              onKeyDown={handleKeyDown}
              placeholder="Restaurant"
              className="flex-1 h-7 text-sm p-1.5"
              tabIndex={2}
            />
            <SearchableSelect
              options={ICON_OPTIONS}
              value={editedItem.icon}
              onChange={(value) => setEditedItem({...editedItem, icon: value})}
              placeholder="Food Type"
              className="w-full sm:w-28"
              onKeyDown={handleKeyDown}
              tabIndex={3}
            />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {item.date || 'N/A'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.meal}
          </span>
          <span className="truncate">{item.brand}</span>
        </div>
      )}

      {/* Action buttons row - only for non-editing mode */}
      {!isEditing && (
        <div className="flex justify-end gap-1.5 mb-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleEdit?.(index)}
            className="text-xs px-2 py-1 h-7"
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete?.(index)}
            className="text-xs px-2 py-1 h-7 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      )}
      
      {/* Row 3: Serving and Calories */}
      {isEditing ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs mb-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm whitespace-nowrap">Serving:</span>
            <Input
              type="number"
              step="0.1"
              value={editedItem.serving.amount}
              onChange={(e) => setEditedItem({
                ...editedItem, 
                serving: {...editedItem.serving, amount: parseFloat(e.target.value) || 1}
              })}
              onKeyDown={handleKeyDown}
              className="w-16 sm:w-12 h-7 text-sm p-1.5"
              placeholder="1"
              tabIndex={4}
            />
            <SearchableSelect
              options={SERVING_UNIT_OPTIONS}
              value={editedItem.serving.unit}
              onChange={(value) => setEditedItem({
                ...editedItem, 
                serving: {...editedItem.serving, unit: value}
              })}
              placeholder="Unit"
              className="flex-1 sm:w-24"
              onKeyDown={handleKeyDown}
              tabIndex={5}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm whitespace-nowrap">Calories:</span>
            <Input
              type="number"
              value={editedItem.calories}
              onChange={(e) => setEditedItem({...editedItem, calories: parseInt(e.target.value) || 0})}
              onKeyDown={handleKeyDown}
              className="w-20 sm:w-16 h-7 text-sm p-1.5 text-center font-semibold"
              tabIndex={8}
            />
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground mb-2">
          {`${item.serving.amount} ${item.serving.unit === 'Fluid Ounce' ? 'fl oz' : item.serving.unit}`}
          <div className="mt-2 rounded-lg border border-border bg-secondary/50 p-3 text-center">
            <div className="font-display text-4xl leading-none text-foreground">{item.calories}</div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">Calories</div>
          </div>
        </div>
      )}

      {/* Custom multiplier - only show when not editing */}
      {!isEditing && (
        <div className="flex flex-wrap justify-center items-center gap-2 mb-3 rounded-lg border border-border bg-secondary/40 p-2">
          <span className="text-xs text-muted-foreground">Multiply by</span>
          <Input
            type="number"
            step="0.1"
            min="-10"
            max="10"
            placeholder="1.5"
            className="w-20 h-7 text-xs text-center p-1"
            onBlur={(e) => {
              const value = parseFloat(e.target.value);
              if (value && value !== 0) {
                onMultiply?.(index, value);
                e.target.value = '';
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = parseFloat((e.target as HTMLInputElement).value);
                if (value && value !== 0) {
                  onMultiply?.(index, value);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMultiply?.(index, 1.5)}
              className="text-xs px-2 py-0 h-6"
            >
              1.5x
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMultiply?.(index, 2)}
              className="text-xs px-2 py-0 h-6"
            >
              2x
            </Button>
          </div>
        </div>
      )}
      
      {/* Row 4: Nutrition Grid - Left column: fat, sat fat, chol, sodium | Right column: carb, fiber, sugar, protein */}
      {/* Tab order: cal(8), fat(9), sat(10), chol(11), sodium(12), carb(13), fiber(14), sugar(15), protein(16) */}
      <div className="flex flex-col sm:flex-row gap-x-4 gap-y-2 sm:gap-y-0 text-xs">
        {/* Left Column: Fat, Sat Fat, Chol, Sodium */}
        <div className={`flex flex-col ${isEditing ? 'gap-y-1.5' : 'gap-y-0.5'} flex-1`}>
        <div className="flex items-center gap-1.5">
          <span className={`text-muted-foreground ${isEditing ? 'w-16 text-sm' : 'w-14 text-xs'}`}>Fat:</span>
          {isEditing ? (
            <Input
              type="number"
              step="0.1"
              value={editedItem.fatG}
              onChange={(e) => setEditedItem({...editedItem, fatG: parseFloat(e.target.value) || 0})}
              onKeyDown={handleKeyDown}
              className="w-16 h-6 text-sm p-1"
              tabIndex={9}
            />
          ) : (
            <span className="font-medium text-foreground">{item.fatG}g</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-muted-foreground ${isEditing ? 'w-16 text-sm' : 'w-14 text-xs'}`}>Sat Fat:</span>
          {isEditing ? (
            <Input
              type="number"
              step="0.1"
              value={editedItem.satFatG}
              onChange={(e) => setEditedItem({...editedItem, satFatG: parseFloat(e.target.value) || 0})}
              onKeyDown={handleKeyDown}
              className="w-16 h-6 text-sm p-1"
              tabIndex={10}
            />
          ) : (
            <span className="font-medium text-foreground">{item.satFatG}g</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-muted-foreground ${isEditing ? 'w-16 text-sm' : 'w-14 text-xs'}`}>Chol:</span>
          {isEditing ? (
            <Input
              type="number"
              value={editedItem.cholesterolMg}
              onChange={(e) => setEditedItem({...editedItem, cholesterolMg: parseInt(e.target.value) || 0})}
              onKeyDown={handleKeyDown}
              className="w-16 h-6 text-sm p-1"
              tabIndex={11}
            />
          ) : (
            <span className="font-medium text-foreground">{item.cholesterolMg}mg</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-muted-foreground ${isEditing ? 'w-16 text-sm' : 'w-14 text-xs'}`}>Sodium:</span>
          {isEditing ? (
            <Input
              type="number"
              value={editedItem.sodiumMg}
              onChange={(e) => setEditedItem({...editedItem, sodiumMg: parseInt(e.target.value) || 0})}
              onKeyDown={handleKeyDown}
              className="w-16 h-6 text-sm p-1"
              tabIndex={12}
            />
          ) : (
            <span className="font-medium text-foreground">{item.sodiumMg.toLocaleString()}mg</span>
          )}
        </div>
        </div>
        {/* Right Column: Carbs, Fiber, Sugar, Protein */}
        <div className={`flex flex-col ${isEditing ? 'gap-y-1.5' : 'gap-y-0.5'} flex-1`}>
          <div className="flex items-center gap-1.5">
            <span className={`text-muted-foreground ${isEditing ? 'w-16 text-sm' : 'w-14 text-xs'}`}>Carbs:</span>
            {isEditing ? (
              <Input
                type="number"
                step="0.1"
                value={editedItem.carbsG}
                onChange={(e) => setEditedItem({...editedItem, carbsG: parseFloat(e.target.value) || 0})}
                onKeyDown={handleKeyDown}
                className="w-16 h-6 text-sm p-1"
                tabIndex={13}
              />
            ) : (
              <span className="font-medium text-foreground">{item.carbsG}g</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-muted-foreground ${isEditing ? 'w-16 text-sm' : 'w-14 text-xs'}`}>Fiber:</span>
            {isEditing ? (
              <Input
                type="number"
                step="0.1"
                value={editedItem.fiberG}
                onChange={(e) => setEditedItem({...editedItem, fiberG: parseFloat(e.target.value) || 0})}
                onKeyDown={handleKeyDown}
                className="w-16 h-6 text-sm p-1"
                tabIndex={14}
              />
            ) : (
              <span className="font-medium text-foreground">{item.fiberG}g</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-muted-foreground ${isEditing ? 'w-16 text-sm' : 'w-14 text-xs'}`}>Sugar:</span>
            {isEditing ? (
              <Input
                type="number"
                step="0.1"
                value={editedItem.sugarG}
                onChange={(e) => setEditedItem({...editedItem, sugarG: parseFloat(e.target.value) || 0})}
                onKeyDown={handleKeyDown}
                className="w-16 h-6 text-sm p-1"
                tabIndex={15}
              />
            ) : (
              <span className="font-medium text-foreground">{item.sugarG}g</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-muted-foreground ${isEditing ? 'w-16 text-sm' : 'w-14 text-xs'}`}>Protein:</span>
            {isEditing ? (
              <Input
                type="number"
                step="0.1"
                value={editedItem.proteinG}
                onChange={(e) => setEditedItem({...editedItem, proteinG: parseFloat(e.target.value) || 0})}
                onKeyDown={handleKeyDown}
                className="w-16 h-6 text-sm p-1"
                tabIndex={16}
              />
            ) : (
              <span className="font-medium text-foreground">{item.proteinG}g</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Hydration - Only show for liquids */}
      {item.hydration?.isLiquid && (item.hydration.fluidOz || 0) > 0 && (
        <div className="pt-2 mt-2 border-t border-border">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Hydration:</span>
            <span className="font-medium text-foreground">{item.hydration.fluidOz || 0} fl oz</span>
          </div>
        </div>
      )}
      
      {/* Verification Status */}
      {isLogging && (
        <div className="pt-3 mt-3 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
            Verifying...
          </div>
        </div>
      )}
      
      {verificationStatus && verificationStatus.verificationComplete && (
        <div className="pt-3 mt-3 border-t border-border">
          <div className="text-xs">
            {(() => {
              const level = verificationStatus.verificationLevel as string | undefined
              if (level === 'verified') return (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <CheckCircle className="w-3 h-3" />
                  All fields verified ✓
                </div>
              )
              if (level === 'mismatch') return (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-accent">
                    <AlertCircle className="w-3 h-3" />
                    Nutrient mismatch detected
                  </div>
                  {Array.isArray(verificationStatus.mismatches) && (
                    <div className="mt-1 text-xs text-accent">
                      {(verificationStatus.mismatches as string[]).map((m, i) => (
                        <div key={i}>{m}</div>
                      ))}
                    </div>
                  )}
                </div>
              )
              if (level === 'accepted') return (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <CheckCircle className="w-3 h-3" />
                  Logged to Lose It! ✓
                </div>
              )
              if (!verificationStatus.allFieldsMatch) return (
                <div className="flex items-center justify-center gap-2 text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  Log failed ✗
                </div>
              )
              return (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <CheckCircle className="w-3 h-3" />
                  Logged to Lose It! ✓
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  );
});

FoodItemCard.displayName = 'FoodItemCard';

// ── Food Entry Card Component ───────────────────────────────────────

interface FoodEntryCardProps {
  entry: FoodEntryCard;
  index: number;
  canRemove: boolean;
  onUpdate: (id: string, field: keyof FoodEntryCard, value: any) => void;
  onRemove: (id: string) => void;
  onImagesChange: (id: string, images: File[]) => void;
  isAnalyzing: boolean;
  isLogging: boolean;
}

const FoodEntryCardComponent: React.FC<FoodEntryCardProps> = ({ 
  entry, 
  index, 
  canRemove, 
  onUpdate, 
  onRemove, 
  onImagesChange, 
  isAnalyzing, 
  isLogging
}) => {
  const isComplete = Boolean(entry.date && entry.meal && entry.brand && entry.prompt);
  const mealOptions: FoodEntryCard['meal'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const brandOptions = ['Homemade'];
  const promptRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Entry {index + 1}</p>
            <CardTitle className="mt-1 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              Food Card
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
              isComplete
                ? 'border-primary/25 bg-primary/10 text-primary'
                : 'border-border bg-secondary text-muted-foreground'
            }`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {isComplete ? 'Ready' : 'Draft'}
            </span>
            {canRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(entry.id)}
                className="px-2"
                title="Remove entry"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Fields Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
          <Input
            label="Date *"
            type="date"
            value={entry.date}
            onChange={(e) => onUpdate(entry.id, 'date', e.target.value)}
            required
          />
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              Meal *
            </label>
            <div className="flex min-h-10 flex-wrap items-center gap-2">
              {mealOptions.map((meal) => (
                <button
                  key={meal}
                  type="button"
                  onClick={() => onUpdate(entry.id, 'meal', meal)}
                  className={`min-h-9 rounded-full border px-4 text-xs font-semibold transition-colors ${
                    entry.meal === meal
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'border-border bg-card/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Brand/Restaurant *
              </label>
              {brandOptions.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => {
                    onUpdate(entry.id, 'brand', brand);
                    requestAnimationFrame(() => promptRef.current?.focus());
                  }}
                  className={`min-h-7 rounded-full border px-3 text-xs font-semibold transition-colors ${
                    entry.brand === brand
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'border-border bg-card/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
            <Input
              placeholder="Restaurant or brand"
              value={entry.brand}
              onChange={(e) => onUpdate(entry.id, 'brand', e.target.value)}
              required
            />
          </div>
        </div>

        {/* What did you eat */}
        <Textarea
          label="What did you eat? *"
          ref={promptRef}
          placeholder="Example: chicken sandwich, fries, ranch, half of the appetizer, 12 oz mocktail..."
          value={entry.prompt}
          onChange={(e) => onUpdate(entry.id, 'prompt', e.target.value)}
          rows={3}
          required
        />

        {/* Photo Upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
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
                } catch {
                  toast.error('Failed to paste from clipboard. Please try copying the image again.');
                }
              }}
              disabled={isAnalyzing || isLogging || entry.images.length >= 5}
              className="text-xs"
              title="Paste image from clipboard (⌘V). From Photos: Copy photo first."
            >
              <Clipboard className="w-3 h-3 mr-1" />
              Paste (⌘V)
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

        {/* Entry Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
          <div className={`flex items-center gap-2 ${
            isComplete ? 'text-primary' : 'text-muted-foreground'
          }`}>
            <CheckCircle className="w-4 h-4" />
            {isComplete ? 'Ready to analyze' : 'Needs restaurant and food details'}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ImageIcon className="w-4 h-4" />
            {entry.images.length} photo{entry.images.length !== 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FoodLogPage;
