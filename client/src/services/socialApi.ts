import axios from 'axios';
import { getAuthToken, useAuthStore } from '@/store/authStore';

const api = axios.create({ baseURL: '/api/social', timeout: 15000 });
api.interceptors.request.use((c) => {
  const t = getAuthToken();
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

const unwrap = (r: any) => r.data?.data !== undefined ? r.data.data : r.data;

export const socialApi = {
  getUserProfile: (id: number) => api.get(`/user/${id}`).then(r => unwrap(r)),
  getUserActivities: (id: number, page = 1) => api.get(`/user/${id}/activities`, { params: { page } }).then(r => r.data),
  toggleFollow: (id: number) => api.post(`/follow/${id}`).then(r => unwrap(r)),
  getFollowers: (id: number) => api.get(`/followers/${id}`).then(r => unwrap(r)),
  getFollowing: (id: number) => api.get(`/following/${id}`).then(r => unwrap(r)),
  getFeed: (page = 1) => api.get('/feed', { params: { page } }).then(r => r.data),
  getAnnualStats: (id: number, year?: number) => api.get(`/user/${id}/stats/annual`, { params: { year } }).then(r => unwrap(r)),
};
