import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiPlus, HiTrash, HiMegaphone } from 'react-icons/hi2';
import { adminApi } from '@/services/adminApi';
import toast from 'react-hot-toast';

export default function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = () => { adminApi.getAnnouncements().then(setAnnouncements).catch(() => {}); };
  useEffect(fetchData, []);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      await adminApi.createAnnouncement(title.trim(), content.trim());
      setTitle(''); setContent('');
      toast.success('公告发布成功');
      fetchData();
    } catch { toast.error('发布失败'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    await adminApi.deleteAnnouncement(id);
    toast.success('已删除');
    fetchData();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">公告管理</h1>

      <div className="glass rounded-2xl p-6 border border-white/5 mb-8">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><HiMegaphone className="w-5 h-5 text-muse-400" /> 发布新公告</h2>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="公告标题"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50 mb-3" />
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="公告内容..." rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50 resize-none mb-3" />
        <button onClick={handleCreate} disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-muse-500 text-white text-sm font-medium hover:bg-muse-400 disabled:opacity-50 flex items-center gap-2">
          <HiPlus className="w-4 h-4" /> {loading ? '发布中...' : '发布公告'}
        </button>
      </div>

      <div className="space-y-3">
        {announcements.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="glass rounded-xl p-5 border border-white/5 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white">{a.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{a.content}</p>
              <p className="text-xs text-gray-600 mt-2">{new Date(a.created_at).toLocaleString('zh-CN')}</p>
            </div>
            <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><HiTrash className="w-4 h-4" /></button>
          </motion.div>
        ))}
        {announcements.length === 0 && <p className="text-center py-12 text-gray-500">暂无公告</p>}
      </div>
    </div>
  );
}
