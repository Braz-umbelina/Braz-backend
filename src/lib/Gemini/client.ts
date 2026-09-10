import { env } from '../config/env.js';

//GEMINI
import { GoogleGenAI } from '@google/genai';

export const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

//DEEPSEEK
import OpenAI from 'openai';

export const deepSeek = new OpenAI({
  apiKey: env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});
