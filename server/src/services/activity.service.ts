import db from '../database';

export const MARK_ACTIVITY_ACTIONS = {
  movie: ['mark_wish', 'mark_doing', 'mark_done'],
  book: ['mark_wish_book', 'mark_doing_book', 'mark_done_book'],
} as const;

const ACTION_LABELS: Record<string, string> = {
  mark_wish: '想看', mark_doing: '在看', mark_done: '看过',
  mark_wish_book: '想读', mark_doing_book: '在读', mark_done_book: '读过',
  review: '评论了', like_song: '喜欢了歌曲', comment_song: '评论了歌曲', create_playlist: '创建了歌单',
  create_list: '创建了书单', create_list_movie: '创建了片单',
};

export function recordActivity(userId: number, action: string, itemType: string, itemId: string, itemTitle = '', itemCover = '', extra: any = {}) {
  db.prepare(`INSERT INTO activities (user_id, action, item_type, item_id, item_title, item_cover, extra) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    userId, action, itemType, itemId, itemTitle, itemCover, JSON.stringify(extra)
  );
}

export function removeItemActivities(userId: number, itemType: string, itemId: string, actions?: readonly string[]) {
  if (actions && actions.length > 0) {
    const placeholders = actions.map(() => '?').join(',');
    db.prepare(
      `DELETE FROM activities WHERE user_id = ? AND item_type = ? AND item_id = ? AND action IN (${placeholders})`
    ).run(userId, itemType, itemId, ...actions);
    return;
  }

  db.prepare('DELETE FROM activities WHERE user_id = ? AND item_type = ? AND item_id = ?').run(userId, itemType, itemId);
}

function keepLatestActivity(userId: number, itemType: string, itemId: string, actions: readonly string[]) {
  if (actions.length === 0) return;

  const placeholders = actions.map(() => '?').join(',');
  const latest: any = db.prepare(
    `SELECT id FROM activities WHERE user_id = ? AND item_type = ? AND item_id = ? AND action IN (${placeholders}) ORDER BY id DESC LIMIT 1`
  ).get(userId, itemType, itemId, ...actions);

  if (latest?.id) {
    db.prepare(
      `DELETE FROM activities WHERE user_id = ? AND item_type = ? AND item_id = ? AND action IN (${placeholders}) AND id != ?`
    ).run(userId, itemType, itemId, ...actions, latest.id);
    return;
  }

  db.prepare(
    `DELETE FROM activities WHERE user_id = ? AND item_type = ? AND item_id = ? AND action IN (${placeholders})`
  ).run(userId, itemType, itemId, ...actions);
}

export function cleanupTransientActivities() {
  const movieMarks: any[] = db.prepare('SELECT user_id, movie_id as item_id, status FROM movie_marks').all();
  for (const row of movieMarks) {
    keepLatestActivity(Number(row.user_id), 'movie', String(row.item_id), [`mark_${row.status}`]);
  }

  const bookMarks: any[] = db.prepare('SELECT user_id, book_id as item_id, status FROM book_marks').all();
  for (const row of bookMarks) {
    keepLatestActivity(Number(row.user_id), 'book', String(row.item_id), [`mark_${row.status}_book`]);
  }

  const likedSongs: any[] = db.prepare('SELECT user_id, song_id FROM music_likes').all();
  for (const row of likedSongs) {
    keepLatestActivity(Number(row.user_id), 'music', String(row.song_id), ['like_song']);
  }

  const staleMarkActions = [...MARK_ACTIVITY_ACTIONS.movie, ...MARK_ACTIVITY_ACTIONS.book];
  if (staleMarkActions.length > 0) {
    const placeholders = staleMarkActions.map(() => '?').join(',');
    const currentMovieKeys = new Set(movieMarks.map((row) => `${row.user_id}|${row.item_id}|mark_${row.status}`));
    const currentBookKeys = new Set(bookMarks.map((row) => `${row.user_id}|${row.item_id}|mark_${row.status}_book`));

    const rows: any[] = db.prepare(
      `SELECT id, user_id, item_type, item_id, action FROM activities WHERE action IN (${placeholders})`
    ).all(...staleMarkActions);

    for (const row of rows) {
      const key = `${row.user_id}|${row.item_id}|${row.action}`;
      const valid = row.item_type === 'movie'
        ? currentMovieKeys.has(key)
        : row.item_type === 'book'
          ? currentBookKeys.has(key)
          : false;
      if (!valid) {
        db.prepare('DELETE FROM activities WHERE id = ?').run(row.id);
      }
    }
  }

  const musicRows: any[] = db.prepare("SELECT id, user_id, item_type, item_id, action FROM activities WHERE action = 'like_song'").all();
  const currentLikeKeys = new Set(likedSongs.map((row) => `${row.user_id}|${row.song_id}`));
  for (const row of musicRows) {
    const key = `${row.user_id}|${row.item_id}`;
    if (!currentLikeKeys.has(key)) {
      db.prepare('DELETE FROM activities WHERE id = ?').run(row.id);
    }
  }
}

export function getUserActivities(userId: number, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const rows: any[] = db.prepare(`
    SELECT a.*, u.username, u.avatar FROM activities a
    JOIN users u ON u.id = a.user_id
    WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT ? OFFSET ?
  `).all(userId, limit, offset);
  const total = (db.prepare('SELECT COUNT(*) as c FROM activities WHERE user_id = ?').get(userId) as any).c;
  return { data: rows.map(r => ({ ...r, extra: JSON.parse(r.extra || '{}') })), total, page, totalPages: Math.ceil(total / limit) };
}

export function getFeedActivities(userId: number, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const rows: any[] = db.prepare(`
    SELECT a.*, u.username, u.avatar FROM activities a
    JOIN users u ON u.id = a.user_id
    WHERE a.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) OR a.user_id = ?
    ORDER BY a.created_at DESC LIMIT ? OFFSET ?
  `).all(userId, userId, limit, offset);
  return { data: rows.map(r => ({ ...r, extra: JSON.parse(r.extra || '{}') })), page };
}

export function getAllActivities(page = 1, limit = 30) {
  const offset = (page - 1) * limit;
  const rows: any[] = db.prepare(`
    SELECT a.*, u.username, u.avatar FROM activities a
    JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
  const total = (db.prepare('SELECT COUNT(*) as c FROM activities').get() as any).c;
  return { data: rows.map(r => ({ ...r, extra: JSON.parse(r.extra || '{}') })), total, page, totalPages: Math.ceil(total / limit) };
}
