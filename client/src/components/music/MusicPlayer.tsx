import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPlay, HiPause, HiForward, HiBackward,
  HiSpeakerWave, HiSpeakerXMark,
  HiChevronUp, HiChevronDown, HiQueueList, HiHeart, HiXMark,
} from 'react-icons/hi2';
import { TbRepeat, TbRepeatOnce, TbArrowsShuffle } from 'react-icons/tb';
import { usePlayerStore } from '@/store/playerStore';
import { musicFullApi } from '@/services/musicApi';
import { useMusicLibrarySyncStore } from '@/store/musicLibrarySyncStore';
import VinylRecord from './VinylRecord';
import LyricsScroll from './LyricsScroll';
import SongCommentsPanel from './SongCommentsPanel';
import PlaylistMenu from './PlaylistMenu';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MusicPlayer() {
  const {
    currentTrack, isPlaying, currentTime, duration, volume, playlist,
    isExpanded, isQueueOpen, lyrics, playMode, currentIndex, initAudio,
    togglePlay, nextTrack, prevTrack, setVolume, seekTo, toggleExpand,
    toggleQueue, cyclePlayMode, playTrack, removeFromQueue,
  } = usePlayerStore();

  useEffect(() => { initAudio(); }, [initAudio]);

  const [expandedTab, setExpandedTab] = useState<'lyrics' | 'comments'>('lyrics');
  useEffect(() => {
    setExpandedTab('lyrics');
  }, [currentTrack?.id]);

  const [currentLiked, setCurrentLiked] = useState(false);
  const notifyLikedChanged = useMusicLibrarySyncStore((s) => s.notifyLikedChanged);
  const likedRev = useMusicLibrarySyncStore((s) => s.likedRev);

  useEffect(() => {
    const id = currentTrack?.id;
    if (id == null) {
      setCurrentLiked(false);
      return;
    }
    let cancelled = false;
    musicFullApi
      .getLikedStatus([id])
      .then((m) => {
        if (!cancelled) setCurrentLiked(!!m[id]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentTrack?.id, likedRev]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      seekTo(((e.clientX - rect.left) / rect.width) * duration);
    },
    [duration, seekTo]
  );

  const handleVolumeClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
    },
    [setVolume]
  );

  const handleLike = useCallback(() => {
    if (!currentTrack) return;
    const previousLiked = currentLiked;
    setCurrentLiked(!previousLiked);
    musicFullApi
      .toggleLike(currentTrack.id)
      .then((result) => {
        setCurrentLiked(result.liked);
        notifyLikedChanged();
      })
      .catch(() => {
        setCurrentLiked(previousLiked);
      });
  }, [currentTrack, currentLiked, notifyLikedChanged]);

  if (!currentTrack) return null;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const PlayModeIcon = playMode === 'single' ? TbRepeatOnce : playMode === 'random' ? TbArrowsShuffle : TbRepeat;
  const modeLabel = playMode === 'single' ? '单曲循环' : playMode === 'random' ? '随机播放' : '列表循环';

  return (
    <>
      {/* Expanded Full Screen */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="fixed inset-0 z-[70]">
            <div className="absolute inset-0" style={{ backgroundImage: currentTrack.album.picUrl ? `url(${currentTrack.album.picUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(80px) brightness(0.3)', transform: 'scale(1.2)' }} />
            <div className="absolute inset-0 bg-dark-950/70 backdrop-blur-sm" />

            <div className="relative z-10 h-full flex flex-col min-h-0">
              <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
                <button onClick={toggleExpand} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><HiChevronDown className="w-6 h-6 text-white" /></button>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">{currentTrack.name}</p>
                  <p className="text-xs text-gray-400">{currentTrack.artists.map((a) => a.name).join(' / ')}</p>
                </div>
                <button onClick={toggleQueue} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><HiQueueList className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="flex justify-center gap-2 px-4 pb-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setExpandedTab('lyrics')}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${expandedTab === 'lyrics' ? 'bg-white/15 text-white border border-white/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  歌词
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedTab('comments')}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${expandedTab === 'comments' ? 'bg-white/15 text-white border border-white/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  评论
                </button>
              </div>

              <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-1 sm:px-2">
                {expandedTab === 'lyrics' ? (
                  <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-4 overflow-hidden min-h-0">
                    <div className="flex-shrink-0"><VinylRecord albumArt={currentTrack.album.picUrl} isPlaying={isPlaying} size={Math.min(320, window.innerWidth - 80)} /></div>
                    <div className="w-full lg:w-96 h-64 lg:h-96 min-h-0"><LyricsScroll lyrics={lyrics} currentTime={currentTime} /></div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 flex justify-center py-2 overflow-hidden">
                    <SongCommentsPanel songId={currentTrack.id} songName={currentTrack.name} />
                  </div>
                )}
              </div>

              <div className="px-6 pb-8 space-y-4 flex-shrink-0">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="w-10 text-right">{formatTime(currentTime)}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group" onClick={handleProgressClick}>
                    <motion.div className="h-full bg-gradient-to-r from-muse-500 to-pink-500 rounded-full relative" style={{ width: `${progress}%` }}>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </div>
                  <span className="w-10">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-center gap-6">
                  <button onClick={cyclePlayMode} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title={modeLabel}><PlayModeIcon className="w-5 h-5 text-gray-400" /></button>
                  <button onClick={prevTrack} className="p-3 rounded-full hover:bg-white/10 transition-colors"><HiBackward className="w-7 h-7 text-white" /></button>
                  <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-gradient-to-r from-muse-500 to-pink-500 flex items-center justify-center shadow-neon-purple hover:scale-105 active:scale-95 transition-transform">
                    {isPlaying ? <HiPause className="w-8 h-8 text-white" /> : <HiPlay className="w-8 h-8 text-white ml-1" />}
                  </button>
                  <button onClick={nextTrack} className="p-3 rounded-full hover:bg-white/10 transition-colors"><HiForward className="w-7 h-7 text-white" /></button>
                  <PlaylistMenu songId={currentTrack.id} triggerClassName="p-2 rounded-lg hover:bg-white/10 transition-colors" />
                  <button type="button" onClick={handleLike} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-pressed={currentLiked}>
                    <HiHeart className={`w-5 h-5 transition-colors ${currentLiked ? 'text-pink-400 fill-pink-400' : 'text-gray-400 hover:text-pink-400'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setVolume(volume > 0 ? 0 : 0.7)} className="p-1">
                    {volume === 0 ? <HiSpeakerXMark className="w-4 h-4 text-gray-400" /> : <HiSpeakerWave className="w-4 h-4 text-gray-400" />}
                  </button>
                  <div className="w-24 h-1 bg-white/10 rounded-full cursor-pointer" onClick={handleVolumeClick}>
                    <div className="h-full bg-white/40 rounded-full" style={{ width: `${volume * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue Sidebar */}
      <AnimatePresence>
        {isQueueOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[75] bg-black/40" onClick={toggleQueue} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-[76] w-80 sm:w-96 glass border-l border-white/10 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h3 className="text-white font-bold">播放队列</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{playlist.length} 首</span>
                  <button onClick={toggleQueue} className="p-1.5 rounded-lg hover:bg-white/10"><HiXMark className="w-4 h-4 text-gray-400" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {playlist.map((track, i) => {
                  const isCurrent = i === currentIndex;
                  return (
                    <div key={`${track.id}-${i}`} onClick={() => playTrack(track)}
                      className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer group transition-colors ${isCurrent ? 'bg-muse-500/10' : 'hover:bg-white/5'}`}>
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                        <img src={track.album.picUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${isCurrent ? 'text-muse-300' : 'text-white'}`}>{track.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{track.artists.map(a => a.name).join(' / ')}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
                        className="p-1 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <HiXMark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {playlist.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">队列为空</div>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mini Player Bar */}
      {!isExpanded && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed bottom-0 left-0 right-0 z-[60] glass border-t border-white/10">
          <div className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-muse-500 to-pink-500 transition-all duration-300" style={{ width: `${progress}%` }} />

          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
            <button onClick={toggleExpand} className="flex items-center gap-3 flex-1 min-w-0 group">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-muse-500/50 transition-colors">
                <img src={currentTrack.album.picUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">{currentTrack.name}</p>
                <p className="text-xs text-gray-400 truncate">{currentTrack.artists.map((a) => a.name).join(' / ')}</p>
              </div>
              <HiChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 flex-1 max-w-md mx-4">
              <span className="w-8 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer group" onClick={handleProgressClick}>
                <div className="h-full bg-gradient-to-r from-muse-500 to-pink-500 rounded-full relative" style={{ width: `${progress}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="w-8">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-1">
              <div className="hidden lg:block">
                <PlaylistMenu songId={currentTrack.id} triggerClassName="p-2 rounded-lg hover:bg-white/10 transition-colors" />
              </div>
              <button type="button" onClick={handleLike} className="p-2 rounded-lg hover:bg-white/10 transition-colors hidden lg:block" aria-pressed={currentLiked}>
                <HiHeart className={`w-4 h-4 transition-colors ${currentLiked ? 'text-pink-400 fill-pink-400' : 'text-gray-400 hover:text-pink-400'}`} />
              </button>
              <button onClick={prevTrack} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><HiBackward className="w-5 h-5 text-white" /></button>
              <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-gradient-to-r from-muse-500 to-pink-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                {isPlaying ? <HiPause className="w-5 h-5 text-white" /> : <HiPlay className="w-5 h-5 text-white ml-0.5" />}
              </button>
              <button onClick={nextTrack} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><HiForward className="w-5 h-5 text-white" /></button>
              <button onClick={cyclePlayMode} className="p-2 rounded-lg hover:bg-white/10 transition-colors hidden lg:block" title={modeLabel}><PlayModeIcon className="w-4 h-4 text-gray-400" /></button>
              <button onClick={toggleQueue} className="p-2 rounded-lg hover:bg-white/10 transition-colors hidden lg:block"><HiQueueList className="w-4 h-4 text-gray-400" /></button>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => setVolume(volume > 0 ? 0 : 0.7)} className="p-1">
                {volume === 0 ? <HiSpeakerXMark className="w-4 h-4 text-gray-400" /> : <HiSpeakerWave className="w-4 h-4 text-gray-400" />}
              </button>
              <div className="w-20 h-1 bg-white/10 rounded-full cursor-pointer" onClick={handleVolumeClick}>
                <div className="h-full bg-white/30 rounded-full" style={{ width: `${volume * 100}%` }} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
