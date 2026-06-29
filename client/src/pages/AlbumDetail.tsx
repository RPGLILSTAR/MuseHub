import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiPlay, HiCalendar, HiMusicalNote } from 'react-icons/hi2';
import { musicFullApi } from '@/services/musicApi';
import { usePlayerStore } from '@/store/playerStore';
import SongList from '@/components/music/SongList';
import { DetailPageSkeleton } from '@/components/common/Skeleton';
import type { Track } from '@/types';
import type { Album } from '@/types/music';

export default function AlbumDetail() {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [songs, setSongs] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = usePlayerStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    musicFullApi.getAlbumDetail(parseInt(id))
      .then(({ album: a, songs: s }) => { setAlbum(a); setSongs(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailPageSkeleton />;
  if (!album) return <div className="min-h-screen flex items-center justify-center text-gray-400">专辑未找到</div>;

  return (
    <div className="min-h-screen pt-20">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={album.picUrl} alt="" className="w-full h-full object-cover opacity-15 blur-3xl scale-125" />
          <div className="absolute inset-0 bg-dark-950/70" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <Link to="/music" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-sm text-sm text-white hover:bg-white/20 transition-colors mb-8">
            <HiArrowLeft className="w-4 h-4" /> 返回
          </Link>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-8">
            <img src={album.picUrl} alt={album.name} className="w-56 h-56 rounded-2xl object-cover shadow-glass border border-white/10 mx-auto md:mx-0" />
            <div className="flex-1 flex flex-col justify-end text-center md:text-left">
              <p className="text-xs text-muse-300 font-medium uppercase tracking-wider mb-2">专辑</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">{album.name}</h1>
              <Link to={`/music/artist/${album.artist.id}`} className="text-muse-300 hover:text-muse-200 mt-2 transition-colors">
                {album.artist.name}
              </Link>
              <div className="flex gap-4 mt-3 text-sm text-gray-400 justify-center md:justify-start">
                {album.publishTime > 0 && (
                  <span className="flex items-center gap-1"><HiCalendar className="w-4 h-4" />{new Date(album.publishTime).toLocaleDateString('zh-CN')}</span>
                )}
                <span className="flex items-center gap-1"><HiMusicalNote className="w-4 h-4" />{songs.length} 首</span>
              </div>
              <div className="flex gap-3 mt-6 justify-center md:justify-start">
                <button onClick={() => songs.length > 0 && playTrack(songs[0], songs)}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-muse-500 to-pink-500 text-white font-medium hover:shadow-neon-purple transition-all">
                  <HiPlay className="w-5 h-5" /> 播放全部
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <SongList tracks={songs} showAlbum={false} />
        {album.description && (
          <div className="glass rounded-2xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-white mb-3">专辑介绍</h3>
            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{album.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
