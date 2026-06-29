import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChatBubbleLeft, HiHandThumbUp, HiTrash } from 'react-icons/hi2';
import { collectionApi, type ItemType, type UserReview } from '@/services/collectionApi';
import { useAuthStore } from '@/store/authStore';
import StarRating from './StarRating';

interface ReviewSectionProps {
  itemType: ItemType;
  itemId: string;
}

export default function ReviewSection({ itemType, itemId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  const navigate = useNavigate();

  const fetchReviews = useCallback(() => {
    collectionApi.getReviews(itemType, itemId).then(setReviews).catch(() => {});
  }, [itemType, itemId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleSubmit = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (!content.trim()) return;
    setLoading(true);
    try {
      await collectionApi.addReview(itemType, itemId, content.trim(), rating);
      setContent('');
      setRating(0);
      fetchReviews();
    } catch {}
    finally { setLoading(false); }
  };

  const handleLike = async (id: string) => {
    await collectionApi.likeReview(id).catch(() => {});
    fetchReviews();
  };

  const handleDelete = async (id: string) => {
    await collectionApi.deleteReview(id).catch(() => {});
    fetchReviews();
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <HiChatBubbleLeft className="w-5 h-5 text-muse-400" />
        <h3 className="text-lg font-bold text-white">
          {itemType === 'book' ? '书评' : '影评'}
          {reviews.length > 0 && <span className="text-sm font-normal text-gray-500 ml-2">({reviews.length})</span>}
        </h3>
      </div>

      {/* Write review */}
      <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center text-xs text-white font-bold">我</div>
          <StarRating value={rating} onChange={setRating} showText />
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder={`写下你对这${itemType === 'book' ? '本书' : '部影片'}的看法...`}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 outline-none focus:border-muse-500/50 resize-none" rows={3} />
        <div className="flex justify-end mt-3">
          <button onClick={handleSubmit} disabled={!content.trim() || loading}
            className="px-6 py-2 rounded-xl bg-muse-500 text-white text-sm font-medium hover:bg-muse-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? '发布中...' : '发布'}
          </button>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        <AnimatePresence>
          {reviews.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/5 group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                  {r.author.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{r.author}</span>
                    {r.rating > 0 && <StarRating value={r.rating} readonly size="sm" />}
                    <span className="text-xs text-gray-600 ml-auto">{new Date(r.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 leading-relaxed">{r.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <button onClick={() => handleLike(r.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-muse-300 transition-colors">
                      <HiHandThumbUp className="w-3.5 h-3.5" /> {r.likeCount > 0 ? r.likeCount : '有用'}
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <HiTrash className="w-3.5 h-3.5" /> 删除
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {reviews.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">还没有{itemType === 'book' ? '书评' : '影评'}，来写第一条吧</p>
          </div>
        )}
      </div>
    </div>
  );
}
