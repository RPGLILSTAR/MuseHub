import db from '../database';
import { recordActivity, removeItemActivities } from './activity.service';

export const dbMusicService = {
  toggleLike(userId: number, songId: number, songName = '', songCover = '') {
    const existing = db.prepare('SELECT 1 FROM music_likes WHERE user_id = ? AND song_id = ?').get(userId, songId);
    if (existing) {
      db.prepare('DELETE FROM music_likes WHERE user_id = ? AND song_id = ?').run(userId, songId);
      removeItemActivities(userId, 'music', String(songId), ['like_song']);
      return false;
    } else {
      db.prepare('INSERT INTO music_likes (user_id, song_id) VALUES (?, ?)').run(userId, songId);
      removeItemActivities(userId, 'music', String(songId), ['like_song']);
      recordActivity(userId, 'like_song', 'music', String(songId), songName, songCover);
      return true;
    }
  },

  isLiked(userId: number, songId: number) {
    return !!db.prepare('SELECT 1 FROM music_likes WHERE user_id = ? AND song_id = ?').get(userId, songId);
  },

  getLikedIds(userId: number) {
    return db.prepare('SELECT song_id FROM music_likes WHERE user_id = ? ORDER BY created_at DESC').all(userId).map((r: any) => r.song_id);
  },

  getLikedStatus(userId: number, ids: number[]) {
    if (!ids.length) return {};
    const placeholders = ids.map(() => '?').join(',');
    const rows: any[] = db.prepare(`SELECT song_id FROM music_likes WHERE user_id = ? AND song_id IN (${placeholders})`).all(userId, ...ids);
    const set = new Set(rows.map(r => r.song_id));
    const result: Record<number, boolean> = {};
    ids.forEach(id => result[id] = set.has(id));
    return result;
  },

  addHistory(userId: number, songId: number) {
    db.prepare('INSERT INTO play_history (user_id, song_id) VALUES (?, ?)').run(userId, songId);
  },

  getHistory(userId: number, limit = 100) {
    return db.prepare(`SELECT DISTINCT song_id FROM play_history WHERE user_id = ? ORDER BY played_at DESC LIMIT ?`).all(userId, limit).map((r: any) => r.song_id);
  },

  getPlaylists(userId: number) {
    const lists: any[] = db.prepare('SELECT * FROM user_playlists WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(userId);
    return lists.map(l => ({
      ...l,
      songIds: db.prepare('SELECT song_id FROM playlist_songs WHERE playlist_id = ? ORDER BY added_at DESC').all(l.id).map((r: any) => r.song_id),
    }));
  },

  createPlaylist(userId: number, name: string, description = '') {
    const result = db.prepare('INSERT INTO user_playlists (user_id, name, description) VALUES (?, ?, ?)').run(userId, name, description);
    recordActivity(userId, 'create_playlist', 'music', String(result.lastInsertRowid), name);
    return db.prepare('SELECT * FROM user_playlists WHERE id = ?').get(result.lastInsertRowid);
  },

  deletePlaylist(userId: number, playlistId: number) {
    const pl: any = db.prepare('SELECT is_default FROM user_playlists WHERE id = ? AND user_id = ?').get(playlistId, userId);
    if (!pl || pl.is_default) return false;
    db.prepare('DELETE FROM user_playlists WHERE id = ?').run(playlistId);
    return true;
  },

  addToPlaylist(userId: number, playlistId: number, songId: number) {
    const playlist = db.prepare('SELECT id FROM user_playlists WHERE id = ? AND user_id = ?').get(playlistId, userId);
    if (!playlist) return false;
    db.prepare('INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)').run(playlistId, songId);
    db.prepare('UPDATE user_playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(playlistId);
    return true;
  },

  removeFromPlaylist(userId: number, playlistId: number, songId: number) {
    const playlist = db.prepare('SELECT id FROM user_playlists WHERE id = ? AND user_id = ?').get(playlistId, userId);
    if (!playlist) return false;
    db.prepare('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?').run(playlistId, songId);
    db.prepare('UPDATE user_playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(playlistId);
    return true;
  },

  renamePlaylist(userId: number, playlistId: number, name: string) {
    db.prepare('UPDATE user_playlists SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(name, playlistId, userId);
  },

  listSongComments(songId: number, limit = 50, offset = 0) {
    const rows: any[] = db.prepare(`
      SELECT c.id, c.user_id AS userId, u.username, u.avatar, c.content, c.created_at AS createdAt
      FROM song_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.song_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(songId, limit, offset);
    return rows;
  },

  addSongComment(userId: number, songId: number, content: string, songTitle = '') {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 2000) throw new Error('评论内容长度应在 1～2000 字之间');
    const r = db.prepare('INSERT INTO song_comments (user_id, song_id, content) VALUES (?, ?, ?)').run(userId, songId, trimmed);
    recordActivity(userId, 'comment_song', 'music', String(songId), songTitle);
    const row: any = db.prepare(`
      SELECT c.id, c.user_id AS userId, u.username, u.avatar, c.content, c.created_at AS createdAt
      FROM song_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
    `).get(r.lastInsertRowid);
    return row;
  },

  deleteSongComment(userId: number, commentId: number) {
    const row: any = db.prepare('SELECT user_id FROM song_comments WHERE id = ?').get(commentId);
    if (!row || row.user_id !== userId) return false;
    db.prepare('DELETE FROM song_comments WHERE id = ?').run(commentId);
    return true;
  },
};
