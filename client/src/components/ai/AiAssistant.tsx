import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiSparkles, HiXMark, HiPaperAirplane,
  HiChatBubbleLeftRight, HiTrash, HiPlus,
  HiStopCircle, HiChevronLeft, HiArrowPath,
} from 'react-icons/hi2';
import { useAiChatStore, type Conversation } from '@/store/aiChatStore';
import { useAuthStore } from '@/store/authStore';
import { sendChatMessage, aiApi } from '@/services/aiApi';
import MarkdownRenderer from './MarkdownRenderer';

const SUGGESTIONS = [
  '推荐几部治愈系电影 🎬',
  '分析一下我的观影品味 📊',
  '看完《挪威的森林》该听什么歌 🎵',
  '最近有什么好书推荐 📚',
];

export default function AiAssistant() {
  const { open, toggleOpen, loading, messages, conversations, conversationId } = useAiChatStore();
  const { setOpen, setConversations, setMessages, setConversationId, clearChat, abortController, setAbortController } = useAiChatStore();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user = useAuthStore((s) => s.user);

  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const loadConversations = useCallback(async () => {
    try {
      const list = await aiApi.getConversations();
      setConversations(list || []);
    } catch {}
  }, [setConversations]);

  useEffect(() => {
    if (open && isLoggedIn()) loadConversations();
  }, [open, isLoggedIn, loadConversations]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    await sendChatMessage(msg);
    loadConversations();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const handleNewChat = () => {
    clearChat();
    setShowHistory(false);
  };

  const handleLoadConversation = async (conv: Conversation) => {
    try {
      const msgs = await aiApi.getMessages(conv.id);
      setConversationId(conv.id);
      setMessages(
        (msgs || []).map((m: any) => ({
          id: `${m.id}`,
          role: m.role,
          content: m.content,
          createdAt: m.created_at,
        }))
      );
      setShowHistory(false);
    } catch {}
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await aiApi.deleteConversation(convId);
      if (conversationId === convId) clearChat();
      loadConversations();
    } catch {}
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  if (!isLoggedIn()) return null;

  return (
    <>
      {/* FAB 按钮 */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleOpen}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl
              bg-gradient-to-br from-muse-500 to-pink-500
              shadow-neon-purple hover:shadow-neon-pink
              flex items-center justify-center transition-shadow duration-300"
          >
            <HiSparkles className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 聊天窗口 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50
              w-[420px] h-[600px] max-h-[80vh]
              flex flex-col
              rounded-2xl border border-white/10
              bg-dark-950/95 backdrop-blur-xl
              shadow-2xl shadow-black/40
              overflow-hidden"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5
              bg-gradient-to-r from-muse-950/50 to-pink-950/30">
              <div className="flex items-center gap-3">
                {showHistory ? (
                  <button onClick={() => setShowHistory(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                    <HiChevronLeft className="w-5 h-5 text-gray-300" />
                  </button>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center">
                    <HiSparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {showHistory ? '对话历史' : 'Muse AI 助手'}
                  </h3>
                  {!showHistory && (
                    <p className="text-[10px] text-gray-500">影视 · 书籍 · 音乐 全能顾问</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!showHistory && (
                  <>
                    <button onClick={() => setShowHistory(true)} title="对话历史"
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <HiChatBubbleLeftRight className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={handleNewChat} title="新对话"
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <HiPlus className="w-4 h-4 text-gray-400" />
                    </button>
                  </>
                )}
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <HiXMark className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* 内容区域 */}
            {showHistory ? (
              <HistoryPanel
                conversations={conversations}
                currentId={conversationId}
                onSelect={handleLoadConversation}
                onDelete={handleDeleteConversation}
                onNewChat={handleNewChat}
              />
            ) : (
              <>
                {/* 消息列表 */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth">
                  {messages.length === 0 ? (
                    <WelcomeScreen username={user?.username || ''} onSuggestion={(s) => { setInput(s); }} />
                  ) : (
                    messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))
                  )}
                </div>

                {/* 输入区域 */}
                <div className="px-4 py-3 border-t border-white/5 bg-dark-950/80">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={handleTextareaInput}
                      onKeyDown={handleKeyDown}
                      placeholder="问我任何关于影视、书籍、音乐的问题..."
                      rows={1}
                      className="flex-1 resize-none bg-white/5 border border-white/10
                        rounded-xl px-3 py-2.5 text-sm text-white
                        placeholder-gray-500 outline-none
                        focus:border-muse-500/50 focus:bg-white/[0.07]
                        transition-all max-h-[120px]"
                    />
                    {loading ? (
                      <button onClick={handleStop}
                        className="flex-shrink-0 p-2.5 rounded-xl bg-red-500/20 border border-red-500/30
                          hover:bg-red-500/30 transition-colors">
                        <HiStopCircle className="w-5 h-5 text-red-400" />
                      </button>
                    ) : (
                      <button onClick={handleSend} disabled={!input.trim()}
                        className="flex-shrink-0 p-2.5 rounded-xl
                          bg-gradient-to-r from-muse-500 to-pink-500
                          disabled:opacity-30 disabled:cursor-not-allowed
                          hover:from-muse-400 hover:to-pink-400
                          transition-all">
                        <HiPaperAirplane className="w-5 h-5 text-white" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1.5 text-center">
                    AI 可能产生不准确的信息，推荐结果仅供参考
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── 子组件 ───

function MessageBubble({ message }: { message: { role: string; content: string; streaming?: boolean } }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] ${isUser
        ? 'bg-gradient-to-br from-muse-600/40 to-pink-600/30 border border-muse-500/20 rounded-2xl rounded-br-md'
        : 'bg-white/5 border border-white/5 rounded-2xl rounded-bl-md'
      } px-3.5 py-2.5`}>
        {isUser ? (
          <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm text-gray-200">
            {message.content ? (
              <MarkdownRenderer content={message.content} />
            ) : (
              <div className="flex items-center gap-2 py-1">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muse-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-muse-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-muse-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500">思考中...</span>
              </div>
            )}
            {message.streaming && message.content && (
              <span className="inline-block w-1.5 h-4 bg-muse-400 rounded-sm ml-0.5 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function WelcomeScreen({ username, onSuggestion }: { username: string; onSuggestion: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-6 px-2">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muse-500 to-pink-500
          flex items-center justify-center mb-4 shadow-neon-purple"
      >
        <HiSparkles className="w-8 h-8 text-white" />
      </motion.div>

      <h3 className="text-lg font-bold text-white mb-1">
        你好{username ? `，${username}` : ''} 👋
      </h3>
      <p className="text-sm text-gray-400 text-center mb-6">
        我是 Muse，你的泛娱乐 AI 助手<br />
        可以为你推荐影视、书籍和音乐
      </p>

      <div className="w-full space-y-2">
        <p className="text-xs text-gray-500 mb-2">试试问我：</p>
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggestion(s)}
            className="w-full text-left px-3 py-2.5 rounded-xl
              bg-white/[0.03] border border-white/5
              hover:bg-white/[0.07] hover:border-muse-500/20
              text-sm text-gray-300 transition-all"
          >
            {s}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({
  conversations, currentId, onSelect, onDelete, onNewChat,
}: {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (c: Conversation) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3">
        <button onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            border border-dashed border-white/10 hover:border-muse-500/30
            text-sm text-gray-400 hover:text-white transition-all">
          <HiPlus className="w-4 h-4" /> 开始新对话
        </button>
      </div>

      <div className="px-4 space-y-1 pb-4">
        {conversations.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">还没有对话记录</p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl
                text-left transition-all group
                ${conv.id === currentId
                  ? 'bg-muse-500/10 border border-muse-500/20'
                  : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-200 truncate">{conv.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {new Date(conv.updated_at).toLocaleDateString('zh-CN', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                onClick={(e) => onDelete(conv.id, e)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100
                  hover:bg-red-500/10 transition-all"
              >
                <HiTrash className="w-3.5 h-3.5 text-red-400" />
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
