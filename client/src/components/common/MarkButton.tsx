import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiBookmark, HiEye, HiCheck, HiXMark } from 'react-icons/hi2';
import { collectionApi, type ItemType, type MarkStatus, type UserMark } from '@/services/collectionApi';
import { useAuthStore } from '@/store/authStore';
import StarRating from './StarRating';

const statusConfig = {
  wish: { label: '想看', labelBook: '想读', icon: HiBookmark, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  doing: { label: '在看', labelBook: '在读', icon: HiEye, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  done: { label: '看过', labelBook: '读过', icon: HiCheck, color: 'text-green-400 bg-green-500/10 border-green-500/30' },
};

interface MarkButtonProps {
  itemType: ItemType;
  itemId: string;
  itemTitle?: string;
  itemCover?: string;
  genres?: string[];
  onMarkChange?: (mark: UserMark | null) => void;
}

export default function MarkButton({ itemType, itemId, itemTitle, itemCover, genres, onMarkChange }: MarkButtonProps) {
  const [mark, setMark] = useState<UserMark | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const isBook = itemType === 'book';
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    collectionApi.getMark(itemType, itemId).then((m) => {
      setMark(m);
      if (m) { setRating(m.rating || 0); setComment(m.comment || ''); }
    }).catch(() => {});
  }, [itemType, itemId]);

  const handleMark = async (status: MarkStatus) => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    try {
      const m = await collectionApi.setMark(itemType, itemId, status, rating || undefined, [], comment || undefined, itemTitle, itemCover, genres);
      setMark(m);
      onMarkChange?.(m);
      setShowPanel(false);
    } catch {}
  };

  const handleRemove = async () => {
    try {
      await collectionApi.removeMark(itemType, itemId);
      setMark(null);
      setRating(0);
      setComment('');
      onMarkChange?.(null);
      setShowPanel(false);
    } catch {}
  };

  const currentStatus = mark?.status;
  const currentConfig = currentStatus ? statusConfig[currentStatus] : null;

  return (
    <div className="relative">
      {currentConfig ? (
        <button onClick={() => setShowPanel(!showPanel)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-all ${currentConfig.color}`}>
          <currentConfig.icon className="w-4 h-4" />
          {isBook ? currentConfig.labelBook : currentConfig.label}
          {mark?.rating ? <span className="text-yellow-400 text-xs ml-1">{'★'.repeat(mark.rating)}</span> : null}
        </button>
      ) : (
        <div className="flex gap-2">
          {(Object.entries(statusConfig) as [MarkStatus, typeof statusConfig.wish][]).map(([key, cfg]) => (
            <button key={key} onClick={() => { setShowPanel(false); handleMark(key); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-all">
              <cfg.icon className="w-4 h-4" />
              {isBook ? cfg.labelBook : cfg.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showPanel && mark && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 z-50 w-72 glass rounded-2xl border border-white/10 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white">修改标记</span>
              <button onClick={() => setShowPanel(false)} className="p-1 rounded-lg hover:bg-white/10"><HiXMark className="w-4 h-4 text-gray-400" /></button>
            </div>

            <div className="flex gap-2 mb-4">
              {(Object.entries(statusConfig) as [MarkStatus, typeof statusConfig.wish][]).map(([key, cfg]) => (
                <button key={key} onClick={() => handleMark(key)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                    currentStatus === key ? cfg.color : 'text-gray-400 border-white/5 hover:border-white/20'
                  }`}>
                  <cfg.icon className="w-3.5 h-3.5" />
                  {isBook ? cfg.labelBook : cfg.label}
                </button>
              ))}
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">评分</p>
              <StarRating value={rating} onChange={(v) => { setRating(v); collectionApi.setMark(itemType, itemId, mark.status, v, [], undefined, itemTitle, itemCover, genres).then(setMark); }} showText />
            </div>

            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="写一句短评..."
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 outline-none focus:border-muse-500/50 resize-none mb-3" rows={2}
              onBlur={() => { if (comment !== mark.comment) collectionApi.setMark(itemType, itemId, mark.status, rating, [], comment, itemTitle, itemCover, genres).then(setMark); }}
            />

            <button onClick={handleRemove} className="text-xs text-red-400 hover:text-red-300 transition-colors">删除标记</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
