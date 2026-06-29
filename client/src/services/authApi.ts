import axios from 'axios';
import { getAuthToken, useAuthStore } from '@/store/authStore';

const api = axios.create({ baseURL: '/api/auth', timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
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

export const authApi = {
  register: (username: string, email: string, password: string) =>
    api.post('/register', { username, email, password }).then(r => r.data),
  login: (account: string, password: string) =>
    api.post('/login', { account, password }).then(r => r.data),
  getMe: () =>
    api.get('/me').then(r => r.data),
  updateProfile: (data: { username?: string; bio?: string; email?: string }) =>
    api.put('/me', data).then(r => r.data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/me/password', { oldPassword, newPassword }).then(r => r.data),
};
