import { Router, Request, Response } from 'express';
import db from '../database';
import { adminRequired } from '../middleware/auth';
import { dbCollectionService } from '../services/dbCollection.service';
import { getAllActivities } from '../services/activity.service';

const router = Router();
router.use(adminRequired);

router.get('/dashboard', (_req: Request, res: Response) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const totalReviews = (db.prepare('SELECT COUNT(*) as c FROM reviews').get() as any).c;
  const totalMovieMarks = (db.prepare('SELECT COUNT(*) as c FROM movie_marks').get() as any).c;
  const totalBookMarks = (db.prepare('SELECT COUNT(*) as c FROM book_marks').get() as any).c;
  const totalMusicLikes = (db.prepare('SELECT COUNT(*) as c FROM music_likes').get() as any).c;
  const pendingReviews = (db.prepare(`SELECT COUNT(*) as c FROM reviews WHERE status = 'pending'`).get() as any).c;
  const todayUsers = (db.prepare(`SELECT COUNT(*) as c FROM users WHERE DATE(created_at) = DATE('now')`).get() as any).c;
  const todayReviews = (db.prepare(`SELECT COUNT(*) as c FROM reviews WHERE DATE(created_at) = DATE('now')`).get() as any).c;

  const userGrowth: any[] = db.prepare(`SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= DATE('now', '-30 days') GROUP BY DATE(created_at) ORDER BY date`).all();
  const reviewGrowth: any[] = db.prepare(`SELECT DATE(created_at) as date, COUNT(*) as count FROM reviews WHERE created_at >= DATE('now', '-30 days') GROUP BY DATE(created_at) ORDER BY date`).all();
  const activeUsers: any[] = db.prepare(`SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as count FROM activities WHERE created_at >= DATE('now', '-30 days') GROUP BY DATE(created_at) ORDER BY date`).all();

  const topMovies: any[] = db.prepare(`SELECT movie_id as id, COUNT(*) as count FROM movie_marks GROUP BY movie_id ORDER BY count DESC LIMIT 10`).all();
  const topBooks: any[] = db.prepare(`SELECT book_id as id, COUNT(*) as count FROM book_marks GROUP BY book_id ORDER BY count DESC LIMIT 10`).all();

  const announcements = db.prepare('SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC LIMIT 5').all();

  res.json({ success: true, data: {
    overview: { totalUsers, totalReviews, totalMovieMarks, totalBookMarks, totalMusicLikes, pendingReviews, todayUsers, todayReviews },
    charts: { userGrowth, reviewGrowth, activeUsers },
    rankings: { topMovies, topBooks },
    announcements,
  }});
});

router.get('/users', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const search = req.query.q as string;
  let rows, total;
  if (search) {
    rows = db.prepare(`SELECT id, username, email, avatar, bio, role, disabled, created_at FROM users WHERE username LIKE ? OR email LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(`%${search}%`, `%${search}%`, limit, offset);
    total = (db.prepare(`SELECT COUNT(*) as c FROM users WHERE username LIKE ? OR email LIKE ?`).get(`%${search}%`, `%${search}%`) as any).c;
  } else {
    rows = db.prepare(`SELECT id, username, email, avatar, bio, role, disabled, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(limit, offset);
    total = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  }
  res.json({ success: true, data: rows, total, page, totalPages: Math.ceil(total / limit) });
});

router.put('/users/:id/role', (req: Request, res: Response) => {
  db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.body.role, parseInt(req.params.id));
  res.json({ success: true });
});

router.put('/users/:id/disable', (req: Request, res: Response) => {
  const user: any = db.prepare('SELECT disabled FROM users WHERE id = ?').get(parseInt(req.params.id));
  db.prepare('UPDATE users SET disabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.disabled ? 0 : 1, parseInt(req.params.id));
  res.json({ success: true, data: { disabled: !user.disabled } });
});

router.get('/reviews', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const status = req.query.status as string | undefined;
  const result = dbCollectionService.getAllReviewsAdmin(page, 20, status);
  res.json({ success: true, ...result });
});

router.put('/reviews/:id/status', (req: Request, res: Response) => {
  dbCollectionService.updateReviewStatus(parseInt(req.params.id), req.body.status);
  res.json({ success: true });
});

router.delete('/reviews/:id', (req: Request, res: Response) => {
  dbCollectionService.deleteReview(0, parseInt(req.params.id), true);
  res.json({ success: true });
});

router.get('/activities', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const result = getAllActivities(page);
  res.json({ success: true, ...result });
});

router.post('/announcements', (req: Request, res: Response) => {
  const { title, content } = req.body;
  const result = db.prepare('INSERT INTO announcements (title, content) VALUES (?, ?)').run(title, content);
  const ann = db.prepare('SELECT * FROM announcements WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: ann });
});

router.delete('/announcements/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

router.get('/announcements', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all();
  res.json({ success: true, data: rows });
});

export default router;
