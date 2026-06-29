import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiHeart, HiClock, HiPlusCircle, HiTrash, HiXMark, HiMusicalNote, HiArrowLeft, HiQueueList } from 'react-icons/hi2';
import { musicFullApi } from '@/services/musicApi';
import { useMusicLibrarySyncStore } from '@/store/musicLibrarySyncStore';
import SongList from '@/components/music/SongList';
import type { Track } from '@/types';
import type { UserPlaylist } from '@/types/music';

export default function MyMusic() {
  const [tab, setTab] = useState<'liked' | 'history' | 'playlists'>('liked');
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [historyTracks, setHistoryTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const historyRev = useMusicLibrarySyncStore((s) => s.historyRev);
  const likedRev = useMusicLibrarySyncStore((s) => s.likedRev);
  const prevSyncRef = useRef<{ tab: typeof tab; historyRev: number; likedRev: number } | null>(null);

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      switch (tab) {
        case 'liked': {
          const d = await musicFullApi.getLikedSongs();
          setLikedTracks(d.tracks || []);
          break;
        }
        case 'history': {
          const d = await musicFullApi.getPlayHistory();
          setHistoryTracks(d.tracks || []);
          break;
        }
        case 'playlists': {
          const d = await musicFullApi.getUserPlaylists();
          setPlaylists(d);
          break;
        }
      }
    } catch (err) { console.error(err); }
    finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    const p = prevSyncRef.current;
    const isFirst = !p;
    const tabChanged = p ? p.tab !== tab : true;
    const revChanged =
      !isFirst &&
      !tabChanged &&
      (p!.historyRev !== historyRev || p!.likedRev !== likedRev);
    prevSyncRef.current = { tab, historyRev, likedRev };
    if (isFirst) {
      void fetchData({ silent: false });
    } else if (tabChanged) {
      void fetchData({ silent: false });
    } else if (revChanged) {
      void fetchData({ silent: true });
    }
  }, [tab, historyRev, likedRev, fetchData]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await musicFullApi.createPlaylist(newName, newDesc);
      setNewName(''); setNewDesc(''); setShowCreateDialog(false);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try { await musicFullApi.deletePlaylist(id); fetchData(); } catch {}
  };

  const tabs = [
    { key: 'liked' as const, label: '我喜欢的', icon: HiHeart },
    { key: 'history' as const, label: '最近播放', icon: HiClock },
    { key: 'playlists' as const, label: '我的歌单', icon: HiQueueList },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/music" className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <HiArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <HiMusicalNote className="w-6 h-6 text-muse-400" />
        <h1 className="text-3xl font-bold"><span className="gradient-text">我的音乐</span></h1>
      </div>
      <p className="text-gray-400 mb-8 ml-12">管理你的收藏、播放历史和自建歌单</p>

      <div className="flex gap-2 mb-8">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === key ? 'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse-soft" />)}</div>
      ) : (
        <>
          {tab === 'liked' && (
            likedTracks.length > 0
              ? <SongList tracks={likedTracks} />
              : <EmptyHint icon="❤️" text="还没有喜欢的歌曲" sub="播放歌曲时点击心形按钮来收藏" />
          )}

          {tab === 'history' && (
            historyTracks.length > 0
              ? <SongList tracks={historyTracks} />
              : <EmptyHint icon="⏱️" text="还没有播放记录" sub="播放歌曲后会自动记录在这里" />
          )}

          {tab === 'playlists' && (
            <div>
              <button onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl glass border border-dashed border-white/20 text-sm text-gray-300 hover:text-white hover:border-muse-500/50 transition-all mb-6 w-full justify-center">
                <HiPlusCircle className="w-5 h-5" /> 新建歌单
              </button>

              {playlists.length === 0 ? (
                <EmptyHint icon="📝" text="还没有创建歌单" sub="点击上方按钮创建你的第一个歌单" />
              ) : (
                <div className="space-y-3">
                  {playlists.map((pl, i) => (
                    <Link key={pl.id} to={`/music/playlist/${pl.id}`}>
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="glass rounded-xl p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/5 transition-all">
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-muse-600 to-pink-600 flex items-center justify-center flex-shrink-0 group-hover:shadow-neon-purple transition-shadow">
                          <HiQueueList className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate group-hover:text-muse-300 transition-colors">{pl.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{(pl.tracks && pl.tracks.length) || (pl.songIds && pl.songIds.length) || 0} 首歌 · 创建于 {new Date(pl.createdAt).toLocaleDateString('zh-CN')}</p>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); handleDelete(pl.id); }}
                          className="p-2 rounded-lg text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showCreateDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-md border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">新建歌单</h3>
                <button onClick={() => setShowCreateDialog(false)} className="p-1 rounded-lg hover:bg-white/10"><HiXMark className="w-5 h-5 text-gray-400" /></button>
              </div>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="歌单名称"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50 transition-colors mb-3" />
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="歌单描述（可选）" rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50 transition-colors mb-4 resize-none" />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowCreateDialog(false)} className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">取消</button>
                <button onClick={handleCreate} className="px-6 py-2.5 rounded-xl bg-muse-500 text-white font-medium text-sm hover:bg-muse-400 transition-colors">创建</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyHint({ icon, text, sub }: { icon: string; text: string; sub: string }) {
  return (
    <div className="text-center py-20 glass rounded-2xl">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-gray-400">{text}</p>
      <p className="text-sm text-gray-600 mt-1">{sub}</p>
    </div>
  );
}
