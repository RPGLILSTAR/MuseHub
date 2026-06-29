import axios from 'axios';
import type { Track, Playlist, LyricLine } from '@/types';
import type { Artist, Album, RankingList, MusicComment, SiteSongComment, UserPlaylist, Banner } from '@/types/music';
import { getAuthToken } from '@/store/authStore';

const api = axios.create({ baseURL: '/api/music', timeout: 15000 });
api.interceptors.request.use((c) => {
  const t = getAuthToken();
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

async function get<T>(url: string, params?: Record<string, any>): Promise<T> {
  const resp = await api.get(url, { params });
  const body = resp.data;
  return body?.data !== undefined ? body.data : body;
}

async function post<T>(url: string, data?: any): Promise<T> {
  const resp = await api.post(url, data);
  const body = resp.data;
  return body?.data !== undefined ? body.data : body;
}

async function del<T>(url: string): Promise<T> {
  const resp = await api.delete(url);
  return resp.data;
}

export const musicFullApi = {
  // ─── 搜索 ───
  search: (q: string, type = 1, page = 1) =>
    get<any>('/search', { q, type, page }),
  getHotSearch: () =>
    get<{ searchWord: string; score: number; content: string }[]>('/hot-search'),
  getSearchSuggestions: (q: string) =>
    get<any>('/search/suggest', { q }),

  // ─── 推荐 ───
  getBanners: () =>
    get<Banner[]>('/banners'),
  getPersonalized: () =>
    get<Playlist[]>('/personalized'),

  // ─── 歌单 ───
  getTopPlaylists: (limit = 30, cat = '全部') =>
    get<Playlist[]>('/playlists/top', { limit, cat }),
  getHQPlaylists: (limit = 20, cat = '全部') =>
    get<Playlist[]>('/playlists/highquality', { limit, cat }),
  getPlaylistCategories: () =>
    get<{ categories: Record<string, string>; sub: { name: string; category: number }[] }>('/playlists/categories'),
  getPlaylistDetail: (id: number) =>
    get<{ playlist: Playlist; tracks: Track[] }>(`/playlists/${id}`),

  // ─── 歌曲 ───
  getTopSongs: (type = 0) =>
    get<Track[]>('/songs/top', { type }),
  getNewSongs: () =>
    get<Track[]>('/songs/new'),
  getSongUrl: (id: number) =>
    get<{ url: string | null }>(`/songs/url/${id}`),
  getLyric: (id: number) =>
    get<LyricLine[]>(`/songs/lyric/${id}`),
  getSongComments: (id: number, limit = 20, offset = 0) =>
    get<{ comments: MusicComment[]; total: number; hotComments: MusicComment[] }>(`/songs/comments/${id}`, { limit, offset }),

  getSongSiteComments: (songId: number, limit = 50, offset = 0) =>
    get<SiteSongComment[]>(`/songs/site-comments/${songId}`, { limit, offset }),

  postSongSiteComment: (songId: number, content: string, songTitle?: string) =>
    post<SiteSongComment>(`/songs/site-comments/${songId}`, { content, songTitle }),

  deleteSongSiteComment: (commentId: number) =>
    del<{ success: boolean }>(`/songs/site-comments/${commentId}`),

  // ─── 歌手 ───
  getTopArtists: (limit = 50) =>
    get<Artist[]>('/artists/top', { limit }),
  getArtistDetail: (id: number) =>
    get<{ artist: Artist; hotSongs: Track[]; desc: string; introduction: { ti: string; txt: string }[] }>(`/artists/${id}`),
  getArtistAlbums: (id: number, limit = 30) =>
    get<Album[]>(`/artists/${id}/albums`, { limit }),

  // ─── 专辑 ───
  getNewAlbums: (limit = 30) =>
    get<Album[]>('/albums/new', { limit }),
  getAlbumDetail: (id: number) =>
    get<{ album: Album; songs: Track[] }>(`/albums/${id}`),

  // ─── 排行榜 ───
  getAllRankings: () =>
    get<RankingList[]>('/rankings'),
  getRankingDetail: (id: number) =>
    get<{ playlist: Playlist; tracks: Track[] }>(`/rankings/${id}`),

  // ─── 用户操作 ───
  toggleLike: (songId: number) =>
    post<{ liked: boolean; songId: number }>('/user/like', { songId }),
  getLikedStatus: (ids: number[]) =>
    get<Record<number, boolean>>('/user/liked/status', { ids: ids.join(',') }),
  getLikedSongs: () =>
    get<{ ids: number[]; tracks: Track[] }>('/user/liked'),
  addToHistory: (songId: number) =>
    post<void>('/user/history', { songId }),
  getPlayHistory: () =>
    get<{ ids: number[]; tracks: Track[] }>('/user/history'),

  // ─── 用户歌单 ───
  getUserPlaylists: () =>
    get<UserPlaylist[]>('/user/playlists'),
  getUserPlaylistDetail: (id: string | number) =>
    get<{ playlist: UserPlaylist; tracks: Track[] }>(`/user/playlists/${id}`),
  createPlaylist: (name: string, description = '') =>
    post<UserPlaylist>('/user/playlists', { name, description }),
  deletePlaylist: (id: string) =>
    del<any>(`/user/playlists/${id}`),
  addToPlaylist: (playlistId: string, songId: number) =>
    post<any>(`/user/playlists/${playlistId}/add`, { songId }),
  removeFromPlaylist: (playlistId: string, songId: number) =>
    post<any>(`/user/playlists/${playlistId}/remove`, { songId }),
};
