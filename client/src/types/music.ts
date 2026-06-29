export interface Artist {
  id: number;
  name: string;
  picUrl: string;
  albumSize: number;
  musicSize: number;
  briefDesc: string;
  alias: string[];
}

export interface Album {
  id: number;
  name: string;
  picUrl: string;
  artist: { id: number; name: string };
  publishTime: number;
  size: number;
  description: string;
}

export interface RankingList {
  id: number;
  name: string;
  coverImgUrl: string;
  updateFrequency: string;
  description: string;
  trackCount: number;
  playCount: number;
}

export interface MusicComment {
  commentId: number;
  user: { userId: number; nickname: string; avatarUrl: string };
  content: string;
  time: number;
  likedCount: number;
}

/** 本站歌曲评论（SQLite） */
export interface SiteSongComment {
  id: number;
  userId: number;
  username: string;
  avatar: string | null;
  content: string;
  createdAt: string;
}

export interface UserPlaylist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tracks: number[];
  songIds?: number[];
  createdAt: number;
  updatedAt: number;
}

export interface Banner {
  imageUrl: string;
  targetId: number;
  targetType: number;
}
