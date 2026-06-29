import { Request, Response, NextFunction } from 'express';
import { neteaseService } from '../services/netease.service';
import { dbMusicService } from '../services/dbMusic.service';
import { AppError } from '../middleware/errorHandler';

export class MusicController {
  async getTopPlaylists(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      const cat = (req.query.cat as string) || '全部';
      res.json({ success: true, data: await neteaseService.getTopPlaylists(limit, cat) });
    } catch { next(new AppError('Failed to fetch top playlists', 502)); }
  }

  async getPlaylistDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid playlist ID', 400);
      res.json({ success: true, data: await neteaseService.getPlaylistDetail(id) });
    } catch (err) { if (err instanceof AppError) return next(err); next(new AppError('Failed to fetch playlist', 502)); }
  }

  async getHighQualityPlaylists(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const cat = (req.query.cat as string) || '全部';
      res.json({ success: true, data: await neteaseService.getHighQualityPlaylists(limit, cat) });
    } catch { next(new AppError('Failed to fetch HQ playlists', 502)); }
  }

  async getPlaylistCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await neteaseService.getPlaylistCategories() });
    } catch { next(new AppError('Failed to fetch playlist categories', 502)); }
  }

  async getTopSongs(req: Request, res: Response, next: NextFunction) {
    try {
      const type = parseInt(req.query.type as string) || 0;
      res.json({ success: true, data: await neteaseService.getTopSongs(type) });
    } catch { next(new AppError('Failed to fetch top songs', 502)); }
  }

  async getSongUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid song ID', 400);
      res.json({ success: true, data: { url: await neteaseService.getSongUrl(id) } });
    } catch (err) { if (err instanceof AppError) return next(err); next(new AppError('Failed to get song URL', 502)); }
  }

  async getLyric(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid song ID', 400);
      res.json({ success: true, data: await neteaseService.getLyric(id) });
    } catch (err) { if (err instanceof AppError) return next(err); next(new AppError('Failed to get lyrics', 502)); }
  }

  async getNewSongs(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await neteaseService.getNewSongs() });
    } catch { next(new AppError('Failed to fetch new songs', 502)); }
  }

  async getSongComments(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      if (isNaN(id)) throw new AppError('Invalid song ID', 400);
      res.json({ success: true, data: await neteaseService.getSongComments(id, limit, offset) });
    } catch (err) { if (err instanceof AppError) return next(err); next(new AppError('Failed to get comments', 502)); }
  }

  async getSongSiteComments(req: Request, res: Response, next: NextFunction) {
    try {
      const songId = parseInt(req.params.songId);
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      if (isNaN(songId)) throw new AppError('Invalid song ID', 400);
      res.json({ success: true, data: dbMusicService.listSongComments(songId, limit, offset) });
    } catch (err) { if (err instanceof AppError) return next(err); next(err); }
  }

  async postSongSiteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const songId = parseInt(req.params.songId);
      const content = (req.body?.content as string) || '';
      const songTitle = (req.body?.songTitle as string) || '';
      if (isNaN(songId)) throw new AppError('Invalid song ID', 400);
      const row = dbMusicService.addSongComment(userId, songId, content, songTitle);
      res.json({ success: true, data: row });
    } catch (err: any) {
      if (err instanceof AppError) return next(err);
      if (err?.message) return res.status(400).json({ success: false, message: err.message });
      next(err);
    }
  }

  async deleteSongSiteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const commentId = parseInt(req.params.commentId);
      if (isNaN(commentId)) throw new AppError('Invalid comment ID', 400);
      const ok = dbMusicService.deleteSongComment(userId, commentId);
      if (!ok) return res.status(403).json({ success: false, message: '无权删除' });
      res.json({ success: true });
    } catch (err) { if (err instanceof AppError) return next(err); next(err); }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const keyword = req.query.q as string;
      if (!keyword) throw new AppError('Search keyword is required', 400);
      const type = parseInt(req.query.type as string) || 1;
      const page = parseInt(req.query.page as string) || 1;
      res.json({ success: true, data: await neteaseService.search(keyword, type, page) });
    } catch (err) { if (err instanceof AppError) return next(err); next(new AppError('Failed to search', 502)); }
  }

  async getHotSearch(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await neteaseService.getHotSearchList() });
    } catch { next(new AppError('Failed to fetch hot search', 502)); }
  }

  async getSearchSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const keyword = req.query.q as string;
      if (!keyword) throw new AppError('Keyword required', 400);
      res.json({ success: true, data: await neteaseService.getSearchSuggestions(keyword) });
    } catch (err) { if (err instanceof AppError) return next(err); next(new AppError('Failed to get suggestions', 502)); }
  }

  async getArtistDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid artist ID', 400);
      const [detail, desc] = await Promise.all([
        neteaseService.getArtistDetail(id),
        neteaseService.getArtistDesc(id).catch(() => ({ briefDesc: '', introduction: [] })),
      ]);
      res.json({ success: true, data: { ...detail, desc: desc.briefDesc, introduction: desc.introduction } });
    } catch (err) { if (err instanceof AppError) return next(err); next(new AppError('Failed to fetch artist', 502)); }
  }

  async getArtistAlbums(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid artist ID', 400);
      const limit = parseInt(req.query.limit as string) || 30;
      res.json({ success: true, data: await neteaseService.getArtistAlbums(id, limit) });
    } catch (err) { if (err instanceof AppError) return next(err); next(new AppError('Failed to fetch artist albums', 502)); }
  }

  async getTopArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      res.json({ success: true, data: await neteaseService.getTopArtists(limit) });
    } catch { next(new AppError('Failed to fetch top artists', 502)); }
  }

  async getAlbumDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid album ID', 400);
      res.json({ success: true, data: await neteaseService.getAlbumDetail(id) });
    } catch (err) { if (err instanceof AppError) return next(err); next(new AppError('Failed to fetch album', 502)); }
  }

  async getNewAlbums(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      res.json({ success: true, data: await neteaseService.getNewAlbums(limit) });
    } catch { next(new AppError('Failed to fetch new albums', 502)); }
  }

  async getAllRankings(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await neteaseService.getAllRankings() });
    } catch { next(new AppError('Failed to fetch rankings', 502)); }
  }

  async getRankingDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid ranking ID', 400);
      res.json({ success: true, data: await neteaseService.getRankingDetail(id) });
    } catch (err) { if (err instanceof AppError) return next(err); next(new AppError('Failed to fetch ranking', 502)); }
  }

  async getPersonalized(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await neteaseService.getPersonalizedPlaylists() });
    } catch { next(new AppError('Failed to fetch personalized', 502)); }
  }

  async getBanners(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await neteaseService.getBanners() });
    } catch { next(new AppError('Failed to fetch banners', 502)); }
  }

  // ─── DB-backed user operations ───
  async toggleLike(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const songId = parseInt(req.body.songId);
    if (isNaN(songId)) return res.status(400).json({ success: false, message: 'Invalid songId' });
    const liked = dbMusicService.toggleLike(userId, songId, req.body.songName, req.body.songCover);
    res.json({ success: true, data: { liked, songId } });
  }

  async getLikedStatus(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.json({ success: true, data: {} });
    const ids = (req.query.ids as string || '').split(',').map(Number).filter(Boolean);
    res.json({ success: true, data: dbMusicService.getLikedStatus(userId, ids) });
  }

  async getLikedSongs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.json({ success: true, data: { ids: [], tracks: [] } });
      const ids = dbMusicService.getLikedIds(userId);
      let tracks: any[] = [];
      if (ids.length > 0) tracks = await neteaseService.getSongDetail(ids.slice(0, 100));
      res.json({ success: true, data: { ids, tracks } });
    } catch { next(new AppError('Failed to fetch liked songs', 502)); }
  }

  async getPlayHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.json({ success: true, data: { ids: [], tracks: [] } });
      const ids = dbMusicService.getHistory(userId);
      let tracks: any[] = [];
      if (ids.length > 0) tracks = await neteaseService.getSongDetail(ids.slice(0, 50));
      res.json({ success: true, data: { ids, tracks } });
    } catch { next(new AppError('Failed to fetch history', 502)); }
  }

  async addToHistory(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.json({ success: true });
    const songId = parseInt(req.body.songId);
    if (!isNaN(songId)) dbMusicService.addHistory(userId, songId);
    res.json({ success: true });
  }

  async createPlaylist(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    const pl = dbMusicService.createPlaylist(userId, name, description || '');
    res.json({ success: true, data: pl });
  }

  async deletePlaylist(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const ok = dbMusicService.deletePlaylist(userId, parseInt(req.params.id));
    res.json({ success: ok, message: ok ? 'Deleted' : 'Cannot delete default playlist' });
  }

  async getUserPlaylists(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.json({ success: true, data: [] });
    res.json({ success: true, data: dbMusicService.getPlaylists(userId) });
  }

  async getUserPlaylistDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
      const playlistId = parseInt(req.params.id);
      if (isNaN(playlistId)) throw new AppError('Invalid playlist ID', 400);
      const pl = dbMusicService.getPlaylists(userId).find((p: any) => p.id === playlistId);
      if (!pl) return res.status(404).json({ success: false, message: '歌单不存在或无权访问' });
      const songIds = pl.songIds || [];
      let tracks: any[] = [];
      if (songIds.length > 0) tracks = await neteaseService.getSongDetail(songIds.slice(0, 100));
      res.json({ success: true, data: { playlist: pl, tracks } });
    } catch (err) { if (err instanceof AppError) return next(err); next(new AppError('Failed to fetch playlist', 502)); }
  }

  async addToUserPlaylist(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const playlistId = parseInt(req.params.id);
    const { songId } = req.body;
    const parsedSongId = parseInt(songId);
    if (isNaN(playlistId) || isNaN(parsedSongId)) {
      return res.status(400).json({ success: false, message: '参数无效' });
    }
    const ok = dbMusicService.addToPlaylist(userId, playlistId, parsedSongId);
    if (!ok) return res.status(404).json({ success: false, message: '歌单不存在或无权访问' });
    res.json({ success: true });
  }

  async removeFromUserPlaylist(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const playlistId = parseInt(req.params.id);
    const { songId } = req.body;
    const parsedSongId = parseInt(songId);
    if (isNaN(playlistId) || isNaN(parsedSongId)) {
      return res.status(400).json({ success: false, message: '参数无效' });
    }
    const ok = dbMusicService.removeFromPlaylist(userId, playlistId, parsedSongId);
    if (!ok) return res.status(404).json({ success: false, message: '歌单不存在或无权访问' });
    res.json({ success: true });
  }
}

export const musicController = new MusicController();
