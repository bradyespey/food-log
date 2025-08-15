import axios from 'axios';
import type { 
  AnalysisRequest, 
  AnalysisResponse, 
  LogRequest, 
  LogResponse,
  ApiError 
} from '../types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.theespeys.com';
const API_USERNAME = import.meta.env.VITE_API_USERNAME || '';
const API_PASSWORD = import.meta.env.VITE_API_PASSWORD || '';

// Create axios instance with basic auth
const api = axios.create({
  baseURL: API_BASE_URL,
  auth: {
    username: API_USERNAME,
    password: API_PASSWORD,
  },
  timeout: 300000, // 5 minutes for food logging operations
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    const apiError: ApiError = {
      message: error.response?.data?.error || error.message || 'An unexpected error occurred',
      status: error.response?.status,
    };
    
    return Promise.reject(apiError);
  }
);

// Image compression utility
function compressImage(file: File, maxWidth: number = 1280, quality: number = 0.85): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/webp',
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// API Functions
export const foodLogApi = {
  /**
   * Analyze food using AI
   */
  async analyzeFood(request: AnalysisRequest): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('prompt', request.prompt);
    formData.append('date', request.date);
    formData.append('meal', request.meal);
    formData.append('model', request.model || 'gpt-4o-mini');
    
    // Compress and add images
    if (request.images && request.images.length > 0) {
      for (const image of request.images.slice(0, 5)) { // Limit to 5 images
        try {
          const compressedImage = await compressImage(image);
          formData.append('images[]', compressedImage, image.name);
        } catch (error) {
          console.warn('Failed to compress image:', error);
          formData.append('images[]', image);
        }
      }
    }
    
    const response = await api.post<AnalysisResponse>('/food_log/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  /**
   * Log food to Lose It!
   */
  async logFood(request: LogRequest): Promise<LogResponse> {
    const response = await api.post<LogResponse>('/food_log', request, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.data;
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await api.get('/health');
    return response.data;
  },

  /**
   * Estimate API cost
   */
  estimateCost(prompt: string, imageCount: number, model: string = 'gpt-4o-mini'): number {
    // Rough cost estimation (very approximate)
    const basePromptCost = 0.001; // Base cost for prompt
    const imageCost = imageCount * 0.002; // Rough cost per image
    const modelMultiplier = model === 'gpt-4o' ? 5 : 1; // gpt-4o is more expensive
    
    return (basePromptCost + imageCost) * modelMultiplier;
  },
};

export default api;
