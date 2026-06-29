import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  tmdb: {
    apiKey: process.env.TMDB_API_KEY || '',
    baseUrl: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },
  googleBooks: {
    apiKey: process.env.GOOGLE_BOOKS_API_KEY || '',
    baseUrl: process.env.GOOGLE_BOOKS_BASE_URL || 'https://www.googleapis.com/books/v1',
  },
  netease: {
    baseUrl: process.env.NETEASE_API_BASE_URL || 'http://localhost:3002',
  },
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    baseUrl: process.env.AI_BASE_URL || 'https://api.deepseek.com',
    model: process.env.AI_MODEL || 'deepseek-chat',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048', 10),
    dailyLimit: parseInt(process.env.AI_DAILY_LIMIT || '100', 10),
  },
} as const;
