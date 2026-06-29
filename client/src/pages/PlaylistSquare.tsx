import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiMusicalNote, HiSparkles, HiFire } from 'react-icons/hi2';
import { musicFullApi } from '@/services/musicApi';
import PlaylistCard from '@/components/music/PlaylistCard';
import { PlaylistCardSkeleton } from '@/components/common/Skeleton';
import type { Playlist } from '@/types';

const HOT_CATS = ['全部', '华语', '流行', '摇滚', '民谣', '电子', '说唱', 'ACG', '古典', '轻音乐', '影视原声', '爵士'];

export default function PlaylistSquare() {
  const [cat, setCat] = useState('全部');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [hqPlaylists, setHqPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 30;

  const fetchPlaylists = useCallback(async (category: string, pageNum: number, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const offset = (pageNum - 1) * PAGE_SIZE;
      const data = await musicFullApi.getTopPlaylists(PAGE_SIZE, category);
      
      if (append) {
        setPlaylists((prev) => [...prev, ...data]);
      } else {
        setPlaylists(data);
      }
      setHasMore(data.length >= PAGE_SIZE);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setPlaylists([]);
    fetchPlaylists(cat, 1);
  }, [cat, fetchPlaylists]);

  useEffect(() => {
    musicFullApi.getHQPlaylists(6).then(setHqPlaylists).catch(() => {});
  }, []);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPlaylists(cat, next, true);
  };

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link to="/music" className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <HiArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <HiMusicalNote className="w-6 h-6 text-muse-400" />
        <h1 className="text-3xl font-bold"><span className="gradient-text">歌单广场</span></h1>
      </div>
      <p className="text-gray-400 mb-8 ml-12">海量歌单，总有你喜欢的</p>

      {/* 精品歌单推荐 */}
      {hqPlaylists.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <HiSparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">精品歌单</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {hqPlaylists.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/music/playlist/${p.id}`} className="block group">
                  <div className="glass-card overflow-hidden relative">
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/80 text-[10px] text-white font-medium">
                      <HiSparkles className="w-3 h-3" /> 精品
                    </div>
                    <div className="aspect-square overflow-hidden">
                      <img src={p.coverImgUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    </div>
                    <div className="p-3">
                      <h3 className="text-xs font-medium text-white line-clamp-2 group-hover:text-muse-300 transition-colors">{p.name}</h3>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 分类标签 */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <HiFire className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-bold text-white">热门歌单</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {HOT_CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                cat === c
                  ? 'bg-muse-500 text-white shadow-neon-purple'
                  : 'glass text-gray-300 hover:text-white hover:bg-white/10'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* 歌单网格 */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 18 }).map((_, i) => <PlaylistCardSkeleton key={i} />)}
        </div>
      ) : playlists.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlists.map((p, i) => <PlaylistCard key={`${p.id}-${i}`} playlist={p} index={i} />)}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-10">
              <button onClick={handleLoadMore} disabled={loadingMore}
                className="px-8 py-3 rounded-xl glass border border-white/10 text-sm text-gray-300 hover:text-white hover:border-muse-500/50 transition-all disabled:opacity-50">
                {loadingMore ? '加载中...' : '加载更多歌单'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 glass rounded-2xl">
          <p className="text-4xl mb-3">🎵</p>
          <p className="text-gray-400">该分类暂无歌单</p>
        </div>
      )}
    </div>
  );
}
