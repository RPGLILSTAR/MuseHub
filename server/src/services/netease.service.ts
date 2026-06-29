import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { Track, Playlist, LyricLine } from '../types';

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
  songs?: Track[];
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

export interface Comment {
  commentId: number;
  user: { userId: number; nickname: string; avatarUrl: string };
  content: string;
  time: number;
  likedCount: number;
}

class NeteaseService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.netease.baseUrl,
      timeout: 15000,
    });
  }

  private formatTrack(raw: any): Track {
    return {
      id: raw.id,
      name: raw.name,
      artists: (raw.ar || raw.artists || []).map((a: any) => ({
        id: a.id,
        name: a.name,
      })),
      album: {
        id: raw.al?.id || raw.album?.id || 0,
        name: raw.al?.name || raw.album?.name || '',
        picUrl: raw.al?.picUrl || raw.album?.picUrl || raw.album?.blurPicUrl || '',
      },
      duration: raw.dt || raw.duration || 0,
    };
  }

  private formatPlaylist(raw: any): Playlist {
    return {
      id: raw.id,
      name: raw.name,
      coverImgUrl: raw.coverImgUrl || raw.picUrl || '',
      description: raw.description,
      trackCount: raw.trackCount,
      playCount: raw.playCount,
      creator: {
        userId: raw.creator?.userId || 0,
        nickname: raw.creator?.nickname || '',
        avatarUrl: raw.creator?.avatarUrl || '',
      },
      tags: raw.tags || [],
    };
  }

  // ─── 歌单 ───
  async getTopPlaylists(limit = 30, cat = '全部'): Promise<Playlist[]> {
    const { data } = await this.client.get('/top/playlist', { params: { limit, cat } });
    return (data.playlists || []).map((p: any) => this.formatPlaylist(p));
  }

  async getPlaylistDetail(id: number): Promise<{ playlist: Playlist; tracks: Track[] }> {
    const { data } = await this.client.get('/playlist/detail', { params: { id } });
    const playlist = this.formatPlaylist(data.playlist);
    const tracks = (data.playlist?.tracks || []).map((t: any) => this.formatTrack(t));
    return { playlist, tracks };
  }

  async getHighQualityPlaylists(limit = 20, cat = '全部'): Promise<Playlist[]> {
    const { data } = await this.client.get('/top/playlist/highquality', { params: { limit, cat } });
    return (data.playlists || []).map((p: any) => this.formatPlaylist(p));
  }

  async getPlaylistCategories(): Promise<{ categories: Record<string, string>; sub: { name: string; category: number }[] }> {
    const { data } = await this.client.get('/playlist/catlist');
    return { categories: data.categories || {}, sub: data.sub || [] };
  }

  // ─── 歌曲 ───
  async getTopSongs(type = 0): Promise<Track[]> {
    const { data } = await this.client.get('/top/song', { params: { type } });
    return (data.data || []).map((t: any) => this.formatTrack(t));
  }

  async getSongUrl(id: number): Promise<string | null> {
    const { data } = await this.client.get('/song/url/v1', { params: { id, level: 'exhigh' } });
    return data.data?.[0]?.url || null;
  }

  async getSongDetail(ids: number[]): Promise<Track[]> {
    const { data } = await this.client.get('/song/detail', { params: { ids: ids.join(',') } });
    return (data.songs || []).map((t: any) => this.formatTrack(t));
  }

  async getLyric(id: number): Promise<LyricLine[]> {
    const { data } = await this.client.get('/lyric', { params: { id } });
    return this.parseLrc(data.lrc?.lyric || '');
  }

  async getNewSongs(): Promise<Track[]> {
    const { data } = await this.client.get('/personalized/newsong', { params: { limit: 30 } });
    return (data.result || []).map((item: any) => this.formatTrack(item.song || item));
  }

  async getRecommendSongs(): Promise<Track[]> {
    const { data } = await this.client.get('/personalized/newsong', { params: { limit: 50 } });
    return (data.result || []).map((item: any) => this.formatTrack(item.song || item));
  }

  // ─── 搜索（多类型）───
  async search(keyword: string, type = 1, page = 1, pageSize = 30): Promise<any> {
    const offset = (page - 1) * pageSize;
    const { data } = await this.client.get('/cloudsearch', {
      params: { keywords: keyword, limit: pageSize, offset, type },
    });
    const result = data.result || {};

    switch (type) {
      case 1: // 歌曲
        return {
          songs: (result.songs || []).map((t: any) => this.formatTrack(t)),
          total: result.songCount || 0,
        };
      case 10: // 专辑
        return {
          albums: (result.albums || []).map((a: any) => this.formatAlbum(a)),
          total: result.albumCount || 0,
        };
      case 100: // 歌手
        return {
          artists: (result.artists || []).map((a: any) => this.formatArtist(a)),
          total: result.artistCount || 0,
        };
      case 1000: // 歌单
        return {
          playlists: (result.playlists || []).map((p: any) => this.formatPlaylist(p)),
          total: result.playlistCount || 0,
        };
      default:
        return result;
    }
  }

  async searchSongs(keyword: string, page = 1, pageSize = 30): Promise<{ tracks: Track[]; total: number }> {
    const result = await this.search(keyword, 1, page, pageSize);
    return { tracks: result.songs || [], total: result.total || 0 };
  }

  async getHotSearchList(): Promise<{ searchWord: string; score: number; content: string }[]> {
    const { data } = await this.client.get('/search/hot/detail');
    return (data.data || []).map((item: any) => ({
      searchWord: item.searchWord,
      score: item.score,
      content: item.content || '',
    }));
  }

  async getSearchSuggestions(keyword: string): Promise<any> {
    const { data } = await this.client.get('/search/suggest', { params: { keywords: keyword } });
    return data.result || {};
  }

  // ─── 歌手 ───
  private formatArtist(raw: any): Artist {
    return {
      id: raw.id,
      name: raw.name,
      picUrl: raw.picUrl || raw.img1v1Url || '',
      albumSize: raw.albumSize || 0,
      musicSize: raw.musicSize || 0,
      briefDesc: raw.briefDesc || '',
      alias: raw.alias || [],
    };
  }

  async getArtistDetail(id: number): Promise<{ artist: Artist; hotSongs: Track[] }> {
    const { data } = await this.client.get('/artists', { params: { id } });
    return {
      artist: this.formatArtist(data.artist || {}),
      hotSongs: (data.hotSongs || []).map((t: any) => this.formatTrack(t)),
    };
  }

  async getArtistAlbums(id: number, limit = 30): Promise<Album[]> {
    const { data } = await this.client.get('/artist/album', { params: { id, limit } });
    return (data.hotAlbums || []).map((a: any) => this.formatAlbum(a));
  }

  async getArtistDesc(id: number): Promise<{ briefDesc: string; introduction: { ti: string; txt: string }[] }> {
    const { data } = await this.client.get('/artist/desc', { params: { id } });
    return { briefDesc: data.briefDesc || '', introduction: data.introduction || [] };
  }

  async getArtistMv(id: number, limit = 20): Promise<any[]> {
    const { data } = await this.client.get('/artist/mv', { params: { id, limit } });
    return data.mvs || [];
  }

  async getTopArtists(limit = 50): Promise<Artist[]> {
    const { data } = await this.client.get('/top/artists', { params: { limit } });
    return (data.artists || []).map((a: any) => this.formatArtist(a));
  }

  async getArtistList(type = -1, area = -1, limit = 50, offset = 0): Promise<Artist[]> {
    const { data } = await this.client.get('/artist/list', { params: { type, area, limit, offset } });
    return (data.artists || []).map((a: any) => this.formatArtist(a));
  }

  // ─── 专辑 ───
  private formatAlbum(raw: any): Album {
    return {
      id: raw.id,
      name: raw.name,
      picUrl: raw.picUrl || raw.blurPicUrl || '',
      artist: { id: raw.artist?.id || 0, name: raw.artist?.name || '' },
      publishTime: raw.publishTime || 0,
      size: raw.size || 0,
      description: raw.description || '',
    };
  }

  async getAlbumDetail(id: number): Promise<{ album: Album; songs: Track[] }> {
    const { data } = await this.client.get('/album', { params: { id } });
    const album = this.formatAlbum(data.album || {});
    const songs = (data.songs || []).map((t: any) => this.formatTrack(t));
    album.songs = songs;
    return { album, songs };
  }

  async getNewAlbums(limit = 30): Promise<Album[]> {
    const { data } = await this.client.get('/album/newest', { params: { limit } });
    return (data.albums || []).map((a: any) => this.formatAlbum(a));
  }

  // ─── 排行榜 ───
  async getAllRankings(): Promise<RankingList[]> {
    const { data } = await this.client.get('/toplist');
    return (data.list || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      coverImgUrl: r.coverImgUrl || '',
      updateFrequency: r.updateFrequency || '',
      description: r.description || '',
      trackCount: r.trackCount || 0,
      playCount: r.playCount || 0,
    }));
  }

  async getRankingDetail(id: number): Promise<{ playlist: Playlist; tracks: Track[] }> {
    return this.getPlaylistDetail(id);
  }

  // ─── 推荐 ───
  async getPersonalizedPlaylists(limit = 12): Promise<Playlist[]> {
    const { data } = await this.client.get('/personalized', { params: { limit } });
    return (data.result || []).map((p: any) => this.formatPlaylist(p));
  }

  async getBanners(): Promise<{ imageUrl: string; targetId: number; targetType: number }[]> {
    const { data } = await this.client.get('/banner', { params: { type: 0 } });
    return (data.banners || []).map((b: any) => ({
      imageUrl: b.imageUrl,
      targetId: b.targetId,
      targetType: b.targetType,
    }));
  }

  // ─── 评论 ───
  async getSongComments(id: number, limit = 20, offset = 0): Promise<{ comments: Comment[]; total: number; hotComments: Comment[] }> {
    const { data } = await this.client.get('/comment/music', { params: { id, limit, offset } });
    const fmt = (c: any): Comment => ({
      commentId: c.commentId,
      user: { userId: c.user?.userId, nickname: c.user?.nickname, avatarUrl: c.user?.avatarUrl },
      content: c.content,
      time: c.time,
      likedCount: c.likedCount || 0,
    });
    return {
      comments: (data.comments || []).map(fmt),
      total: data.total || 0,
      hotComments: (data.hotComments || []).map(fmt),
    };
  }

  // ─── 工具 ───
  private parseLrc(lrc: string): LyricLine[] {
    const lines: LyricLine[] = [];
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(lrc)) !== null) {
      const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3].padEnd(3, '0')) / 1000;
      const text = match[4].trim();
      if (text) lines.push({ time, text });
    }
    return lines.sort((a, b) => a.time - b.time);
  }
}

export const neteaseService = new NeteaseService();
