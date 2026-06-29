import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiMagnifyingGlass, HiFire } from 'react-icons/hi2';
import { musicFullApi } from '@/services/musicApi';
import SongList from '@/components/music/SongList';
import PlaylistCard from '@/components/music/PlaylistCard';
import type { Track, Playlist } from '@/types';
import type { Artist, Album } from '@/types/music';

const searchTypes = [
  { key: 1, label: '歌曲' },
  { key: 10, label: '专辑' },
  { key: 100, label: '歌手' },
  { key: 1000, label: '歌单' },
] as const;

export default function MusicSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [input, setInput] = useState(q);
  const [type, setType] = useState(1);
  const [loading, setLoading] = useState(false);

  const [songs, setSongs] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [hotSearch, setHotSearch] = useState<{ searchWord: string; content: string }[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    musicFullApi.getHotSearch().then(setHotSearch).catch(() => {});
  }, []);

  const doSearch = useCallback(async (keyword: string, searchType: number) => {
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const result = await musicFullApi.search(keyword, searchType);
      setTotal(result.total || 0);
      switch (searchType) {
        case 1: setSongs(result.songs || []); break;
        case 10: setAlbums(result.albums || []); break;
        case 100: setArtists(result.artists || []); break;
        case 1000: setPlaylists(result.playlists || []); break;
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (q) {
      setInput(q);
      doSearch(q, type);
    }
  }, [q, type, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSearchParams({ q: input.trim() });
  };

  const handleHotClick = (word: string) => {
    setInput(word);
    setSearchParams({ q: word });
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/music" className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <HiArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <h1 className="text-2xl font-bold text-white">音乐搜索</h1>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="glass rounded-2xl p-1.5 flex items-center gap-3 px-4">
          <HiMagnifyingGlass className="w-5 h-5 text-muse-400 flex-shrink-0" />
          <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="搜索歌曲、歌手、专辑、歌单..."
            className="flex-1 bg-transparent py-3 text-white placeholder-gray-500 outline-none" autoFocus />
          <button type="submit" className="px-5 py-2 rounded-xl bg-muse-500 text-white text-sm font-medium hover:bg-muse-400 transition-colors">搜索</button>
        </div>
      </form>

      {q ? (
        <>
          <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
            {searchTypes.map((t) => (
              <button key={t.key} onClick={() => setType(t.key)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${type === t.key ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                {t.label}
                {type === t.key && (
                  <motion.div layoutId="search-tab" className="absolute inset-0 bg-white/10 rounded-xl border border-white/10" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
              </button>
            ))}
            {total > 0 && <span className="text-xs text-gray-500 self-center ml-2">共 {total} 条结果</span>}
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse-soft" />)}</div>
          ) : (
            <>
              {type === 1 && (songs.length > 0 ? <SongList tracks={songs} /> : <EmptyState text="未找到相关歌曲" />)}

              {type === 10 && (albums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {albums.map((album, i) => (
                    <motion.div key={album.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/music/album/${album.id}`} className="block group">
                        <div className="glass-card overflow-hidden">
                          <div className="aspect-square overflow-hidden"><img src={album.picUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /></div>
                          <div className="p-3">
                            <h3 className="text-sm font-medium text-white truncate group-hover:text-muse-300 transition-colors">{album.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">{album.artist.name}</p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : <EmptyState text="未找到相关专辑" />)}

              {type === 100 && (artists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {artists.map((artist, i) => (
                    <motion.div key={artist.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/music/artist/${artist.id}`} className="block group text-center">
                        <div className="glass-card p-4">
                          <img src={artist.picUrl} alt="" className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-white/10 group-hover:border-muse-500/50 transition-colors" />
                          <h3 className="text-sm font-medium text-white mt-3 group-hover:text-muse-300 transition-colors">{artist.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{artist.musicSize} 首歌</p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : <EmptyState text="未找到相关歌手" />)}

              {type === 1000 && (playlists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {playlists.map((p, i) => <PlaylistCard key={p.id} playlist={p} index={i} />)}
                </div>
              ) : <EmptyState text="未找到相关歌单" />)}
            </>
          )}
        </>
      ) : (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HiFire className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white">热搜榜</h2>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {hotSearch.slice(0, 20).map((item, i) => (
                <button key={item.searchWord} onClick={() => handleHotClick(item.searchWord)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left">
                  <span className={`w-5 text-center text-sm font-bold ${i < 3 ? 'text-orange-400' : 'text-gray-500'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white">{item.searchWord}</span>
                    {item.content && <p className="text-xs text-gray-500 truncate mt-0.5">{item.content}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-center py-20 glass rounded-2xl"><p className="text-4xl mb-3">🔍</p><p className="text-gray-400">{text}</p></div>;
}
