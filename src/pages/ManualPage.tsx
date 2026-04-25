import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { CheckCircle, Droplets, Copy, PenTool, FileText, Timer } from 'lucide-react';
import { logFoodToBackend } from '../lib/api';
import { toast, Toaster } from 'react-hot-toast';
import { useSampleData } from '../App';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLoseIt } from '../contexts/LoseItContext';
import { toastOptions } from '../components/ui/toastOptions';

const FOOD_KEYS = [
  'Food Name',
  'Date',
  'Meal',
  'Brand',
  'Icon',
  'Serving Size',
  'Calories',
  'Fat (g)',
  'Saturated Fat (g)',
  'Cholesterol (mg)',
  'Sodium (mg)',
  'Carbs (g)',
  'Fiber (g)',
  'Sugar (g)',
  'Protein (g)',
] as const;

const KEY_REGEX = new RegExp(
  `(${FOOD_KEYS.map((k) => k.replace(/[()]/g, '\\$&')).join('|')}):\\s*`,
  'gi'
);

const CANONICAL_KEY_MAP: Record<string, (typeof FOOD_KEYS)[number]> = Object.fromEntries(
  FOOD_KEYS.map((k) => [k.toLowerCase(), k])
) as Record<string, (typeof FOOD_KEYS)[number]>;

function toCanonicalKey(matched: string): (typeof FOOD_KEYS)[number] {
  return CANONICAL_KEY_MAP[matched.toLowerCase()] ?? (matched as (typeof FOOD_KEYS)[number]);
}

function normalizeServingSizeValue(val: string): string {
  return val
    .replace(/\s*\(\s*fluid\s+ounces\s*\)/gi, ' fluid ounces')
    .replace(/\s*\(\s*ounces\s*\)/gi, ' ounces')
    .trim();
}

function parseParagraphItem(paragraph: string): string {
  const pairs: { key: (typeof FOOD_KEYS)[number]; value: string }[] = [];
  let lastIndex = 0;
  let lastKey: (typeof FOOD_KEYS)[number] | null = null;
  const matches = [...paragraph.matchAll(KEY_REGEX)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const key = toCanonicalKey(m[1]);
    const keyStart = m.index!;
    if (lastKey) {
      const value = paragraph.slice(lastIndex, keyStart).trim();
      pairs.push({ key: lastKey, value });
    }
    lastKey = key;
    lastIndex = keyStart + m[0].length;
  }
  if (lastKey) {
    const value = paragraph.slice(lastIndex).trim();
    pairs.push({ key: lastKey, value });
  }
  return pairs
    .map(({ key, value }) => {
      const v = key === 'Serving Size' ? normalizeServingSizeValue(value) : value;
      return `${key}: ${v}`;
    })
    .join('\n');
}

function isLineBasedFormat(block: string): boolean {
  return /\n\s*Date:\s*/i.test(block) || (block.includes('Food Name:') && block.includes('\n') && block.trim().split('\n').length >= 3);
}

function parsePastedFoodText(raw: string): string[] {
  const normalized = raw
    .replace(/\s*\(\s*fluid\s+ounces\s*\)/gi, ' fluid ounces')
    .replace(/\s*\(\s*ounces\s*\)/gi, ' ounces');
  const byDoubleNewline = normalized
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.includes('Food Name:'));
  if (byDoubleNewline.length > 1) {
    return byDoubleNewline.map((block) =>
      isLineBasedFormat(block) ? block : parseParagraphItem(block)
    );
  }
  const singleBlock = normalized.trim();
  if (!singleBlock.includes('Food Name:')) return [];
  const byFoodName = singleBlock.split(/(?=\s*Food Name:)/i).map((s) => s.trim()).filter(Boolean);
  return byFoodName.map((block) =>
    isLineBasedFormat(block) ? block : parseParagraphItem(block)
  );
}

export default function ManualPage() {
  const [isLogging, setIsLogging] = useState(false);
  const [logResult, setLogResult] = useState('');
  const [foodText, setFoodText] = useState('');
  const { session } = useAuth();
  const navigate = useNavigate();
  const { setStatus: setLoseItStatus, openSettings } = useLoseIt();
  const [logWater, setLogWater] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('foodlog-logwater');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Sample data context
  const { setLoadSampleData, setClearData } = useSampleData();

  // Sample data loading function for Manual page
  const loadSampleDataFunction = useCallback(() => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    // Helper function to get local date string
    const getLocalDateString = (date: Date): string => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}/${day}`;
    };

    const sampleData = `Food Name: Test Hummus w/ House Bread
Date: ${getLocalDateString(today)}
Meal: Dinner
Brand: Sample Restaurant
Icon: Dip, Green
Serving Size: 4.5 ounces
Calories: 300
Fat (g): 15
Saturated Fat (g): 2
Cholesterol (mg): 0
Sodium (mg): 400
Carbs (g): 35
Fiber (g): 5
Sugar (g): 2
Protein (g): 8

Food Name: Test Big League Mocktail
Date: ${getLocalDateString(today)}
Meal: Dinner
Brand: Sample Restaurant
Icon: Mixed Drink
Serving Size: 12.33 fluid ounces
Calories: 150
Fat (g): 0
Saturated Fat (g): 0
Cholesterol (mg): 0
Sodium (mg): 10
Carbs (g): 38
Fiber (g): 0
Sugar (g): 30
Protein (g): 0

Food Name: Test Shawarma-Spiced Prime Skirt Steak Frites
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

Food Name: Test Bro Smoothie
Date: ${getLocalDateString(twoDaysAgo)}
Meal: Lunch
Brand: Sample Smoothie Shop
Icon: Smoothie
Serving Size: 12.33 fluid ounces
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
    if (!session?.isAuthenticated) {
      toast.error('Please sign in to log food');
      navigate('/login');
      return;
    }

    if (!foodText.trim()) {
      toast.error('Please paste food items to log');
      return;
    }

    setIsLogging(true);
    setLogResult('');
    toast.dismiss();
    
    try {
      const foodItems = parsePastedFoodText(foodText);

      if (foodItems.length === 0) {
        toast.error('No food items found. Please paste in the correct format.');
        return;
      }

      // Send data in the exact same format as your old LoseIt app
      const result = await logFoodToBackend({ 
        food_items: foodItems,
        log_water: logWater 
      }, logWater);
      
      if (result.errorCode === 'loseit_session_expired' || result.errorCode === 'loseit_not_configured') {
        setLoseItStatus('expired');
        toast.error(result.message, { duration: 8000 });
        openSettings();
        return;
      }

      if (result.success) {
        setLoseItStatus('ok');
        let successMessage = `✅ ${result.message}\n\n`;
        
        // Add each food item with its date
        foodItems.forEach((item, index) => {
          const lines = item.split('\n');
          const foodName = lines.find(line => line.startsWith('Food Name:'))?.replace('Food Name:', '').trim() || `Item ${index + 1}`;
          const date = lines.find(line => line.startsWith('Date:'))?.replace('Date:', '').trim() || 'Unknown Date';
          successMessage += `• ${foodName} (${date})\n`;
        });
        
        successMessage += `\n${result.output || ''}`;
        setLogResult(successMessage);
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
  }, [foodText, logWater, navigate, openSettings, session?.isAuthenticated, setLoseItStatus]);

  const handleClear = useCallback(() => {
    setFoodText('');
    setLogResult('');
    toast.success('Cleared all data');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Register clear function with context for navbar access
  useEffect(() => {
    setClearData(handleClear);
  }, [setClearData, handleClear]);



  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  const parsedItems = foodText ? parsePastedFoodText(foodText) : [];

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 pb-10">
      <Toaster 
        position="top-center" 
        toastOptions={toastOptions}
      />

      {/* Page Header */}
      <div className="surface rounded-lg p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Structured text logging</p>
            <h1 className="font-display mt-1 flex items-center gap-3 text-3xl leading-tight text-foreground sm:text-4xl">
              <PenTool className="w-7 h-7 text-primary" />
              Manual Food Log
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[240px]">
            <div className="rounded-lg border border-border bg-card/70 p-3">
              <div className="text-lg font-semibold text-foreground">{parsedItems.length}</div>
              <div className="text-xs text-muted-foreground">Items</div>
            </div>
            <div className="rounded-lg border border-border bg-card/70 p-3">
              <div className="text-lg font-semibold text-foreground">{logWater ? 'On' : 'Off'}</div>
              <div className="text-xs text-muted-foreground">Water</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main Input Card - Simple like your old LoseIt app */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Paste and review</p>
                <CardTitle className="mt-1 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Food Log Text
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main textarea - like your old LoseIt app */}
            <Textarea
              placeholder="Paste your food log text here...

Line format (one field per line):
Food Name: Cafe Vanilla Coffee
Date: 08/17
Meal: Breakfast
Brand: Keurig
Icon: Coffee
Serving Size: 8 fluid ounces
Calories: 60
...

Paragraph format (e.g. from Gemini) also works:
Food Name: Peppermint Mocha Date: 01/28 Meal: Snack Brand: Starbucks Icon: Hot Coffee Serving Size: 12 (fluid ounces) Calories: 260 ...

Separate multiple items with blank lines."
              value={foodText}
              onChange={(e) => setFoodText(e.target.value)}
              rows={18}
              className="min-h-[420px] resize-y font-mono text-sm"
            />

            {foodText && (
              <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
                {parsedItems.length} food item{parsedItems.length !== 1 ? 's' : ''} ready to log
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Current Run</p>
              <CardTitle className="mt-1 flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                Log Food
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border border-border bg-secondary/50 p-3">
                  <div className="text-xl font-semibold text-foreground">{parsedItems.length}</div>
                  <div className="text-xs text-muted-foreground">Parsed</div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/50 p-3">
                  <div className="text-xl font-semibold text-foreground">{logResult ? 'Done' : 'Open'}</div>
                  <div className="text-xs text-muted-foreground">Status</div>
                </div>
              </div>

              <label htmlFor="manualLogWater" className="flex items-center justify-between rounded-lg border border-border bg-card/70 p-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  Log Water
                </span>
                <input
                  type="checkbox"
                  id="manualLogWater"
                  checked={logWater}
                  onChange={(e) => setLogWater(e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                />
              </label>

              <Button
                onClick={handleLogFood}
                disabled={!foodText.trim() || isLogging || !session?.isAuthenticated}
                isLoading={isLogging}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="w-full"
              >
                {isLogging ? 'Logging...' : !session?.isAuthenticated ? 'Sign in to Log' : 'Log Food'}
              </Button>

              {foodText && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(foodText)}
                  leftIcon={<Copy className="w-4 h-4" />}
                  className="w-full"
                >
                  Copy Text
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {foodText && (
        <div className="lg:hidden">
          <Button
            onClick={handleLogFood}
            disabled={!foodText.trim() || isLogging || !session?.isAuthenticated}
            isLoading={isLogging}
            leftIcon={<CheckCircle className="w-4 h-4" />}
            className="w-full"
          >
            {isLogging ? 'Logging...' : !session?.isAuthenticated ? 'Sign in to Log' : 'Log Food'}
          </Button>
        </div>
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
              className="space-y-2 whitespace-pre-wrap text-sm text-foreground"
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
