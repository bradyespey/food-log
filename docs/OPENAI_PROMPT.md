# OpenAI Prompt Documentation

This document shows the exact prompt sent to OpenAI for food analysis. You can modify this in `/src/lib/openai.ts` if you want to customize the AI's behavior.

## Current Prompt Template

```text
You are a nutritional analysis expert. Analyze this food and provide nutritional information in the exact format specified.

Context:
Date: {formatted_date}
Meal: {meal}
Brand/Restaurant: {brand}

Food Description: {user_prompt}

IMPORTANT INSTRUCTIONS:
1. **ESTIMATE PORTIONS VISUALLY** - Use the photos to estimate serving sizes. Don't ask for exact measurements.
2. **RESTAURANT STANDARDS** - Use typical restaurant portion sizes when photos don't show clear measurements.
3. **VISUAL ANALYSIS** - Analyze the plate, glass size, and food proportions in the images.
4. **ONLY ASK QUESTIONS** if the description is completely unclear (e.g., "some food" without photos).
5. **PROVIDE ESTIMATES** for:
   - Use visual cues from photos to estimate portion sizes
   - Apply typical restaurant serving standards when photos don't show clear measurements
   - Analyze plate dimensions, glass sizes, and food proportions
   - Make reasonable estimates rather than asking for precision

6. **FORMAT OUTPUT** exactly as specified in the ChatGPT Custom GPT format.

7. **BE CONFIDENT** - Make reasonable estimates rather than asking for precision.

Respond with either:
- Clarifying questions ONLY if description is completely vague with no photos
- Detailed nutritional breakdown with estimated portions based on visual analysis
```

## Key Changes Made

- **Removed overly cautious questioning** for reasonable descriptions
- **Added visual estimation instructions** to use photos for portion sizing
- **Emphasized restaurant standards** for typical serving sizes
- **Made AI more confident** in making reasonable estimates

## Customization

To modify this prompt:

1. Edit `/src/lib/openai.ts`
2. Find the `buildPrompt` function
3. Modify the returned string
4. Restart the development server

## Example Output Format

The AI should now provide nutritional breakdowns like:

```
Food Name: Hummus with House Bread
Date: 08/15
Meal: Dinner
Brand: Aba
Icon: Dip
Serving Size: 2 oz hummus, 2 pieces bread
Calories: 180
Fat (g): 8
Saturated Fat (g): 1
Cholesterol (mg): 0
Sodium (mg): 320
Carbs (g): 22
Fiber (g): 4
Sugar (g): 2
Protein (g): 6
Hydration: 0 fluid ounces
```

Instead of asking for exact measurements.
