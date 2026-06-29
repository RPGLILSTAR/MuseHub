import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowLeft, HiBookOpen, HiBookmark, HiEye, HiCheck, HiPlusCircle, HiTrash, HiXMark, HiStar, HiQueueList } from 'react-icons/hi2';
import { collectionApi, type MarkStatus, type UserMark, type UserList } from '@/services/collectionApi';

const statusTabs = [
  { key: undefined as MarkStatus | undefined, label: '全部', icon: HiBookOpen },
  { key: 'wish' as MarkStatus, label: '想读', icon: HiBookmark },
  { key: 'doing' as MarkStatus, label: '在读', icon: HiEye },
  { key: 'done' as MarkStatus, label: '读过', icon: HiCheck },
];

export default function MyBooks() {
  const [tab, setTab] = useState<'marks' | 'lists'>('marks');
  const [statusFilter, setStatusFilter] = useState<MarkStatus | undefined>(undefined);
  const [marks, setMarks] = useState<UserMark[]>([]);
  const [lists, setLists] = useState<UserList[]>([]);
  const [stats, setStats] = useState<Record<MarkStatus, number>>({ wish: 0, doing: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'marks') {
        const [m, s] = await Promise.all([
          collectionApi.getMarks('book', statusFilter),
          collectionApi.getMarkStats('book'),
        ]);
        setMarks(m);
        setStats(s);
      } else {
        const l = await collectionApi.getLists('book');
        setLists(l);
      }
    } catch {
      setError('我的书架数据加载失败，请确认登录状态和后端服务后重试。');
    }
    finally { setLoading(false); }
  }, [tab, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateList = async () => {
    if (!newName.trim()) return;
    await collectionApi.createList('book', newName.trim());
    setNewName('');
    setShowCreate(false);
    fetchData();
  };

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/books" className="p-2 rounded-xl hover:bg-white/10 transition-colors"><HiArrowLeft className="w-5 h-5 text-gray-400" /></Link>
        <HiBookOpen className="w-6 h-6 text-cyan-400" />
        <h1 className="text-3xl font-bold"><span className="gradient-text">我的书架</span></h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 my-6 ml-12">
        {[
          { label: '想读', count: stats.wish, color: 'from-blue-500 to-cyan-400' },
          { label: '在读', count: stats.doing, color: 'from-yellow-500 to-orange-400' },
          { label: '读过', count: stats.done, color: 'from-green-500 to-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('marks')} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'marks' ? 'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:text-white'}`}>
          <HiBookmark className="w-4 h-4 inline mr-1" /> 标记
        </button>
        <button onClick={() => setTab('lists')} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'lists' ? 'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:text-white'}`}>
          <HiQueueList className="w-4 h-4 inline mr-1" /> 书单
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {tab === 'marks' && (
        <>
          <div className="flex gap-2 mb-6">
            {statusTabs.map((st) => (
              <button key={String(st.key)} onClick={() => setStatusFilter(st.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all ${statusFilter === st.key ? 'bg-muse-500 text-white' : 'glass text-gray-300 hover:text-white'}`}>
                <st.icon className="w-3.5 h-3.5" /> {st.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse-soft" />)}</div>
          ) : marks.length > 0 ? (
            <div className="space-y-3">
              {marks.map((m, i) => (
                <motion.div key={m.itemId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/books/${m.itemId}`} className="block glass rounded-xl p-4 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-muse-300 transition-colors">ID: {m.itemId}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'wish' ? 'bg-blue-500/10 text-blue-400' : m.status === 'doing' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
                            {m.status === 'wish' ? '想读' : m.status === 'doing' ? '在读' : '读过'}
                          </span>
                          {m.rating && <span className="flex items-center gap-0.5 text-xs text-yellow-400"><HiStar className="w-3 h-3" />{m.rating}</span>}
                          {m.comment && <span className="text-xs text-gray-500 truncate max-w-[200px]">{m.comment}</span>}
                        </div>
                      </div>
                      <span className="text-xs text-gray-600">{new Date(m.updatedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass rounded-2xl"><p className="text-4xl mb-3">📚</p><p className="text-gray-400">暂无标记的书籍</p></div>
          )}
        </>
      )}

      {tab === 'lists' && (
        <>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl glass border border-dashed border-white/20 text-sm text-gray-300 hover:text-white transition-all mb-6 w-full justify-center">
            <HiPlusCircle className="w-5 h-5" /> 新建书单
          </button>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse-soft" />)}</div>
          ) : lists.length > 0 ? (
            <div className="space-y-3">
              {lists.map((l, i) => (
                <Link key={l.id} to={`/books/list/${l.id}`}>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass rounded-xl p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/5 transition-all">
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:shadow-neon-cyan transition-shadow">
                      <HiQueueList className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium group-hover:text-cyan-300 transition-colors">{l.name}</h3>
                      <p className="text-xs text-gray-500">{l.items.length} 本 · {new Date(l.createdAt).toLocaleDateString('zh-CN')}</p>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); collectionApi.deleteList(l.id).then(() => fetchData()); }}
                      className="p-2 rounded-lg text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass rounded-2xl"><p className="text-4xl mb-3">📝</p><p className="text-gray-400">还没有书单</p></div>
          )}
        </>
      )}

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass rounded-2xl p-6 w-full max-w-md border border-white/10">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold text-white">新建书单</h3>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-white/10"><HiXMark className="w-5 h-5 text-gray-400" /></button>
              </div>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="书单名称"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50 mb-4" />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white text-sm">取消</button>
                <button onClick={handleCreateList} className="px-6 py-2.5 rounded-xl bg-muse-500 text-white text-sm font-medium hover:bg-muse-400">创建</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
