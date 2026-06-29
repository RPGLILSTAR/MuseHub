import axios from 'axios';
import { getAuthToken } from '@/store/authStore';

const api = axios.create({ baseURL: '/api/collection', timeout: 15000 });
api.interceptors.request.use((c) => {
  const t = getAuthToken();
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

async function get<T>(url: string, params?: Record<string, any>): Promise<T> {
  const resp = await api.get(url, { params });
  return resp.data?.data !== undefined ? resp.data.data : resp.data;
}
async function post<T>(url: string, data?: any): Promise<T> {
  const resp = await api.post(url, data);
  return resp.data?.data !== undefined ? resp.data.data : resp.data;
}
async function del<T>(url: string, data?: any): Promise<T> {
  const resp = await api.delete(url, { data });
  return resp.data?.data !== undefined ? resp.data.data : resp.data;
}

export type ItemType = 'book' | 'movie';
export type MarkStatus = 'wish' | 'doing' | 'done';

export interface UserMark {
  itemId: string;
  itemType: ItemType;
  status: MarkStatus;
  rating: number | null;
  tags: string[];
  comment: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserReview {
  id: string;
  itemId: string;
  itemType: ItemType;
  content: string;
  rating: number;
  author: string;
  likeCount: number;
  createdAt: number;
}

export interface UserList {
  id: string;
  name: string;
  description: string;
  itemType: ItemType;
  items: string[];
  coverUrl: string;
  createdAt: number;
  updatedAt: number;
}

export const collectionApi = {
  setMark: (itemType: ItemType, itemId: string, status: MarkStatus, rating?: number, tags?: string[], comment?: string, itemTitle?: string, itemCover?: string, genres?: string[]) =>
    post<UserMark>('/mark', { itemType, itemId, status, rating, tags, comment, itemTitle, itemCover, genres }),
  removeMark: (itemType: ItemType, itemId: string) =>
    del<void>('/mark', { itemType, itemId }),
  getMark: (itemType: ItemType, itemId: string) =>
    get<UserMark | null>(`/mark/${itemType}/${itemId}`),
  getMarks: (itemType: ItemType, status?: MarkStatus) =>
    get<UserMark[]>(`/marks/${itemType}`, status ? { status } : undefined),
  getMarkStats: (itemType: ItemType) =>
    get<Record<MarkStatus, number>>(`/marks/${itemType}/stats`),

  addReview: (itemType: ItemType, itemId: string, content: string, rating: number, author?: string) =>
    post<UserReview>('/reviews', { itemType, itemId, content, rating, author }),
  getReviews: (itemType: ItemType, itemId: string) =>
    get<UserReview[]>(`/reviews/${itemType}/${itemId}`),
  likeReview: (id: string) =>
    post<void>(`/reviews/${id}/like`),
  deleteReview: (id: string) =>
    del<void>(`/reviews/${id}`),

  getLists: (itemType: ItemType) =>
    get<UserList[]>(`/lists/${itemType}`),
  createList: (itemType: ItemType, name: string, description?: string) =>
    post<UserList>('/lists', { itemType, name, description }),
  deleteList: (id: string) =>
    del<void>(`/lists/${id}`),
  getListDetail: (id: string) =>
    get<UserList>(`/lists/detail/${id}`),
  addToList: (listId: string, itemId: string) =>
    post<void>(`/lists/${listId}/add`, { itemId }),
  removeFromList: (listId: string, itemId: string) =>
    post<void>(`/lists/${listId}/remove`, { itemId }),
};
