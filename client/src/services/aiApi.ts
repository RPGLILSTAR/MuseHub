import { getAuthToken, useAuthStore } from '@/store/authStore';
import { useAiChatStore } from '@/store/aiChatStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: '/api/ai', timeout: 15000 });

function handleSessionExpired() {
  useAuthStore.getState().logout();
  useAiChatStore.getState().clearChat();
  useAiChatStore.getState().setLoading(false);
  useAiChatStore.getState().setAbortController(null);
  toast.error('登录已过期，请重新登录');
}

api.interceptors.request.use((c) => {
  const t = getAuthToken();
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      handleSessionExpired();
    }
    return Promise.reject(err);
  }
);

const unwrap = (r: any) => r.data?.data ?? r.data;

async function readResponseError(resp: Response): Promise<string> {
  const contentType = resp.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const body = await resp.json();
      return body?.message || body?.error || body?.data || `HTTP ${resp.status}`;
    }
    const text = (await resp.text()).trim();
    return text || `HTTP ${resp.status}`;
  } catch {
    return `HTTP ${resp.status}`;
  }
}

export const aiApi = {
  getConversations: () => api.get('/conversations').then(r => unwrap(r)),
  getMessages: (convId: string) => api.get(`/conversations/${convId}/messages`).then(r => unwrap(r)),
  deleteConversation: (convId: string) => api.delete(`/conversations/${convId}`).then(r => unwrap(r)),
};

export async function sendChatMessage(message: string) {
  const store = useAiChatStore.getState();
  const token = getAuthToken();

  const userMsg = {
    id: `u-${Date.now()}`,
    role: 'user' as const,
    content: message,
    createdAt: new Date().toISOString(),
  };
  store.addMessage(userMsg);
  store.setLoading(true);

  const assistantMsg = {
    id: `a-${Date.now()}`,
    role: 'assistant' as const,
    content: '',
    createdAt: new Date().toISOString(),
    streaming: true,
  };
  store.addMessage(assistantMsg);

  const abortCtrl = new AbortController();
  store.setAbortController(abortCtrl);

  try {
    const resp = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        conversationId: store.conversationId,
      }),
      signal: abortCtrl.signal,
    });

    if (!resp.ok || !resp.body) {
      if (resp.status === 401) {
        handleSessionExpired();
        return;
      }
      const errorMessage = await readResponseError(resp);
      useAiChatStore.getState().updateLastAssistant(errorMessage);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;

        try {
          const event = JSON.parse(payload);
          switch (event.type) {
            case 'meta': {
              const meta = JSON.parse(event.data);
              if (meta.conversationId) {
                useAiChatStore.getState().setConversationId(meta.conversationId);
              }
              break;
            }
            case 'delta':
              useAiChatStore.getState().updateLastAssistant(event.data);
              break;
            case 'error':
              useAiChatStore.getState().updateLastAssistant(event.data);
              break;
            case 'done':
              break;
          }
        } catch {}
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      useAiChatStore.getState().updateLastAssistant('\n\n*[已停止生成]*');
    } else {
      const message = typeof err?.message === 'string' && err.message.trim()
        ? err.message
        : '网络错误，请稍后再试';
      useAiChatStore.getState().updateLastAssistant(message);
    }
  } finally {
    useAiChatStore.getState().finalizeLastAssistant();
    useAiChatStore.getState().setLoading(false);
    useAiChatStore.getState().setAbortController(null);
  }
}
