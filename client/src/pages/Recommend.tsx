import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiSparkles, HiFilm, HiBookOpen, HiMusicalNote, HiArrowPath, HiInformationCircle, HiCheckCircle } from 'react-icons/hi2';
import { recommendApi, type RecommendItem } from '@/services/recommendApi';
import type { Track } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
const methodLabels: Record<string, string> = {
  'user-cf': '协同过滤（用户相似度）',
  'item-cf': '协同过滤（物品相似度）',
  'content': '基于内容过滤',
  'hybrid': '混合推荐',
  'popularity': '热门推荐',
  'cross-module': '跨模块联动',
};

const methodColors: Record<string, string> = {
  'user-cf': 'from-violet-500 to-purple-600',
  'item-cf': 'from-cyan-500 to-blue-600',
  'content': 'from-emerald-500 to-teal-600',
  'hybrid': 'from-pink-500 to-rose-600',
  'popularity': 'from-amber-500 to-orange-600',
  'cross-module': 'from-fuchsia-500 to-pink-600',
};

function toPercent(n: number, total: number): number {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

export default function Recommend() {
  const { isLoggedIn } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'movie' | 'book' | 'music' | 'cross'>('movie');
  const [items, setItems] = useState<RecommendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAlgo, setShowAlgo] = useState(false);
  const playTrack = usePlayerStore(s => s.playTrack);

  const fetchRecommendations = async (tab: string) => {
    setLoading(true);
    setError('');
    setItems([]);
    try {
      let recs: RecommendItem[] = [];
      if (tab === 'movie') recs = await recommendApi.getMovies(20);
      else if (tab === 'book') recs = await recommendApi.getBooks(20);
      else if (tab === 'music') recs = await recommendApi.getMusic(30);
      else if (tab === 'cross') recs = await recommendApi.getCross('movie', 'book', 15);
      setItems(recs);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('推荐服务暂时不可用，请确认后端已启动，且已生成足够的演示数据。');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn()) fetchRecommendations(activeTab);
  }, [activeTab]);

  const handlePlaySong = (item: RecommendItem) => {
    const id = parseInt(item.itemId, 10);
    if (Number.isNaN(id)) return;
    const track: Track = {
      id,
      name: item.title?.trim() || `歌曲 ${item.itemId}`,
      artists: [{ id: 0, name: '推荐' }],
      album: { id: 0, name: '', picUrl: item.cover || '' },
      duration: 0,
    };
    void playTrack(track);
  };

  const renderBreakdown = (item: RecommendItem) => {
    if (!item.breakdown) return null;
    const b = item.breakdown;
    const total = (b.userCF || 0) + (b.itemCF || 0) + (b.content || 0);
    const rows = [
      { key: 'userCF', label: '用户相似度', value: b.userCF || 0, color: 'bg-violet-400' },
      { key: 'itemCF', label: '物品相似度', value: b.itemCF || 0, color: 'bg-cyan-400' },
      { key: 'content', label: '内容匹配', value: b.content || 0, color: 'bg-emerald-400' },
    ];
    return (
      <div className="mt-2 rounded-xl bg-white/5 border border-white/10 p-2.5">
        <p className="text-[10px] text-gray-400 mb-2">推荐贡献拆解</p>
        <div className="space-y-1.5">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="flex items-center justify-between text-[10px] text-gray-300">
                <span>{row.label}</span>
                <span>{toPercent(row.value, total)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-0.5">
                <div className={`h-full ${row.color}`} style={{ width: `${toPercent(row.value, total)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isLoggedIn()) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center shadow-neon-purple">
          <HiSparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">个性化推荐</h1>
        <p className="text-gray-400 text-center max-w-md">登录后，我们将基于协同过滤算法分析你的偏好，为你推荐最契合的影视、书籍和音乐</p>
        <Link to="/login" className="px-6 py-3 rounded-xl bg-gradient-to-r from-muse-500 to-pink-500 text-white font-medium hover:shadow-neon-purple transition-all">立即登录</Link>
      </div>
    );
  }

  const tabs = [
    { key: 'movie', label: '影视推荐', icon: HiFilm, gradient: 'from-violet-500 to-purple-600' },
    { key: 'book', label: '书籍推荐', icon: HiBookOpen, gradient: 'from-cyan-500 to-blue-600' },
    { key: 'music', label: '音乐推荐', icon: HiMusicalNote, gradient: 'from-pink-500 to-rose-600' },
    { key: 'cross', label: '跨模块联动', icon: HiSparkles, gradient: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-neon-purple">
            <HiSparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">为你推荐</h1>
          <p className="text-gray-400">基于协同过滤算法 · 多维泛娱乐个性化推荐</p>
        </div>

        <div className="flex justify-center mb-8">
          <button onClick={() => setShowAlgo(!showAlgo)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-sm text-gray-300 hover:text-white transition-all">
            <HiInformationCircle className="w-4 h-4" /> 推荐算法说明
          </button>
        </div>

        <AnimatePresence>
          {showAlgo && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="max-w-3xl mx-auto mb-10 overflow-hidden">
              <div className="glass rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">协同过滤推荐算法体系</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { method: 'user-cf', desc: '通过 Pearson 相关系数计算用户相似度，找到与你品味相近的用户，推荐他们喜欢的内容' },
                    { method: 'item-cf', desc: '通过余弦相似度计算物品相似度，找到与你已评价物品相似的内容推荐给你' },
                    { method: 'content', desc: '分析你的兴趣画像（偏好类型/标签），推荐符合你口味画像的新内容' },
                    { method: 'hybrid', desc: '加权融合以上三种算法的推荐结果（默认权重 UCF:0.4 / ICF:0.35 / CB:0.25）' },
                  ].map(({ method, desc }) => (
                    <div key={method} className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${methodColors[method]}`} />
                        <span className="text-sm font-semibold text-white">{methodLabels[method]}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-300">数据闭环：推荐物品的元信息（标题、封面、类型）与你在平台上浏览到的数据 100% 同源，均来自 TMDB / Open Library API 并缓存在本地数据库。</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                  : 'glass border border-white/10 text-gray-400 hover:text-white'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex justify-end mb-6">
          <button onClick={() => fetchRecommendations(activeTab)} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-sm text-gray-300 hover:text-white transition-all disabled:opacity-50">
            <HiArrowPath className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 刷新推荐
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={activeTab === 'music' ? 'space-y-2' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'}>
            {items.map((item, idx) => (
              <motion.div key={`${item.itemId}-${idx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                {item.itemType === 'music' ? (
                  <button type="button" onClick={() => handlePlaySong(item)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl glass border border-white/5 hover:border-white/20 transition-all text-left group">
                    <span className="text-gray-500 text-sm w-6 text-right">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate group-hover:text-muse-300 transition-colors">{item.title || `Song #${item.itemId}`}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.reasons[0]}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${methodColors[item.method] || 'from-gray-500 to-gray-600'} text-white`}>
                      {methodLabels[item.method]?.split('（')[0] || item.method}
                    </div>
                    <span className="text-xs text-gray-500">{item.score.toFixed(2)}</span>
                  </button>
                ) : (
                  <Link to={item.itemType === 'movie' ? `/movies/${item.itemId}` : `/books/${item.itemId}`} className="block group">
                    <div className="glass-card overflow-hidden relative">
                      <div className="relative overflow-hidden">
                        {item.cover ? (
                          <img src={item.cover} alt={item.title} className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-dark-800 flex items-center justify-center text-4xl">{item.itemType === 'movie' ? '🎬' : '📖'}</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${methodColors[item.method] || 'from-gray-500 to-gray-600'} text-white shadow-sm`}>
                          {methodLabels[item.method]?.split('（')[0] || item.method}
                        </div>
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white font-medium">
                          {item.score.toFixed(1)}分
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-white truncate group-hover:text-muse-300 transition-colors">{item.title || item.itemId}</h3>
                        {item.genres && item.genres.length > 0 && (
                          <p className="text-[10px] text-gray-500 mt-0.5 truncate">{item.genres.slice(0, 3).join(' · ')}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.reasons[0]}</p>
                        {item.methodCount != null && (
                          <p className="text-[10px] text-gray-400 mt-1">由 {item.methodCount} 种算法共同命中</p>
                        )}
                        {renderBreakdown(item)}
                      </div>
                    </div>
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 glass rounded-2xl">
            <p className="text-5xl mb-4">🤖</p>
            <p className="text-gray-400 text-lg mb-2">暂无推荐结果</p>
            <p className="text-gray-500 text-sm">多标记、评价影视和书籍，推荐会越来越准确</p>
            <div className="mt-6 max-w-md mx-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-sm text-white mb-3">冷启动三步走</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <HiCheckCircle className="w-4 h-4 text-violet-400" /> 标记至少 3 部影视（想看/看过）
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <HiCheckCircle className="w-4 h-4 text-cyan-400" /> 标记至少 3 本书（想读/读过）
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <HiCheckCircle className="w-4 h-4 text-pink-400" /> 喜欢 5 首以上歌曲以激活音乐推荐
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <Link to="/movies" className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 text-sm hover:bg-violet-500/30 transition-colors">去看影视</Link>
              <Link to="/books" className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/30 transition-colors">去看书籍</Link>
              <Link to="/music" className="px-4 py-2 rounded-xl bg-pink-500/20 text-pink-300 text-sm hover:bg-pink-500/30 transition-colors">去听音乐</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
