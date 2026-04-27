export interface SharedSampleFoodEntry {
  dateOffsetDays: number;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  brand: string;
  prompt: string;
  imageNames: string[];
}

export const SAMPLE_FOOD_ENTRIES: SharedSampleFoodEntry[] = [
  {
    dateOffsetDays: 0,
    meal: 'Dinner',
    brand: 'Sample Restaurant',
    prompt: '- Hummus, served with house bread (had maybe half the hummus and all of the side bread)\n- Big League (mocktail), ritual tequila substitute, lime, orgeat, strawberry\n- SHAWARMA-SPICED PRIME SKIRT STEAK FRITES* za\'atar, feta, berbere red wine jus',
    imageNames: [
      'big-league-mocktail.jpeg',
      'hummus-and-bread.jpeg',
      'house-bread.jpeg',
      'shawarma-steak-frites.jpeg',
    ],
  },
  {
    dateOffsetDays: -2,
    meal: 'Lunch',
    brand: 'Sample Smoothie Shop',
    prompt: '"Bro" smoothie with a blend of banana, peanut butter, protein powder, almond milk, 12 1/3 fl oz',
    imageNames: ['bro-smoothie.jpeg'],
  },
];
