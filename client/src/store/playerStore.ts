import { create } from 'zustand';
import type { Track, LyricLine } from '@/types';
import { musicFullApi } from '@/services/musicApi';
import { useMusicLibrarySyncStore } from '@/store/musicLibrarySyncStore';

type PlayMode = 'list' | 'random' | 'single';

interface PlayerState {
  currentTrack: Track | null;
  playlist: Track[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isExpanded: boolean;
  isQueueOpen: boolean;
  lyrics: LyricLine[];
  audioElement: HTMLAudioElement | null;
  playMode: PlayMode;

  initAudio: () => void;
  playTrack: (track: Track, list?: Track[]) => Promise<void>;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (v: number) => void;
  seekTo: (time: number) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  toggleExpand: () => void;
  toggleQueue: () => void;
  setPlaylist: (tracks: Track[]) => void;
  removeFromQueue: (index: number) => void;
  cyclePlayMode: () => void;
}

function updateMediaSession(track: Track | null, isPlaying: boolean) {
  if (!('mediaSession' in navigator) || !track) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.name,
    artist: track.artists.map(a => a.name).join(' / '),
    album: track.album.name || '',
    artwork: track.album.picUrl
      ? [
          { src: track.album.picUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: track.album.picUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: track.album.picUrl, sizes: '512x512', type: 'image/jpeg' },
        ]
      : [],
  });
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
}

function setupMediaSessionHandlers(store: () => PlayerState) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.setActionHandler('play', () => store().togglePlay());
  navigator.mediaSession.setActionHandler('pause', () => store().togglePlay());
  navigator.mediaSession.setActionHandler('previoustrack', () => store().prevTrack());
  navigator.mediaSession.setActionHandler('nexttrack', () => store().nextTrack());
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime != null) store().seekTo(details.seekTime);
  });
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  let mediaSessionInitialized = false;

  return {
    currentTrack: null,
    playlist: [],
    currentIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isExpanded: false,
    isQueueOpen: false,
    lyrics: [],
    audioElement: null,
    playMode: 'list',

    initAudio: () => {
      if (get().audioElement) return;
      const audio = new Audio();
      audio.volume = get().volume;

      audio.addEventListener('timeupdate', () => {
        set({ currentTime: audio.currentTime });
        if ('mediaSession' in navigator && !isNaN(audio.duration)) {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime,
          });
        }
      });
      audio.addEventListener('loadedmetadata', () => {
        set({ duration: audio.duration });
      });
      audio.addEventListener('ended', () => {
        const { playMode } = get();
        if (playMode === 'single') {
          const a = get().audioElement;
          if (a) { a.currentTime = 0; a.play().catch(() => {}); }
        } else {
          get().nextTrack();
        }
      });
      audio.addEventListener('error', () => {
        console.error('Audio playback error');
        set({ isPlaying: false });
      });

      if (!mediaSessionInitialized) {
        setupMediaSessionHandlers(get as unknown as () => PlayerState);
        mediaSessionInitialized = true;
      }

      set({ audioElement: audio });
    },

    playTrack: async (track, list) => {
      const state = get();
      if (!state.audioElement) state.initAudio();
      const audio = get().audioElement!;

      if (list) {
        const idx = list.findIndex((t) => t.id === track.id);
        set({ playlist: list, currentIndex: idx >= 0 ? idx : 0 });
      } else {
        const idx = state.playlist.findIndex((t) => t.id === track.id);
        if (idx >= 0) set({ currentIndex: idx });
      }

      set({ currentTrack: track, isPlaying: false, currentTime: 0, duration: 0, lyrics: [] });
      updateMediaSession(track, false);

      try {
        const [urlData, lyricsData] = await Promise.all([
          musicFullApi.getSongUrl(track.id),
          musicFullApi.getLyric(track.id).catch(() => []),
        ]);

        if (urlData.url) {
          audio.src = urlData.url;
          audio.load();
          await audio.play();
          set({ isPlaying: true, lyrics: lyricsData as LyricLine[] });
          updateMediaSession(track, true);
          musicFullApi.addToHistory(track.id).then(() => {
            useMusicLibrarySyncStore.getState().notifyHistoryChanged();
          }).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to play track:', err);
      }
    },

    togglePlay: () => {
      const { audioElement, isPlaying, currentTrack } = get();
      if (!audioElement) return;
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play().catch(console.error);
      }
      const newPlaying = !isPlaying;
      set({ isPlaying: newPlaying });
      updateMediaSession(currentTrack, newPlaying);
    },

    nextTrack: () => {
      const { playlist, currentIndex, playMode } = get();
      if (playlist.length === 0) return;
      let nextIdx: number;
      if (playMode === 'random') {
        nextIdx = Math.floor(Math.random() * playlist.length);
      } else {
        nextIdx = (currentIndex + 1) % playlist.length;
      }
      get().playTrack(playlist[nextIdx]);
      set({ currentIndex: nextIdx });
    },

    prevTrack: () => {
      const { playlist, currentIndex } = get();
      if (playlist.length === 0) return;
      const prevIdx = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1;
      get().playTrack(playlist[prevIdx]);
      set({ currentIndex: prevIdx });
    },

    setVolume: (v) => {
      const { audioElement } = get();
      if (audioElement) audioElement.volume = v;
      set({ volume: v });
    },

    seekTo: (time) => {
      const { audioElement } = get();
      if (audioElement) audioElement.currentTime = time;
      set({ currentTime: time });
    },

    setCurrentTime: (t) => set({ currentTime: t }),
    setDuration: (d) => set({ duration: d }),
    toggleExpand: () => set((s) => ({ isExpanded: !s.isExpanded })),
    toggleQueue: () => set((s) => ({ isQueueOpen: !s.isQueueOpen })),
    setPlaylist: (tracks) => set({ playlist: tracks }),

    removeFromQueue: (index) => {
      const { playlist, currentIndex } = get();
      const updated = [...playlist];
      updated.splice(index, 1);
      let newIdx = currentIndex;
      if (index < currentIndex) newIdx--;
      if (newIdx >= updated.length) newIdx = 0;
      set({ playlist: updated, currentIndex: newIdx });
    },

    cyclePlayMode: () => {
      const modes: PlayMode[] = ['list', 'random', 'single'];
      const { playMode } = get();
      const next = modes[(modes.indexOf(playMode) + 1) % modes.length];
      set({ playMode: next });
    },
  };
});
