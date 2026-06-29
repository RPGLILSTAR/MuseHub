import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiCheck, HiXMark, HiTrash, HiStar } from 'react-icons/hi2';
import { adminApi } from '@/services/adminApi';
import toast from 'react-hot-toast';

const statusTabs = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' },
];

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback((p: number, status?: string) => {
    setLoading(true);
    adminApi.getReviews(p, status || undefined).then(res => {
      setReviews(res.data);
      setTotalPages(res.totalPages || 1);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReviews(page, filter); }, [page, filter, fetchReviews]);

  const handleStatus = async (id: number, status: string) => {
    await adminApi.setReviewStatus(id, status);
    toast.success(status === 'approved' ? '已通过' : '已拒绝');
    fetchReviews(page, filter);
  };

  const handleDelete = async (id: number) => {
    await adminApi.deleteReview(id);
    toast.success('已删除');
    fetchReviews(page, filter);
  };

  const statusBadge = (s: string) => {
    if (s === 'approved') return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (s === 'rejected') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">内容审核</h1>

      <div className="flex gap-2 mb-6">
        {statusTabs.map(t => (
          <button key={t.key} onClick={() => { setFilter(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === t.key ? 'bg-muse-500/10 text-muse-300 border border-muse-500/20' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {reviews.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="glass rounded-xl p-5 border border-white/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-white">{r.username}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadge(r.status)}`}>
                    {r.status === 'approved' ? '已通过' : r.status === 'rejected' ? '已拒绝' : '待审核'}
                  </span>
                  <span className="text-xs text-gray-600">{r.item_type === 'book' ? '书评' : '影评'} · {r.item_id}</span>
                  <span className="text-xs text-gray-600 ml-auto">{new Date(r.created_at).toLocaleString('zh-CN')}</span>
                </div>
                {r.rating > 0 && <div className="flex items-center gap-1 mb-1">{Array.from({ length: r.rating }, (_, i) => <HiStar key={i} className="w-3.5 h-3.5 text-yellow-400" />)}</div>}
                {r.title && <p className="text-sm font-medium text-white mb-1">{r.title}</p>}
                <p className="text-sm text-gray-300 line-clamp-3">{r.content}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {r.status !== 'approved' && (
                  <button onClick={() => handleStatus(r.id, 'approved')} className="p-2 rounded-lg hover:bg-green-500/10 text-gray-400 hover:text-green-400" title="通过">
                    <HiCheck className="w-4 h-4" />
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button onClick={() => handleStatus(r.id, 'rejected')} className="p-2 rounded-lg hover:bg-yellow-500/10 text-gray-400 hover:text-yellow-400" title="拒绝">
                    <HiXMark className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400" title="删除">
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {reviews.length === 0 && !loading && <p className="text-center py-12 text-gray-500">暂无评论</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm ${page === i + 1 ? 'bg-muse-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
