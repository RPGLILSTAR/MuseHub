import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiTrophy } from 'react-icons/hi2';
import { musicFullApi } from '@/services/musicApi';
import type { RankingList } from '@/types/music';

function formatCount(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(0) + '万';
  return n.toString();
}

export default function MusicRankings() {
  const [rankings, setRankings] = useState<RankingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    musicFullApi.getAllRankings()
      .then(setRankings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const officialRankings = rankings.slice(0, 4);
  const otherRankings = rankings.slice(4);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/music" className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <HiArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <HiTrophy className="w-6 h-6 text-yellow-400" />
        <h1 className="text-3xl font-bold"><span className="gradient-text">排行榜</span></h1>
      </div>
      <p className="text-gray-400 mb-10 ml-12">实时更新，发现热门好歌</p>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse-soft" />)}
        </div>
      ) : (
        <>
          {officialRankings.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-6">官方榜</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {officialRankings.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Link to={`/music/playlist/${r.id}`} className="block group">
                      <div className="glass-card overflow-hidden">
                        <div className="relative aspect-square overflow-hidden">
                          <img src={r.coverImgUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-white font-bold text-lg">{r.name}</h3>
                            <p className="text-gray-300 text-xs mt-1">{r.updateFrequency}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {otherRankings.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-6">更多榜单</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {otherRankings.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                    <Link to={`/music/playlist/${r.id}`} className="block group">
                      <div className="glass-card overflow-hidden">
                        <div className="relative aspect-square overflow-hidden">
                          <img src={r.coverImgUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>
                        <div className="p-3">
                          <h3 className="text-xs font-medium text-white line-clamp-2 group-hover:text-muse-300 transition-colors">{r.name}</h3>
                          <p className="text-[10px] text-gray-500 mt-1">{formatCount(r.playCount)} 播放</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
