import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMusicalNote, HiTrophy, HiMagnifyingGlass, HiHeart, HiSparkles, HiPlay, HiChevronRight } from 'react-icons/hi2';
import PlaylistCard from '@/components/music/PlaylistCard';
import { PlaylistCardSkeleton } from '@/components/common/Skeleton';
import SongList from '@/components/music/SongList';
import { musicFullApi } from '@/services/musicApi';
import type { Playlist, Track } from '@/types';
import type { Artist, RankingList } from '@/types/music';

function formatCount(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(0) + '万';
  return n.toString();
}

export default function Music() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newSongs, setNewSongs] = useState<Track[]>([]);
  const [rankings, setRankings] = useState<RankingList[]>([]);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.allSettled([
      musicFullApi.getPersonalized(),
      musicFullApi.getNewSongs(),
      musicFullApi.getAllRankings(),
      musicFullApi.getTopArtists(18),
    ]).then(([plRes, nsRes, rkRes, arRes]) => {
      if (plRes.status === 'fulfilled') setPlaylists(plRes.value || []);
      if (nsRes.status === 'fulfilled') setNewSongs(nsRes.value || []);
      if (rkRes.status === 'fulfilled') setRankings((rkRes.value || []).slice(0, 4));
      if (arRes.status === 'fulfilled') setTopArtists(arRes.value || []);
      if ([plRes, nsRes, rkRes, arRes].some((res) => res.status === 'rejected')) {
        setError('部分音乐数据加载失败，请确认网易云音乐 API 服务可用后刷新页面。');
      }
    }).finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { to: '/music/search', icon: HiMagnifyingGlass, label: '搜索', gradient: 'from-blue-500 to-cyan-400' },
    { to: '/music/rankings', icon: HiTrophy, label: '排行榜', gradient: 'from-yellow-500 to-orange-400' },
    { to: '/music/my', icon: HiHeart, label: '我的', gradient: 'from-pink-500 to-rose-400' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center">
            <HiMusicalNote className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold"><span className="gradient-text">音乐</span> 空间</h1>
        </div>
        <p className="text-gray-400 mt-2 ml-[52px]">聆听世界，让旋律触动灵魂</p>
      </motion.div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {quickLinks.map((link, i) => (
          <motion.div key={link.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link to={link.to} className="glass-card flex items-center gap-3 px-5 py-4 group hover:scale-[1.02] transition-transform">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center flex-shrink-0`}>
                <link.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-medium group-hover:text-muse-300 transition-colors">{link.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {error && (
        <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      {/* Recommended Playlists */}
      <Section title="推荐歌单" icon={<HiSparkles className="w-4 h-4 text-white" />} gradient="from-muse-500 to-pink-500" linkTo="/music/playlists" linkText="更多">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <PlaylistCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {playlists.map((p, i) => <PlaylistCard key={p.id} playlist={p} index={i} />)}
          </div>
        )}
      </Section>

      {/* New Songs */}
      <Section title="新歌速递" icon={<HiMusicalNote className="w-4 h-4 text-white" />} gradient="from-green-500 to-emerald-400">
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse-soft" />)}</div>
        ) : (
          <SongList tracks={newSongs.slice(0, 20)} />
        )}
      </Section>

      {/* Rankings Preview */}
      {!loading && rankings.length > 0 && (
        <Section title="排行榜" icon={<HiTrophy className="w-4 h-4 text-white" />} gradient="from-yellow-500 to-orange-400" linkTo="/music/rankings" linkText="查看全部">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {rankings.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link to={`/music/playlist/${r.id}`} className="block group">
                  <div className="glass-card overflow-hidden">
                    <div className="relative aspect-square overflow-hidden">
                      <img src={r.coverImgUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-bold text-sm">{r.name}</h3>
                        <p className="text-gray-300 text-xs mt-1">{r.updateFrequency}</p>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 text-[10px] text-white">
                        <HiPlay className="w-3 h-3" /> {formatCount(r.playCount)}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Top Artists */}
      {!loading && topArtists.length > 0 && (
        <Section title="热门歌手" icon={<span className="text-sm">🎤</span>} gradient="from-indigo-500 to-purple-400">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {topArtists.map((artist, i) => (
              <motion.div key={artist.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                <Link to={`/music/artist/${artist.id}`} className="block group text-center">
                  <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-muse-500/50 transition-colors">
                    <img src={artist.picUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-white mt-2 group-hover:text-muse-300 transition-colors truncate">{artist.name}</h3>
                </Link>
              </motion.div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon, gradient, linkTo, linkText, children }: {
  title: string; icon: React.ReactNode; gradient: string;
  linkTo?: string; linkText?: string; children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>{icon}</div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        {linkTo && (
          <Link to={linkTo} className="flex items-center gap-1 text-sm text-gray-400 hover:text-muse-300 transition-colors">
            {linkText} <HiChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
