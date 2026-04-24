import type { Handler } from '@netlify/functions'
import OpenAI from 'openai'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

// JSON schema for structured output — mirrors FoodItem fields expected by openai.ts analyzeFood()
const FOOD_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    entry_id:        { type: 'string' },
    food_name:       { type: 'string' },
    date:            { type: 'string' },
    meal:            { type: 'string' },
    brand:           { type: 'string' },
    icon:            { type: 'string' },
    serving_amount:  { type: 'number' },
    serving_unit:    { type: 'string' },
    calories:        { type: 'number' },
    fat_g:           { type: 'number' },
    saturated_fat_g: { type: 'number' },
    cholesterol_mg:  { type: 'number' },
    sodium_mg:       { type: 'number' },
    carbs_g:         { type: 'number' },
    fiber_g:         { type: 'number' },
    sugar_g:         { type: 'number' },
    protein_g:       { type: 'number' },
  },
  required: [
    'entry_id', 'food_name', 'date', 'meal', 'brand', 'icon',
    'serving_amount', 'serving_unit', 'calories', 'fat_g',
    'saturated_fat_g', 'cholesterol_mg', 'sodium_mg', 'carbs_g',
    'fiber_g', 'sugar_g', 'protein_g',
  ],
  additionalProperties: false,
} as const

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'OPENAI_API_KEY not configured on server' }),
    }
  }

  let body: { systemPrompt?: string; prompt?: string; images?: string[] }
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: 'Invalid JSON' }) }
  }

  const { systemPrompt = '', prompt = '', images = [] } = body
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [{ type: 'text', text: prompt }]
  for (const img of images) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/webp;base64,${img}`, detail: 'high' },
    })
  }

  const openai = new OpenAI({ apiKey })

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'food_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              items: { type: 'array', items: FOOD_ITEM_SCHEMA },
            },
            required: ['items'],
            additionalProperties: false,
          },
        },
      },
      max_tokens: 4096,
    })

    const content = completion.choices[0].message.content || '{}'
    const parsed = JSON.parse(content) as { items: unknown[] }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, data: { items: parsed.items ?? [], plainText: '' } }),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('OpenAI error:', msg)
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: msg }),
    }
  }
}
