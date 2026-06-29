import db from '../database';
import { MARK_ACTIVITY_ACTIONS, recordActivity, removeItemActivities } from './activity.service';
import { saveItemMeta } from './itemMetadata.service';

export type ItemType = 'book' | 'movie';
export type MarkStatus = 'wish' | 'doing' | 'done';

export const dbCollectionService = {
  setMark(userId: number, itemType: ItemType, itemId: string, status: MarkStatus, rating?: number, comment?: string, itemTitle = '', itemCover = '', genres: string[] = []) {
    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const idCol = itemType === 'movie' ? 'movie_id' : 'book_id';
    const markActions = MARK_ACTIVITY_ACTIONS[itemType];
    const existing = db.prepare(`SELECT id FROM ${table} WHERE user_id = ? AND ${idCol} = ?`).get(userId, itemId);
    if (existing) {
      db.prepare(`UPDATE ${table} SET status = ?, rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND ${idCol} = ?`).run(status, rating ?? null, comment ?? '', userId, itemId);
    } else {
      db.prepare(`INSERT INTO ${table} (user_id, ${idCol}, status, rating, comment) VALUES (?, ?, ?, ?, ?)`).run(userId, itemId, status, rating ?? null, comment ?? '');
    }
    removeItemActivities(userId, itemType, itemId, markActions);
    const action = itemType === 'book' ? `mark_${status}_book` : `mark_${status}`;
    const extra: any = {};
    if (genres.length > 0) extra[itemType === 'movie' ? 'genres' : 'categories'] = genres;
    recordActivity(userId, action, itemType, itemId, itemTitle, itemCover, extra);

    if (itemTitle) {
      saveItemMeta({ item_type: itemType, item_id: itemId, title: itemTitle, cover: itemCover, genres });
    }

    return db.prepare(`SELECT * FROM ${table} WHERE user_id = ? AND ${idCol} = ?`).get(userId, itemId);
  },

  removeMark(userId: number, itemType: ItemType, itemId: string) {
    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const idCol = itemType === 'movie' ? 'movie_id' : 'book_id';
    const markActions = MARK_ACTIVITY_ACTIONS[itemType];
    removeItemActivities(userId, itemType, itemId, markActions);
    db.prepare(`DELETE FROM ${table} WHERE user_id = ? AND ${idCol} = ?`).run(userId, itemId);
  },

  getMark(userId: number, itemType: ItemType, itemId: string) {
    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const idCol = itemType === 'movie' ? 'movie_id' : 'book_id';
    return db.prepare(`SELECT * FROM ${table} WHERE user_id = ? AND ${idCol} = ?`).get(userId, itemId) || null;
  },

  getMarks(userId: number, itemType: ItemType, status?: MarkStatus) {
    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    if (status) return db.prepare(`SELECT * FROM ${table} WHERE user_id = ? AND status = ? ORDER BY updated_at DESC`).all(userId, status);
    return db.prepare(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY updated_at DESC`).all(userId);
  },

  getMarkStats(userId: number, itemType: ItemType) {
    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const rows: any[] = db.prepare(`SELECT status, COUNT(*) as count FROM ${table} WHERE user_id = ? GROUP BY status`).all(userId);
    const stats: Record<string, number> = { wish: 0, doing: 0, done: 0 };
    rows.forEach(r => stats[r.status] = r.count);
    return stats;
  },

  addReview(userId: number, itemType: ItemType, itemId: string, content: string, rating: number, title = '', isLong = false, itemTitle = '', itemCover = '') {
    const result = db.prepare('INSERT INTO reviews (user_id, item_type, item_id, title, content, rating, is_long) VALUES (?, ?, ?, ?, ?, ?, ?)').run(userId, itemType, itemId, title, content, rating, isLong ? 1 : 0);
    recordActivity(userId, 'review', itemType, itemId, itemTitle, itemCover, { rating });
    return db.prepare('SELECT r.*, u.username, u.avatar FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?').get(result.lastInsertRowid);
  },

  getReviews(itemType: ItemType, itemId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const rows = db.prepare(`SELECT r.*, u.username, u.avatar FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.item_type = ? AND r.item_id = ? AND r.status = 'approved' ORDER BY r.created_at DESC LIMIT ? OFFSET ?`).all(itemType, itemId, limit, offset);
    const total = (db.prepare(`SELECT COUNT(*) as c FROM reviews WHERE item_type = ? AND item_id = ? AND status = 'approved'`).get(itemType, itemId) as any).c;
    return { data: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  likeReview(userId: number, reviewId: number) {
    const existing = db.prepare('SELECT 1 FROM review_likes WHERE user_id = ? AND review_id = ?').get(userId, reviewId);
    if (existing) {
      db.prepare('DELETE FROM review_likes WHERE user_id = ? AND review_id = ?').run(userId, reviewId);
      db.prepare('UPDATE reviews SET like_count = like_count - 1 WHERE id = ?').run(reviewId);
    } else {
      db.prepare('INSERT INTO review_likes (user_id, review_id) VALUES (?, ?)').run(userId, reviewId);
      db.prepare('UPDATE reviews SET like_count = like_count + 1 WHERE id = ?').run(reviewId);
    }
    return db.prepare('SELECT like_count FROM reviews WHERE id = ?').get(reviewId);
  },

  deleteReview(userId: number, reviewId: number, isAdmin = false) {
    if (isAdmin) {
      db.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);
    } else {
      db.prepare('DELETE FROM reviews WHERE id = ? AND user_id = ?').run(reviewId, userId);
    }
  },

  createList(userId: number, itemType: ItemType, name: string, description = '') {
    const result = db.prepare('INSERT INTO user_lists (user_id, item_type, name, description) VALUES (?, ?, ?, ?)').run(userId, itemType, name, description);
    recordActivity(userId, itemType === 'book' ? 'create_list' : 'create_list_movie', itemType, String(result.lastInsertRowid), name);
    return db.prepare('SELECT * FROM user_lists WHERE id = ?').get(result.lastInsertRowid);
  },

  deleteList(userId: number, listId: number, isAdmin = false) {
    if (isAdmin) db.prepare('DELETE FROM user_lists WHERE id = ?').run(listId);
    else db.prepare('DELETE FROM user_lists WHERE id = ? AND user_id = ?').run(listId, userId);
  },

  getLists(userId: number, itemType: ItemType) {
    const lists: any[] = db.prepare('SELECT * FROM user_lists WHERE user_id = ? AND item_type = ? ORDER BY updated_at DESC').all(userId, itemType);
    return lists.map(l => ({ ...l, items: db.prepare('SELECT item_id FROM list_items WHERE list_id = ?').all(l.id).map((r: any) => r.item_id) }));
  },

  getListDetail(listId: number) {
    const list: any = db.prepare('SELECT l.*, u.username FROM user_lists l JOIN users u ON u.id = l.user_id WHERE l.id = ?').get(listId);
    if (!list) return null;
    list.items = db.prepare('SELECT item_id FROM list_items WHERE list_id = ?').all(listId).map((r: any) => r.item_id);
    return list;
  },

  addToList(userId: number, listId: number, itemId: string) {
    const list = db.prepare('SELECT id FROM user_lists WHERE id = ? AND user_id = ?').get(listId, userId);
    if (!list) return false;
    db.prepare('INSERT OR IGNORE INTO list_items (list_id, item_id) VALUES (?, ?)').run(listId, itemId);
    db.prepare('UPDATE user_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(listId);
    return true;
  },

  removeFromList(userId: number, listId: number, itemId: string) {
    const list = db.prepare('SELECT id FROM user_lists WHERE id = ? AND user_id = ?').get(listId, userId);
    if (!list) return false;
    db.prepare('DELETE FROM list_items WHERE list_id = ? AND item_id = ?').run(listId, itemId);
    db.prepare('UPDATE user_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(listId);
    return true;
  },

  getAllReviewsAdmin(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;
    const where = status ? `WHERE r.status = '${status}'` : '';
    const rows = db.prepare(`SELECT r.*, u.username, u.avatar FROM reviews r JOIN users u ON u.id = r.user_id ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`).all(limit, offset);
    const total = (db.prepare(`SELECT COUNT(*) as c FROM reviews r ${where}`).get() as any).c;
    return { data: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  updateReviewStatus(reviewId: number, status: 'approved' | 'rejected') {
    db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, reviewId);
  },
};
