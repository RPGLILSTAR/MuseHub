import axios from 'axios';
import { getAuthToken } from '@/store/authStore';

const api = axios.create({ baseURL: '/api/recommend', timeout: 30000 });
api.interceptors.request.use((c) => {
  const t = getAuthToken();
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const unwrap = (r: any) => r.data?.data !== undefined ? r.data.data : r.data;

export interface RecommendItem {
  itemId: string;
  itemType: 'movie' | 'book' | 'music';
  score: number;
  reasons: string[];
  method: string;
  title?: string;
  cover?: string;
  genres?: string[];
  breakdown?: { userCF: number; itemCF: number; content: number };
  methodCount?: number;
}

export const recommendApi = {
  getMovies: (limit = 20) => api.get('/movies', { params: { limit } }).then(r => unwrap(r)) as Promise<RecommendItem[]>,
  getBooks: (limit = 20) => api.get('/books', { params: { limit } }).then(r => unwrap(r)) as Promise<RecommendItem[]>,
  getMusic: (limit = 30) => api.get('/music', { params: { limit } }).then(r => unwrap(r)) as Promise<RecommendItem[]>,
  getCross: (source: string, target: string, limit = 10) => api.get('/cross', { params: { source, target, limit } }).then(r => unwrap(r)) as Promise<RecommendItem[]>,
  getPopular: (type: string, limit = 20) => api.get(`/popular/${type}`, { params: { limit } }).then(r => unwrap(r)) as Promise<RecommendItem[]>,
  getSimilarItems: (type: string, id: string, limit = 10) => api.get(`/similar-items/${type}/${id}`, { params: { limit } }).then(r => unwrap(r)),
  getAdminStats: () => api.get('/admin/stats').then(r => unwrap(r)),
  evaluate: (type: string) => api.get(`/admin/evaluate/${type}`).then(r => unwrap(r)),
  setWeights: (weights: { userCF: number; itemCF: number; content: number }) => api.put('/admin/weights', weights).then(r => unwrap(r)),
  getUserProfile: (userId: number, type: string) => api.get(`/admin/user-profile/${userId}/${type}`).then(r => unwrap(r)),
  seedData: () => api.post('/admin/seed', {}, { timeout: 60000 }).then(r => unwrap(r)),
  clearSeed: () => api.post('/admin/clear-seed').then(r => unwrap(r)),
};
