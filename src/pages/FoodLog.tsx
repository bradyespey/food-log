import React, { useState, useCallback } from 'react';
import { ChefHat, Sparkles, Clock, DollarSign, Copy, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ImageUpload from '../components/ui/ImageUpload';

import { foodLogApi } from '../lib/api';
import type { AnalysisResponse, FoodAnalysis, FoodItem } from '../types';

const FoodLog: React.FC = () => {
  // Form state
  const [prompt, setPrompt] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getMonth() + 1}/${today.getDate()}`;
  });
  const [meal, setMeal] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [logWater, setLogWater] = useState(true);

  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  
  // Analysis results
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Logging results
  const [logResult, setLogResult] = useState<string | null>(null);

  const estimatedCost = foodLogApi.estimateCost(prompt, images.length);

  const handleAnalyze = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please describe what you ate');
      return;
    }

    setIsAnalyzing(true);
    setQuestions([]);
    setShowResults(false);
    setLogResult(null);

    try {
      const result = await foodLogApi.analyzeFood({
        prompt: prompt.trim(),
        date,
        meal,
        images,
        model: 'gpt-4o-mini',
      });

      setAnalysisResult(result);

      if (!result.analysis_complete) {
        if (result.questions && result.questions.length > 0) {
          setQuestions(result.questions);
          toast.error('Please provide additional information');
        } else {
          toast.error(result.error || 'Analysis incomplete. Please provide more details.');
        }
      } else {
        setShowResults(true);
        toast.success('Food analysis complete!');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze food');
    } finally {
      setIsAnalyzing(false);
    }
  }, [prompt, date, meal, images]);

  const handleLogFood = useCallback(async () => {
    if (!analysisResult?.food_data) {
      toast.error('No food data to log');
      return;
    }

    setIsLogging(true);
    setLogResult(null);

    try {
      const result = await foodLogApi.logFood({
        food_data: analysisResult.food_data,
        log_water: logWater,
      });

      setLogResult(result.output);
      toast.success('Food logged successfully!');
    } catch (error: any) {
      console.error('Logging error:', error);
      toast.error(error.message || 'Failed to log food');
    } finally {
      setIsLogging(false);
    }
  }, [analysisResult, logWater]);

  const handleClear = useCallback(() => {
    setPrompt('');
    setMeal('');
    setImages([]);
    setAnalysisResult(null);
    setQuestions([]);
    setShowResults(false);
    setLogResult(null);
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">FoodLog AI</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logWater}
                    onChange={(e) => setLogWater(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
                <span className="text-sm text-gray-700">Log Water</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          
          {/* Analysis Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <span>Analyze Food with AI</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Date and Meal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="MM/DD"
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Meal</label>
                  <select
                    value={meal}
                    onChange={(e) => setMeal(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Select meal...</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>
              </div>

              {/* Food Description */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">What did you eat?</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 resize-none"
                  placeholder="Describe your food... (e.g., 'Two slices of pepperoni pizza from Domino's')"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Photos (optional)</label>
                <ImageUpload
                  images={images}
                  onImagesChange={setImages}
                  maxImages={5}
                  disabled={isAnalyzing}
                />
              </div>

              {/* Cost Estimate */}
              {(prompt.trim() || images.length > 0) && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                  <span>Estimated cost: ${estimatedCost.toFixed(3)}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAnalyze}
                  loading={isAnalyzing}
                  disabled={!prompt.trim()}
                  className="flex-1"
                  size="lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Food'}
                </Button>
                
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="sm:w-auto"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Questions from AI */}
          {questions.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-800 mb-2">
                      Please provide additional information:
                    </h3>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {questions.map((question, index) => (
                        <li key={index}>• {question}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {showResults && analysisResult && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Analysis Results</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(analysisResult.plain_text || '')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Text
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Plain Text Output */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Formatted for Copy/Paste:
                  </h4>
                  <pre className="bg-gray-50 p-4 rounded-lg border text-sm whitespace-pre-wrap font-mono overflow-x-auto">
                    {analysisResult.plain_text}
                  </pre>
                </div>

                {/* Food Items Preview */}
                {analysisResult.food_data && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Nutritional Summary:
                    </h4>
                    <div className="space-y-3">
                      {analysisResult.food_data.items.map((item, index) => (
                        <FoodItemCard key={index} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Log Food Button */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleLogFood}
                    loading={isLogging}
                    variant="success"
                    size="lg"
                    className="w-full"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    {isLogging ? 'Logging to Lose It!...' : 'Log Food to Lose It!'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logging Results */}
          {logResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Logging Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: logResult }}
                />
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
};

interface FoodItemCardProps {
  item: FoodItem;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({ item }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
        <h5 className="font-medium text-gray-900">{item.foodName}</h5>
        <span className="text-sm text-gray-500">{item.brand}</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Serving:</span>
          <div className="font-medium">
            {item.serving.amount} {item.serving.unit}
          </div>
        </div>
        <div>
          <span className="text-gray-600">Calories:</span>
          <div className="font-medium">{item.calories}</div>
        </div>
        <div>
          <span className="text-gray-600">Carbs:</span>
          <div className="font-medium">{item.carbsG}g</div>
        </div>
        <div>
          <span className="text-gray-600">Protein:</span>
          <div className="font-medium">{item.proteinG}g</div>
        </div>
      </div>
    </div>
  );
};

export default FoodLog;
