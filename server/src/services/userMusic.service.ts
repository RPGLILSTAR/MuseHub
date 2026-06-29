import { Track } from '../types';

interface UserPlaylist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tracks: number[];
  createdAt: number;
  updatedAt: number;
}

class UserMusicService {
  private likedSongs: Set<number> = new Set();
  private playlists: Map<string, UserPlaylist> = new Map();
  private playHistory: number[] = [];
  private counter = 0;

  constructor() {
    this.playlists.set('default-liked', {
      id: 'default-liked',
      name: '我喜欢的音乐',
      description: '你收藏的所有喜欢的歌曲',
      coverUrl: '',
      tracks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  toggleLike(songId: number): boolean {
    if (this.likedSongs.has(songId)) {
      this.likedSongs.delete(songId);
      const pl = this.playlists.get('default-liked')!;
      pl.tracks = pl.tracks.filter((id) => id !== songId);
      return false;
    } else {
      this.likedSongs.add(songId);
      const pl = this.playlists.get('default-liked')!;
      pl.tracks.unshift(songId);
      return true;
    }
  }

  isLiked(songId: number): boolean {
    return this.likedSongs.has(songId);
  }

  getLikedIds(): number[] {
    return Array.from(this.likedSongs);
  }

  addToHistory(songId: number) {
    this.playHistory = [songId, ...this.playHistory.filter((id) => id !== songId)].slice(0, 200);
  }

  getHistory(): number[] {
    return this.playHistory;
  }

  createPlaylist(name: string, description = ''): UserPlaylist {
    const id = `user-pl-${++this.counter}-${Date.now()}`;
    const pl: UserPlaylist = {
      id,
      name,
      description,
      coverUrl: '',
      tracks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.playlists.set(id, pl);
    return pl;
  }

  deletePlaylist(id: string): boolean {
    if (id === 'default-liked') return false;
    return this.playlists.delete(id);
  }

  renamePlaylist(id: string, name: string): UserPlaylist | null {
    const pl = this.playlists.get(id);
    if (!pl || id === 'default-liked') return null;
    pl.name = name;
    pl.updatedAt = Date.now();
    return pl;
  }

  addToPlaylist(playlistId: string, songId: number): boolean {
    const pl = this.playlists.get(playlistId);
    if (!pl) return false;
    if (pl.tracks.includes(songId)) return false;
    pl.tracks.unshift(songId);
    pl.updatedAt = Date.now();
    return true;
  }

  removeFromPlaylist(playlistId: string, songId: number): boolean {
    const pl = this.playlists.get(playlistId);
    if (!pl) return false;
    pl.tracks = pl.tracks.filter((id) => id !== songId);
    pl.updatedAt = Date.now();
    return true;
  }

  getAllPlaylists(): UserPlaylist[] {
    return Array.from(this.playlists.values());
  }

  getPlaylist(id: string): UserPlaylist | null {
    return this.playlists.get(id) || null;
  }
}

export const userMusicService = new UserMusicService();
