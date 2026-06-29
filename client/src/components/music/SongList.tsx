import { motion } from 'framer-motion';
import { HiPlay, HiHeart, HiXMark } from 'react-icons/hi2';
import { usePlayerStore } from '@/store/playerStore';
import { musicFullApi } from '@/services/musicApi';
import { useMusicLibrarySyncStore } from '@/store/musicLibrarySyncStore';
import PlaylistMenu from './PlaylistMenu';
import type { Track } from '@/types';
import { useState, useEffect, useMemo } from 'react';

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

interface SongListProps {
  tracks: Track[];
  showIndex?: boolean;
  showAlbum?: boolean;
  showHeader?: boolean;
  onPlayAll?: () => void;
  maxDelay?: number;
  playlistId?: string;
  onRemoveSong?: (songId: number) => void;
}

export default function SongList({ tracks, showIndex = true, showAlbum = true, showHeader = true, maxDelay = 0.6, playlistId, onRemoveSong }: SongListProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});

  const notifyLikedChanged = useMusicLibrarySyncStore((s) => s.notifyLikedChanged);
  const likedRev = useMusicLibrarySyncStore((s) => s.likedRev);
  const trackIdsKey = useMemo(() => tracks.map((t) => t.id).join(','), [tracks]);

  const handlePlay = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, tracks);
    }
  };

  useEffect(() => {
    const ids = trackIdsKey.split(',').map(Number).filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    musicFullApi
      .getLikedStatus(ids)
      .then((status) => {
        if (!cancelled) setLikedMap((prev) => ({ ...prev, ...status }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [trackIdsKey, likedRev]);

  const handleLike = async (e: React.MouseEvent, songId: number) => {
    e.stopPropagation();
    const previousLiked = !!likedMap[songId];
    setLikedMap((prev) => ({ ...prev, [songId]: !previousLiked }));
    try {
      const result = await musicFullApi.toggleLike(songId);
      setLikedMap((prev) => ({ ...prev, [songId]: result.liked }));
      notifyLikedChanged();
    } catch {
      setLikedMap((prev) => ({ ...prev, [songId]: previousLiked }));
    }
  };

  const handleRemoveFromPlaylist = async (e: React.MouseEvent, songId: number) => {
    e.stopPropagation();
    if (!playlistId) return;
    try {
      await musicFullApi.removeFromPlaylist(playlistId, songId);
      onRemoveSong?.(songId);
    } catch (err) {
      console.error('Failed to remove from playlist:', err);
    }
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {showHeader && (
        <div className="flex items-center gap-4 px-5 py-3 border-b border-white/5 text-xs text-gray-500 font-medium uppercase tracking-wider">
          {showIndex && <div className="w-8 text-center">#</div>}
          <div className="w-11" />
          <div className="flex-1">标题</div>
          {showAlbum && <div className="flex-shrink-0 w-40 hidden md:block">专辑</div>}
          <div className="w-10" />
          <div className="w-14 text-right">时长</div>
        </div>
      )}
      <div className="divide-y divide-white/[0.03]">
        {tracks.map((track, i) => {
          const isCurrent = currentTrack?.id === track.id;
          const isLiked = likedMap[track.id];
          return (
            <motion.div
              key={`${track.id}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.02, maxDelay) }}
              onClick={() => handlePlay(track)}
              className={`flex items-center gap-4 px-5 py-3 cursor-pointer group transition-all duration-200 ${
                isCurrent ? 'bg-muse-500/10' : 'hover:bg-white/5'
              }`}
            >
              {showIndex && (
                <div className="w-8 text-center flex-shrink-0">
                  {isCurrent && isPlaying ? (
                    <div className="flex items-center justify-center gap-0.5 h-5">
                      {[1, 2, 3].map((j) => (
                        <motion.div key={j} className="w-0.5 bg-muse-400 rounded-full"
                          animate={{ height: [4, 14, 4] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: j * 0.15 }}
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-gray-500 group-hover:hidden block">
                        {(i + 1).toString().padStart(2, '0')}
                      </span>
                      <HiPlay className="w-4 h-4 text-white hidden group-hover:block mx-auto" />
                    </>
                  )}
                </div>
              )}

              <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                <img src={track.album.picUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isCurrent ? 'text-muse-300' : 'text-white'}`}>
                  {track.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {track.artists.map((a) => a.name).join(' / ')}
                </p>
              </div>

              {showAlbum && (
                <span className="text-xs text-gray-500 flex-shrink-0 w-40 truncate hidden md:block">
                  {track.album.name}
                </span>
              )}

              <div className="flex items-center gap-2 flex-shrink-0">
                <PlaylistMenu songId={track.id} />
                {playlistId && (
                  <button
                    onClick={(e) => handleRemoveFromPlaylist(e, track.id)}
                    className="p-1.5 rounded-lg transition-colors text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"
                  >
                    <HiXMark className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => handleLike(e, track.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isLiked ? 'text-pink-400' : 'text-gray-600 hover:text-pink-400 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <HiHeart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>

              <span className="text-xs text-gray-600 flex-shrink-0 w-14 text-right">
                {formatDuration(track.duration)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
