import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 与下方 persist 的 name 一致；用于在 rehydrate 完成前同步读出 token，避免首屏 API 未带登录态 */
export const AUTH_PERSIST_KEY = 'musehub-auth';

export function getAuthToken(): string | null {
  const mem = useAuthStore.getState().token;
  if (mem) return mem;
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    const t = parsed?.state?.token;
    return typeof t === 'string' && t.length > 0 ? t : null;
  } catch {
    return null;
  }
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  bio: string;
  role: 'user' | 'admin';
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (partial) => set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
      logout: () => set({ token: null, user: null }),
      isLoggedIn: () => !!get().token,
      isAdmin: () => get().user?.role === 'admin',
    }),
    { name: AUTH_PERSIST_KEY }
  )
);
