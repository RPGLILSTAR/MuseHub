import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  streaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface AiChatState {
  open: boolean;
  loading: boolean;
  conversationId: string | null;
  conversations: Conversation[];
  messages: ChatMessage[];
  abortController: AbortController | null;

  toggleOpen: () => void;
  setOpen: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  setConversationId: (id: string | null) => void;
  setConversations: (list: Conversation[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateLastAssistant: (content: string) => void;
  finalizeLastAssistant: () => void;
  setMessages: (msgs: ChatMessage[]) => void;
  clearChat: () => void;
  setAbortController: (ctrl: AbortController | null) => void;
}

export const useAiChatStore = create<AiChatState>((set) => ({
  open: false,
  loading: false,
  conversationId: null,
  conversations: [],
  messages: [],
  abortController: null,

  toggleOpen: () => set((s) => ({ open: !s.open })),
  setOpen: (v) => set({ open: v }),
  setLoading: (v) => set({ loading: v }),
  setConversationId: (id) => set({ conversationId: id }),
  setConversations: (list) => set({ conversations: list }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastAssistant: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + content };
      }
      return { messages: msgs };
    }),
  finalizeLastAssistant: () =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, streaming: false };
      }
      return { messages: msgs };
    }),
  setMessages: (msgs) => set({ messages: msgs }),
  clearChat: () => set({ conversationId: null, messages: [] }),
  setAbortController: (ctrl) => set({ abortController: ctrl }),
}));
