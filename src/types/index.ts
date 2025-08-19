//src/types/index.ts

// ── User & Session ──────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
}

export interface Session {
  user: User | null;
  isAuthenticated: boolean;
}

// ── Food Analysis ───────────────────────────────────────────────────

export interface FoodItem {
  foodName: string;
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
    multiplier?: number;
    effectiveHydrationOz?: number;
  };
}

export interface FoodAnalysis {
  date: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  items: FoodItem[];
}

// ── API Requests & Responses ──────────────────────────────────────────

export interface AnalysisRequest {
  prompt: string;
  date: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  brand: string;
  images?: File[];
}

export interface AnalysisResponse {
  success: boolean;
  data?: FoodAnalysis;
  questions?: string[];
  error?: string;
  cost?: number;
}

export interface LogRequest {
  foodData: FoodAnalysis;
  logWater?: boolean;
}

export interface LogResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// ── UI State ─────────────────────────────────────────────────────────

export interface UIState {
  isAnalyzing: boolean;
  isLogging: boolean;
  showResults: boolean;
  showQuestions: boolean;
}

export interface FormData {
  date: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  brand: string;
  prompt: string;
  images: File[];
  logWater: boolean;
}

export interface FoodEntryCard {
  id: string;
  date: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  brand: string;
  prompt: string;
  images: File[];
}

// ── Constants ────────────────────────────────────────────────────────

export const NUTRITION_ICONS = [
  'Alcohol', 'Alcohol, White', 'Almond', 'Almond Butter', 'Apple', 'Apple Sauce', 'Apple, Gala', 'Apple, Granny Smith', 'Apple, Honey Crisp', 'Apple, Macintosh', 'Artichoke', 'Asparagus', 'Avocado', 'Bacon', 'Bagel', 'Bagel, Blueberry', 'Bagel, Chocolate Chip', 'Bagel, Sesame', 'Baguette', 'Baked Beans', 'Balsamic Vinaigrette', 'Bamboo', 'Banana', 'Banana Pepper', 'Bar', 'Bean, Black', 'Bean, Green', 'Bean, Red', 'Bean, White', 'Beef', 'Beer', 'BeerDark', 'Beet', 'Bell Pepper, Green', 'Bell Pepper, Red', 'Bell Pepper, Yellow', 'Biscuit', 'Biscuit Cracker', 'Blackberry', 'Blueberry', 'Breadsticks', 'Breakfast', 'Breakfast Sandwich', 'Broccoli', 'Brownie', 'Brussels Sprout', 'Burrito', 'Butter', 'Cabbage', 'Cake', 'CakeDark', 'CakeWhite', 'CakeWhiteDark', 'Calamari', 'Calories', 'Can', 'Candy', 'Candy Bar', 'Carrot', 'Carrots', 'Cashew', 'Casserole', 'Cauliflower', 'Celery', 'Cereal', 'Cereal Bar', 'CerealCheerios', 'CerealCornFlakes', 'CerealFruitLoops', 'Cheese', 'CheeseAmerican', 'CheeseBlue', 'CheeseBrie', 'Cheeseburger', 'Cheesecake', 'CheeseCheddar', 'CheeseGouda', 'CheesePepperjack', 'Cherry', 'CherryMaraschino', 'Chestnut', 'Chicken', 'Chicken Tenders', 'ChickenGrilled', 'ChickenWing', 'Chickpea', 'Chocolate', 'Chocolate Chip', 'Chocolate Chips', 'ChocolateDark', 'Churro', 'Cider', 'Cinnamon Roll', 'Clam', 'Coconut', 'Coffee', 'Coleslaw', 'Com', 'Combread', 'Cookie', 'Cookie, Christmas', 'Cookie, Molasses', 'Cookie, Red Velvet', 'Cookie, Sugar', 'Cottage Cheese', 'Crab', 'Cracker', 'Cranberry', 'Cream', 'Croissant', 'Crouton', 'Crumpet', 'Cucumber', 'Cupcake', 'Cupcake, Carrot', 'Cupcake, Vanilla', 'Curry', 'Date', 'Default', 'Deli Meat', 'Dinner Roll', 'Dip, Green', 'Dip, Red', 'Dish', 'Donut', 'Donut, Chocolate Iced', 'Donut, Strawberry Iced', 'DoubleCheeseburger', 'Dressing, Ranch', 'Dumpling', 'Eclair', 'Egg', 'Egg McMuffin', 'Egg Roll', 'Eggplant', 'Enchilada', 'Falafel', 'Fern', 'Fig', 'Filbert', 'Fish', 'Food, Can', 'Fowl', 'French Fries', 'French Toast', 'Fritter', 'Frosting, Chocolate', 'Frosting, Yellow', 'Fruit Cocktail', 'Fruit Leather', 'FruitCake', 'Game', 'Garlic', 'Gobo Root', 'Gourd', 'Graham Cracker', 'Grain', 'Grapefruit', 'Grapes', 'Grilled Cheese', 'Guava', 'Gummy Bear', 'Hamburger', 'Hamburger Bun', 'Hamburger Patty', 'Hamburger, Double', 'Hash', 'Hazelnut', 'Honey', 'Horseradish', 'Hot Dog', 'Hot Dog Bun', 'Hot Pot', 'Ice Cream', 'Ice Cream Bar', 'Ice Cream Sandwich', 'Ice Cream, Chocolate', 'Ice Cream, Strawberry', 'Iced Coffee', 'Iced Tea', 'Jam', 'Jicama', 'Juice', 'Kale', 'Kebab', 'Ketchup', 'Kiwi', 'Lamb', 'Lasagna', 'Latte', 'Leeks', 'Lemon', 'Lemonade', 'Lime', 'Liquid', 'Lobster', 'Mac And Cheese', 'Macadamia', 'Mango', 'Marshmallow', 'Mayonnaise', 'Meatballs', 'Melon', 'Milk', 'Milk Shake', 'Milk Shake, Chocolate', 'Milk Shake, Strawberry', 'Mixed Drink', 'Mixed Drink, Martini', 'Mixed Nuts', 'Muffin', 'Mushroom', 'Mustard', 'Nigiri Sushi', 'Oatmeal', 'Octopus', 'Oil', 'Okra', 'Olive, Black', 'Olive, Green', 'Omelette', 'Onion', 'Orange', 'Orange Chicken', 'Orange Juice', 'Pancakes', 'Papaya', 'Parfait', 'Parsley', 'Parsnip', 'Pasta', 'Pastry', 'Patty Sandwich', 'Pavlova', 'Peach', 'Peanut', 'Peanut Butter', 'Pear', 'Peas', 'Pecan', 'Peppers', 'Persimmon', 'Pickle', 'Pie', 'Pie, Apple', 'Pill', 'Pine Nut', 'Pineapple', 'Pistachio', 'Pita Sandwich', 'Pizza', 'Plum', 'Pocky', 'Pomegranate', 'Popcom', 'Popsicle', 'Pork', 'Pork Chop', 'Pot Pie', 'Potato', 'Potato Chip', 'Potato Salad', 'Powdered Drink', 'Prawn', 'Pretzel', 'Prune', 'Pudding', 'Pumpkin', 'Quesadilla', 'Quiche', 'Radish', 'Raisin', 'Raspberry', 'Ravioli', 'Recipe', 'Relish', 'Rhubarb', 'Ribs', 'Rice', 'Rice Cake', 'Roll', 'Romaine Lettuce', 'Salad', 'Salad Dressing, Balsamic', 'Salt', 'Sandwich', 'Sauce', 'Sausage', 'Seaweed', 'Seed', 'Shallot', 'Shrimp', 'Smoothie', 'Snack', 'Snap Bean', 'Soft Drink', 'SoftServeChocolate', 'SoftServeSwirl', 'SoftServeVanilla', 'Souffle', 'Soup', 'Sour Cream', 'Soy Nut', 'Soy Sauce', 'Spice, Brown', 'Spice, Green', 'Spice, Red', 'Spice, Yellow', 'Spinach', 'Spring Roll', 'Sprouts', 'Squash', 'Squash, Spaghetti', 'Starfruit', 'Stew, Brown', 'Stew, Yellow', 'Stir Fry', 'Stir Fry Noodles', 'Strawberry', 'Stuffing', 'Sub Sandwich', 'Sugar Cookie', 'Sugar, Brown', 'Sugar, White', 'Sushi', 'Syrup', 'Taco', 'Taro', 'Tater Tots', 'Tea', 'Tempura', 'Toast', 'Toaster Pastry', 'Tofu', 'Tomato', 'Tomato Soup', 'Tortilla', 'Tortilla Chip', 'Tostada', 'Turkey', 'Turnip', 'Turnover', 'Vegetable', 'Waffles', 'Walnut', 'Water', 'Water Chestnut', 'Watermelon', 'White Bread', 'Wine, Red', 'Wine, White', 'Wrap', 'Yam', 'Yogurt', 'Zucchini'
] as const;

export const SERVING_UNITS = [
  // Weight
  'Grams', 'Kilograms', 'Micrograms', 'Milligrams', 'Ounces', 'Pounds',
  // Volume
  'Cups', 'Dessertspoons', 'Fluid Ounce', 'Gallons', 'Imperial Fluid Ounces', 'Imperial Pints', 'Imperial Quarts', 'Liters', 'Metric Cups', 'Milliliters', 'Pints', 'Quarts', 'Tablespoons', 'Teaspoons',
  // Amount
  'Bottle', 'Box', 'Can', 'Container', 'Cube', 'Dry Cup', 'Each', 'Jar', 'Package', 'Piece', 'Pot', 'Pouch', 'Punnet', 'Scoop', 'Serving', 'Slice', 'Stick', 'Tablet'
] as const;