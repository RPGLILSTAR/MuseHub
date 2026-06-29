import axios from 'axios';
import { getAuthToken } from '@/store/authStore';

const api = axios.create({ baseURL: '/api/admin', timeout: 15000 });
api.interceptors.request.use((c) => {
  const t = getAuthToken();
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const unwrap = (r: any) => r.data?.data !== undefined ? r.data.data : r.data;

export const adminApi = {
  getDashboard: () => api.get('/dashboard').then(r => unwrap(r)),
  getUsers: (page = 1, q?: string) => api.get('/users', { params: { page, q } }).then(r => r.data),
  setUserRole: (id: number, role: string) => api.put(`/users/${id}/role`, { role }).then(r => r.data),
  toggleDisableUser: (id: number) => api.put(`/users/${id}/disable`).then(r => r.data),
  getReviews: (page = 1, status?: string) => api.get('/reviews', { params: { page, status } }).then(r => r.data),
  setReviewStatus: (id: number, status: string) => api.put(`/reviews/${id}/status`, { status }).then(r => r.data),
  deleteReview: (id: number) => api.delete(`/reviews/${id}`).then(r => r.data),
  getActivities: (page = 1) => api.get('/activities', { params: { page } }).then(r => r.data),
  getAnnouncements: () => api.get('/announcements').then(r => unwrap(r)),
  createAnnouncement: (title: string, content: string) => api.post('/announcements', { title, content }).then(r => unwrap(r)),
  deleteAnnouncement: (id: number) => api.delete(`/announcements/${id}`).then(r => r.data),
};
