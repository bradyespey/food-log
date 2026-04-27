// Mirrors web src/types/index.ts — keep in sync if fields change.

export type Meal = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export interface FoodItem {
  entryId?: string;
  foodName: string;
  date: string;
  meal: Meal;
  brand: string;
  icon: string;
  serving: {
    amount: number;
    unit: string;
    descriptor?: string;
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
  hydration?: {
    isLiquid: boolean;
    fluidOz?: number;
  };
}

export interface FieldVerificationStatus {
  verified: boolean;
  expected: string | number;
  actual: string | number;
  matches: boolean;
}

export interface ItemVerificationStatus {
  allFieldsMatch: boolean;
  verificationComplete: boolean;
  verificationLevel: 'verified' | 'mismatch' | 'accepted' | 'failed';
  mismatches?: string[];
}

export interface AnalysisState {
  items: FoodItem[];
  originalItems: FoodItem[];
  verification: Record<number, ItemVerificationStatus>;
  isLogging: boolean;
  logged: boolean;
  logWater: boolean;
}
