//src/pages/FoodLogPage.tsx

import React, { useState, useCallback } from 'react';
import { ChefHat, Sparkles, DollarSign, Copy, CheckCircle, AlertCircle, Droplets } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import ImageUpload from '../components/ui/ImageUpload';
import { analyzeFood, estimateCost } from '../lib/openai';
import { logFoodToBackend } from '../lib/api';
import type { FoodItem, FormData } from '../types';

const FoodLogPage: React.FC = () => {
  // ── Form State ──────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    meal: 'Breakfast',
    brand: '',
    prompt: '',
    images: [],
    logWater: false,
  });

  // ── UI State ────────────────────────────────────────────────────
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [logResult, setLogResult] = useState<string>('');

  // ── Computed Values ─────────────────────────────────────────────
  const estimatedCost = estimateCost(formData.prompt, formData.images.length);
  const isFormValid = formData.date && formData.meal && formData.brand && formData.prompt;

  // ── Handlers ────────────────────────────────────────────────────
  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleImagesChange = useCallback((images: File[]) => {
    setFormData(prev => ({ ...prev, images }));
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!isFormValid) return;

    setIsAnalyzing(true);
    setQuestions([]);
    setAnalysisResult(null);
    setShowResults(false);
    toast.dismiss();
    
    try {
      const response = await analyzeFood({
        prompt: formData.prompt,
        images: formData.images,
        date: formData.date,
        meal: formData.meal,
        brand: formData.brand,
      });

      if (!response.success) {
        throw new Error(response.error || 'Analysis failed');
      }

      const { data } = response;
      
      if (data?.needsMoreInfo && data.questions) {
        // AI needs more information
        setQuestions(data.questions);
        toast.error('AI needs more information to provide accurate analysis');
      } else if (data?.items && data.items.length > 0) {
        // Successful analysis
        const analysisData = {
          date: formData.date.split('-').slice(1).join('/'), // Convert YYYY-MM-DD to MM/DD
          meal: formData.meal,
          items: data.items,
          plainText: data.plainText || '',
        };
        
        setAnalysisResult(analysisData);
        setShowResults(true);
        toast.success(`Analysis complete! Found ${data.items.length} food item(s)`);
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
  }, [formData, isFormValid]);

  const handleLogFood = useCallback(async () => {
    if (!analysisResult) return;

    setIsLogging(true);
    setLogResult('');
    toast.dismiss();
    
    try {
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
  }, [analysisResult, formData.logWater]);

  const handleClear = useCallback(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      meal: 'Breakfast',
      brand: '',
      prompt: '',
      images: [],
      logWater: false,
    });
    setQuestions([]);
    setAnalysisResult(null);
    setShowResults(false);
    setLogResult('');
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
          <ChefHat className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          FoodLog AI
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Analyze your food with AI and log it to Lose It! in seconds
        </p>
      </div>

      {/* Main Food Analysis Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Food Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Required Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Date *"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Meal *
              </label>
              <select
                value={formData.meal}
                onChange={(e) => handleInputChange('meal', e.target.value as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')}
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
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              required
            />
          </div>

          {/* What did you eat */}
          <Textarea
            label="What did you eat? *"
            placeholder="Describe your food in detail, including portions, preparation, and any sides or drinks..."
            value={formData.prompt}
            onChange={(e) => handleInputChange('prompt', e.target.value)}
            rows={4}
            helperText="Be as specific as possible for accurate nutritional analysis"
            required
          />

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Photos (optional)
            </label>
            <ImageUpload
              onImagesChange={handleImagesChange}
              images={formData.images}
              maxImages={5}
              maxSizeBytes={10 * 1024 * 1024}
            />
          </div>

          {/* Log Water Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="logWater"
              checked={formData.logWater}
              onChange={(e) => handleInputChange('logWater', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="logWater" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Droplets className="w-4 h-4 text-blue-500" />
              Also log water intake
            </label>
          </div>

          {/* Cost Estimate & Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <DollarSign className="w-4 h-4" />
              Estimated cost: ${estimatedCost.toFixed(4)}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isAnalyzing || isLogging}
              >
                Clear
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={!isFormValid || isAnalyzing || isLogging}
                isLoading={isAnalyzing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Food'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Food Items */}
            <div className="space-y-4">
              {analysisResult.items?.map((item: FoodItem, index: number) => (
                <FoodItemCard key={index} item={item} />
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(JSON.stringify(analysisResult, null, 2))}
                leftIcon={<Copy className="w-4 h-4" />}
              >
                Copy Results
              </Button>
              <Button
                onClick={handleLogFood}
                disabled={isLogging}
                isLoading={isLogging}
                leftIcon={<CheckCircle className="w-4 h-4" />}
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
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {logResult}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ── Food Item Display Component ─────────────────────────────────────

interface FoodItemCardProps {
  item: FoodItem;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({ item }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">{item.foodName}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{item.brand}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {item.serving.amount} {item.serving.unit}
            {item.serving.descriptor && ` (${item.serving.descriptor})`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{item.calories} cal</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Icon: {item.icon}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Fat:</span>
          <span className="ml-1 font-medium">{item.fatG}g</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Sat Fat:</span>
          <span className="ml-1 font-medium">{item.satFatG}g</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Chol:</span>
          <span className="ml-1 font-medium">{item.cholesterolMg}mg</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Sodium:</span>
          <span className="ml-1 font-medium">{item.sodiumMg}mg</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Carbs:</span>
          <span className="ml-1 font-medium">{item.carbsG}g</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Protein:</span>
          <span className="ml-1 font-medium">{item.proteinG}g</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Fiber:</span>
          <span className="ml-1 font-medium">{item.fiberG}g</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Sugar:</span>
          <span className="ml-1 font-medium">{item.sugarG}g</span>
        </div>
        {item.hydration?.isLiquid && (item.hydration.fluidOz || 0) > 0 && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Hydration:</span>
            <span className="ml-1 font-medium">{item.hydration.fluidOz || 0} fl oz</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodLogPage;