import axios from 'axios';
import type {
  Movie, MovieDetail, Book,
  PaginatedResponse,
} from '@/types';
import { getAuthToken } from '@/store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

async function get<T>(url: string, params?: Record<string, any>): Promise<T> {
  try {
    const resp = await api.get(url, { params });
    const body = resp.data;
    console.log(`[API OK] ${url}`, body?.success, Array.isArray(body?.data) ? `items:${body.data.length}` : '');
    if (body && body.data !== undefined) {
      return body.data as T;
    }
    return body as T;
  } catch (err: any) {
    console.error(`[API FAIL] ${url}`, err.response?.status, err.message);
    throw err;
  }
}

export const movieApi = {
  getPopular: (page = 1) =>
    get<PaginatedResponse<Movie>>('/movies/popular', { page }),
  getTrending: (time: 'day' | 'week' = 'week') =>
    get<Movie[]>('/movies/trending', { time }),
  getTopRated: (page = 1) =>
    get<PaginatedResponse<Movie>>('/movies/top-rated', { page }),
  getNowPlaying: (page = 1) =>
    get<PaginatedResponse<Movie>>('/movies/now-playing', { page }),
  getDetail: (id: number) =>
    get<MovieDetail>(`/movies/${id}`),
  search: (q: string, page = 1) =>
    get<PaginatedResponse<Movie>>('/movies/search', { q, page }),
  getGenres: () =>
    get<{ id: number; name: string }[]>('/movies/genres'),
};

export const bookApi = {
  getPopular: (page = 1, category = 'fiction') =>
    get<PaginatedResponse<Book>>('/books/popular', { page, category }),
  getDetail: (id: string) =>
    get<Book>(`/books/${id}`),
  search: (q: string, page = 1) =>
    get<PaginatedResponse<Book>>('/books/search', { q, page }),
  getByCategory: (category: string, page = 1) =>
    get<PaginatedResponse<Book>>(`/books/category/${category}`, { page }),
  getNewReleases: (page = 1) =>
    get<PaginatedResponse<Book>>('/books/new-releases', { page }),
};
