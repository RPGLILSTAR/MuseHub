import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiPlay, HiMusicalNote } from 'react-icons/hi2';
import { musicFullApi } from '@/services/musicApi';
import { usePlayerStore } from '@/store/playerStore';
import { DetailPageSkeleton } from '@/components/common/Skeleton';
import SongList from '@/components/music/SongList';
import type { Playlist, Track } from '@/types';
import type { UserPlaylist } from '@/types/music';

type DisplayPlaylist = Partial<Playlist> & Partial<UserPlaylist> & {
  id: number | string;
  name: string;
  description?: string | null;
};

function formatCount(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toString();
}

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<DisplayPlaylist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserPlaylist, setIsUserPlaylist] = useState(false);
  const { playTrack } = usePlayerStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    const fetchPlaylist = async () => {
      try {
        let data;
        let isUser = false;
        
        // 先尝试作为用户歌单获取
        try {
          data = await musicFullApi.getUserPlaylistDetail(id);
          isUser = true;
        } catch (userErr) {
          // 用户歌单获取失败，尝试作为网易云歌单
          try {
            const parsed = parseInt(id);
            if (!isNaN(parsed)) {
              data = await musicFullApi.getPlaylistDetail(parsed);
              isUser = false;
            } else {
              throw userErr; // 如果都是字符串，重新抛出用户歌单的错误
            }
          } catch (netErr) {
            throw userErr; // 优先显示用户歌单的错误
          }
        }
        
        setPlaylist(data.playlist as DisplayPlaylist);
        setTracks(data.tracks || []);
        setIsUserPlaylist(isUser);
      } catch (err) {
        console.error('Failed to fetch playlist:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlaylist();
  }, [id]);

  const handleRemoveSong = (songId: number) => {
    setTracks((prev) => prev.filter((t) => t.id !== songId));
  };

  if (loading) return <DetailPageSkeleton />;
  if (!playlist) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400 text-lg">歌单未找到</p></div>;

  return (
    <div className="min-h-screen pt-20">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={playlist.coverImgUrl || playlist.coverUrl || ''} alt="" className="w-full h-full object-cover opacity-15 blur-3xl scale-125" />
          <div className="absolute inset-0 bg-dark-950/70" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <Link to="/music" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-sm text-sm text-white hover:bg-white/20 transition-colors mb-8">
            <HiArrowLeft className="w-4 h-4" /> 返回
          </Link>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col md:flex-row gap-8">
            <img src={playlist.coverImgUrl || playlist.coverUrl || ''} alt={playlist.name} className="w-56 h-56 rounded-2xl shadow-glass border border-white/10 mx-auto md:mx-0 flex-shrink-0" />

            <div className="flex-1 min-w-0 flex flex-col justify-end text-center md:text-left">
              <p className="text-xs text-muse-300 font-medium uppercase tracking-wider mb-2">歌单</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{playlist.name}</h1>

              <div className="flex items-center gap-4 mt-4 text-sm text-gray-400 justify-center md:justify-start">
                {!isUserPlaylist && playlist.creator && playlist.creator.avatarUrl && (
                  <div className="flex items-center gap-2">
                    <img src={playlist.creator.avatarUrl} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                    <span>{playlist.creator.nickname || '未知用户'}</span>
                  </div>
                )}
                <span>{playlist.trackCount || tracks.length} 首</span>
                {!isUserPlaylist && <span>{formatCount(playlist.playCount || 0)} 次播放</span>}
              </div>

              {playlist.description && <p className="text-sm text-gray-400 mt-3 line-clamp-3">{playlist.description}</p>}

              {!isUserPlaylist && playlist.tags && playlist.tags.length > 0 && (
                <div className="flex gap-2 mt-3 justify-center md:justify-start">
                  {playlist.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6 justify-center md:justify-start">
                <button onClick={() => tracks.length > 0 && playTrack(tracks[0], tracks)}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-muse-500 to-pink-500 text-white font-medium hover:shadow-neon-purple transition-all hover:scale-[1.02] active:scale-95">
                  <HiPlay className="w-5 h-5" /> 播放全部
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {tracks.length > 0 ? (
          <SongList tracks={tracks} playlistId={isUserPlaylist ? id : undefined} onRemoveSong={handleRemoveSong} />
        ) : (
          <div className="text-center py-20">
            <HiMusicalNote className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">该歌单暂无歌曲</p>
          </div>
        )}
      </div>
    </div>
  );
}
