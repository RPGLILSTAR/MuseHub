import { Router, Request, Response } from 'express';
import db from '../database';
import { authRequired, optionalAuth } from '../middleware/auth';
import { getUserActivities, getFeedActivities } from '../services/activity.service';

const router = Router();

router.get('/user/:id', optionalAuth, (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const user: any = db.prepare('SELECT id, username, email, avatar, bio, role, created_at FROM users WHERE id = ? AND disabled = 0').get(userId);
  if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

  const movieStats: any = db.prepare('SELECT status, COUNT(*) as count FROM movie_marks WHERE user_id = ? GROUP BY status').all(userId);
  const bookStats: any = db.prepare('SELECT status, COUNT(*) as count FROM book_marks WHERE user_id = ? GROUP BY status').all(userId);
  const likedSongs = (db.prepare('SELECT COUNT(*) as c FROM music_likes WHERE user_id = ?').get(userId) as any).c;
  const reviewCount = (db.prepare('SELECT COUNT(*) as c FROM reviews WHERE user_id = ?').get(userId) as any).c;
  const followerCount = (db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(userId) as any).c;
  const followingCount = (db.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').get(userId) as any).c;

  let isFollowing = false;
  if (req.user) {
    isFollowing = !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.userId, userId);
  }

  const ms: Record<string, number> = { wish: 0, doing: 0, done: 0 };
  movieStats.forEach((r: any) => ms[r.status] = r.count);
  const bs: Record<string, number> = { wish: 0, doing: 0, done: 0 };
  bookStats.forEach((r: any) => bs[r.status] = r.count);

  res.json({ success: true, data: {
    ...user, isFollowing, followerCount, followingCount, reviewCount,
    stats: { movies: ms, books: bs, likedSongs, totalMovies: ms.wish + ms.doing + ms.done, totalBooks: bs.wish + bs.doing + bs.done }
  }});
});

router.get('/user/:id/activities', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const result = getUserActivities(parseInt(req.params.id), page);
  res.json({ success: true, data: result.data, total: result.total, page: result.page });
});

router.post('/follow/:id', authRequired, (req: Request, res: Response) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.user!.userId) return res.status(400).json({ success: false, message: '不能关注自己' });
  const exists = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user!.userId, targetId);
  if (exists) {
    db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.user!.userId, targetId);
    res.json({ success: true, data: { following: false } });
  } else {
    db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user!.userId, targetId);
    res.json({ success: true, data: { following: true } });
  }
});

function attachFollowState(rows: any[], currentUserId?: number) {
  if (!currentUserId || rows.length === 0) {
    return rows.map((row) => ({ ...row, isFollowing: false }));
  }

  const ids = rows.map((row) => row.id).filter(Boolean);
  if (ids.length === 0) {
    return rows.map((row) => ({ ...row, isFollowing: false }));
  }

  const placeholders = ids.map(() => '?').join(',');
  const followingRows: any[] = db.prepare(
    `SELECT following_id FROM follows WHERE follower_id = ? AND following_id IN (${placeholders})`
  ).all(currentUserId, ...ids);
  const followingSet = new Set(followingRows.map((row) => row.following_id));

  return rows.map((row) => ({
    ...row,
    isFollowing: followingSet.has(row.id),
  }));
}

router.get('/followers/:id', optionalAuth, (req: Request, res: Response) => {
  const rows = db.prepare('SELECT u.id, u.username, u.avatar, u.bio FROM follows f JOIN users u ON u.id = f.follower_id WHERE f.following_id = ? ORDER BY f.created_at DESC').all(parseInt(req.params.id));
  res.json({ success: true, data: attachFollowState(rows, req.user?.userId) });
});

router.get('/following/:id', optionalAuth, (req: Request, res: Response) => {
  const rows = db.prepare('SELECT u.id, u.username, u.avatar, u.bio FROM follows f JOIN users u ON u.id = f.following_id WHERE f.follower_id = ? ORDER BY f.created_at DESC').all(parseInt(req.params.id));
  res.json({ success: true, data: attachFollowState(rows, req.user?.userId) });
});

router.get('/feed', authRequired, (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const result = getFeedActivities(req.user!.userId, page);
  res.json({ success: true, data: result.data, page: result.page });
});

router.get('/user/:id/stats/annual', (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const year = req.query.year || new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const moviesByMonth: any[] = db.prepare(`SELECT strftime('%m', created_at) as month, COUNT(*) as count FROM movie_marks WHERE user_id = ? AND status = 'done' AND created_at BETWEEN ? AND ? GROUP BY month`).all(userId, startDate, endDate);
  const booksByMonth: any[] = db.prepare(`SELECT strftime('%m', created_at) as month, COUNT(*) as count FROM book_marks WHERE user_id = ? AND status = 'done' AND created_at BETWEEN ? AND ? GROUP BY month`).all(userId, startDate, endDate);
  const songsByMonth: any[] = db.prepare(`SELECT strftime('%m', played_at) as month, COUNT(DISTINCT song_id) as count FROM play_history WHERE user_id = ? AND played_at BETWEEN ? AND ? GROUP BY month`).all(userId, startDate, endDate);

  const topRatedMovies = db.prepare(`SELECT movie_id, rating FROM movie_marks WHERE user_id = ? AND rating IS NOT NULL AND created_at BETWEEN ? AND ? ORDER BY rating DESC LIMIT 10`).all(userId, startDate, endDate);
  const topRatedBooks = db.prepare(`SELECT book_id, rating FROM book_marks WHERE user_id = ? AND rating IS NOT NULL AND created_at BETWEEN ? AND ? ORDER BY rating DESC LIMIT 10`).all(userId, startDate, endDate);

  const totalMovies = (db.prepare(`SELECT COUNT(*) as c FROM movie_marks WHERE user_id = ? AND status = 'done' AND created_at BETWEEN ? AND ?`).get(userId, startDate, endDate) as any).c;
  const totalBooks = (db.prepare(`SELECT COUNT(*) as c FROM book_marks WHERE user_id = ? AND status = 'done' AND created_at BETWEEN ? AND ?`).get(userId, startDate, endDate) as any).c;
  const totalSongs = (db.prepare(`SELECT COUNT(DISTINCT song_id) as c FROM play_history WHERE user_id = ? AND played_at BETWEEN ? AND ?`).get(userId, startDate, endDate) as any).c;

  res.json({ success: true, data: { year, totalMovies, totalBooks, totalSongs, moviesByMonth, booksByMonth, songsByMonth, topRatedMovies, topRatedBooks } });
});

export default router;
