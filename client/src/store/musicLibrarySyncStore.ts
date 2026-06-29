import { create } from 'zustand';

/** 用于「我的音乐」等页面在播放写历史、收藏变更后主动刷新列表 */
export const useMusicLibrarySyncStore = create<{
  historyRev: number;
  likedRev: number;
  notifyHistoryChanged: () => void;
  notifyLikedChanged: () => void;
}>((set) => ({
  historyRev: 0,
  likedRev: 0,
  notifyHistoryChanged: () => set((s) => ({ historyRev: s.historyRev + 1 })),
  notifyLikedChanged: () => set((s) => ({ likedRev: s.likedRev + 1 })),
}));
