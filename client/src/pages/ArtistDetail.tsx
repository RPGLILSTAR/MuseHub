import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiMusicalNote, HiPlay } from 'react-icons/hi2';
import { musicFullApi } from '@/services/musicApi';
import { usePlayerStore } from '@/store/playerStore';
import SongList from '@/components/music/SongList';
import { DetailPageSkeleton } from '@/components/common/Skeleton';
import type { Track } from '@/types';
import type { Artist, Album } from '@/types/music';

export default function ArtistDetail() {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [hotSongs, setHotSongs] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [desc, setDesc] = useState('');
  const [tab, setTab] = useState<'songs' | 'albums' | 'about'>('songs');
  const [loading, setLoading] = useState(true);
  const { playTrack } = usePlayerStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      musicFullApi.getArtistDetail(parseInt(id)),
      musicFullApi.getArtistAlbums(parseInt(id)),
    ]).then(([detail, albumData]) => {
      setArtist(detail.artist);
      setHotSongs(detail.hotSongs);
      setDesc(detail.desc || '');
      setAlbums(albumData);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailPageSkeleton />;
  if (!artist) return <div className="min-h-screen flex items-center justify-center text-gray-400">歌手未找到</div>;

  return (
    <div className="min-h-screen pt-20">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={artist.picUrl} alt="" className="w-full h-full object-cover opacity-15 blur-3xl scale-125" />
          <div className="absolute inset-0 bg-dark-950/70" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <Link to="/music" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-sm text-sm text-white hover:bg-white/20 transition-colors mb-8">
            <HiArrowLeft className="w-4 h-4" /> 返回
          </Link>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-8 items-center md:items-end">
            <img src={artist.picUrl} alt={artist.name} className="w-48 h-48 rounded-full object-cover border-4 border-white/10 shadow-glass" />
            <div className="text-center md:text-left">
              <p className="text-xs text-muse-300 font-medium uppercase tracking-wider mb-2">歌手</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white">{artist.name}</h1>
              {artist.alias.length > 0 && <p className="text-gray-400 mt-1">{artist.alias.join(' / ')}</p>}
              <div className="flex gap-4 mt-3 text-sm text-gray-400 justify-center md:justify-start">
                <span><HiMusicalNote className="w-4 h-4 inline mr-1" />{artist.musicSize} 首歌</span>
                <span>{artist.albumSize} 张专辑</span>
              </div>
              <button
                onClick={() => hotSongs.length > 0 && playTrack(hotSongs[0], hotSongs)}
                className="mt-5 flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-muse-500 to-pink-500 text-white font-medium hover:shadow-neon-purple transition-all mx-auto md:mx-0"
              >
                <HiPlay className="w-5 h-5" /> 播放热门
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-1 mb-6">
          {(['songs', 'albums', 'about'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:text-white'}`}>
              {t === 'songs' ? '热门歌曲' : t === 'albums' ? '专辑' : '简介'}
            </button>
          ))}
        </div>

        {tab === 'songs' && <SongList tracks={hotSongs} />}

        {tab === 'albums' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album, i) => (
              <motion.div key={album.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/music/album/${album.id}`} className="block group">
                  <div className="glass-card overflow-hidden">
                    <div className="aspect-square overflow-hidden">
                      <img src={album.picUrl} alt={album.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-white truncate group-hover:text-muse-300 transition-colors">{album.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{new Date(album.publishTime).getFullYear()}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'about' && (
          <div className="glass rounded-2xl p-8">
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{desc || '暂无歌手简介'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
