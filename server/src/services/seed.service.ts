/**
 * 推荐系统数据种子 — 完全基于真实 API 数据
 *
 * 流程：
 *   1. 从 TMDB / Open Library 拉取真实影视和书籍列表
 *   2. 将元信息（标题、封面、类型）写入 item_metadata 缓存表
 *   3. 生成模拟用户及其行为数据（标记、评分）
 *   4. 保证推荐系统输入和前端展示数据 100% 同源
 */

import db from '../database';
import { tmdbService } from './tmdb.service';
import { googleBooksService as openLibraryService } from './googleBooks.service';
import { saveItemMetaBatch, type ItemMeta } from './itemMetadata.service';

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

interface SeedItem {
  id: string;
  title: string;
  cover: string;
  genres: string[];
}

export async function seedRecommendationData() {
  // ═══ 第 1 步：从真实 API 拉取数据 ═══

  const movieItems: SeedItem[] = [];
  const bookItems: SeedItem[] = [];

  // 拉取 TMDB 影视（热门 + 高分，共 ~60 部）
  try {
    const [popular1, popular2, topRated1] = await Promise.all([
      tmdbService.getPopular(1),
      tmdbService.getPopular(2),
      tmdbService.getTopRated(1),
    ]);
    const allGenres = await tmdbService.getGenres();
    const genreMap = new Map(allGenres.map(g => [g.id, g.name]));

    const seen = new Set<number>();
    for (const list of [popular1.data, popular2.data, topRated1.data]) {
      for (const movie of list) {
        if (seen.has(movie.id)) continue;
        seen.add(movie.id);
        movieItems.push({
          id: String(movie.id),
          title: movie.title,
          cover: movie.posterPath || '',
          genres: (movie.genreIds || []).map(gid => genreMap.get(gid) || '').filter(Boolean),
        });
      }
    }
    console.log(`[Seed] 从 TMDB 拉取了 ${movieItems.length} 部影视`);
  } catch (err) {
    console.error('[Seed] TMDB 拉取失败:', err);
  }

  // 拉取 Open Library 书籍（多个分类，共 ~40 本）
  const bookCategories = ['fiction', 'science', 'history', 'philosophy', 'psychology'];
  try {
    const results = await Promise.allSettled(
      bookCategories.map(cat => openLibraryService.getPopular(cat, 1))
    );
    const seen = new Set<string>();
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status !== 'fulfilled') continue;
      for (const book of r.value.data) {
        if (seen.has(book.id)) continue;
        seen.add(book.id);
        bookItems.push({
          id: book.id,
          title: book.title,
          cover: book.thumbnail || '',
          genres: book.categories || [bookCategories[i]],
        });
      }
    }
    console.log(`[Seed] 从 Open Library 拉取了 ${bookItems.length} 本书籍`);
  } catch (err) {
    console.error('[Seed] Open Library 拉取失败:', err);
  }

  if (movieItems.length === 0 && bookItems.length === 0) {
    return { message: '外部 API 数据拉取失败，无法生成种子数据', stats: null };
  }

  // ═══ 第 2 步：写入 item_metadata 缓存 ═══

  const metaItems: ItemMeta[] = [
    ...movieItems.map(m => ({ item_type: 'movie' as const, item_id: m.id, title: m.title, cover: m.cover, genres: m.genres })),
    ...bookItems.map(b => ({ item_type: 'book' as const, item_id: b.id, title: b.title, cover: b.cover, genres: b.genres })),
  ];
  saveItemMetaBatch(metaItems);

  // ═══ 第 3 步：生成模拟用户 ═══

  const existingSimUsers: any[] = db.prepare("SELECT id FROM users WHERE username LIKE 'user_sim_%'").all();
  for (const u of existingSimUsers) {
    db.prepare('DELETE FROM movie_marks WHERE user_id = ?').run(u.id);
    db.prepare('DELETE FROM book_marks WHERE user_id = ?').run(u.id);
    db.prepare('DELETE FROM music_likes WHERE user_id = ?').run(u.id);
    db.prepare('DELETE FROM activities WHERE user_id = ?').run(u.id);
  }
  db.prepare("DELETE FROM users WHERE username LIKE 'user_sim_%'").run();

  const SIMULATE_USERS = 25;
  const userIds: number[] = [];
  for (let i = 0; i < SIMULATE_USERS; i++) {
    const username = `user_sim_${Date.now()}_${i}`;
    const email = `${username}@sim.musehub.local`;
    try {
      const r = db.prepare('INSERT INTO users (username, email, password_hash, bio) VALUES (?, ?, ?, ?)').run(
        username, email, '$2b$10$dummy_hash_for_simulation', `模拟用户${i + 1}号`
      );
      userIds.push(Number(r.lastInsertRowid));
    } catch {}
  }

  // ═══ 第 4 步：生成带偏好的行为数据 ═══

  const allMovieGenres = [...new Set(movieItems.flatMap(m => m.genres))];
  const allBookGenres = [...new Set(bookItems.flatMap(b => b.genres))];
  const statusOptions = ['wish', 'doing', 'done'];

  const insertMovieMark = db.prepare('INSERT OR REPLACE INTO movie_marks (user_id, movie_id, status, rating) VALUES (?, ?, ?, ?)');
  const insertBookMark = db.prepare('INSERT OR REPLACE INTO book_marks (user_id, book_id, status, rating) VALUES (?, ?, ?, ?)');
  const insertActivity = db.prepare('INSERT INTO activities (user_id, action, item_type, item_id, item_title, item_cover, extra) VALUES (?, ?, ?, ?, ?, ?, ?)');

  let movieMarks = 0, bookMarks = 0;

  const seedTx = db.transaction(() => {
    for (const uid of userIds) {
      const favMovieGenres = pickRandom(allMovieGenres, rand(2, 4));
      const favBookGenres = pickRandom(allBookGenres, rand(1, 3));

      // 影视标记：偏好类型命中的给高分，不命中的给低分
      const numMovies = rand(Math.ceil(movieItems.length * 0.25), Math.ceil(movieItems.length * 0.55));
      const selectedMovies = pickRandom(movieItems, numMovies);
      for (const movie of selectedMovies) {
        const genreOverlap = movie.genres.filter(g => favMovieGenres.includes(g)).length;
        const status = statusOptions[rand(0, 2)];
        let rating: number | null = null;
        if (genreOverlap > 0) {
          rating = rand(3, 5);
        } else {
          rating = Math.random() > 0.5 ? rand(1, 3) : null;
        }
        try {
          insertMovieMark.run(uid, movie.id, status, rating);
          insertActivity.run(uid, `mark_${status}`, 'movie', movie.id, movie.title, movie.cover, JSON.stringify({ genres: movie.genres }));
          movieMarks++;
        } catch {}
      }

      // 书籍标记
      const numBooks = rand(Math.ceil(bookItems.length * 0.2), Math.ceil(bookItems.length * 0.5));
      const selectedBooks = pickRandom(bookItems, numBooks);
      for (const book of selectedBooks) {
        const genreOverlap = book.genres.filter(g => favBookGenres.includes(g)).length;
        const status = statusOptions[rand(0, 2)];
        let rating: number | null = null;
        if (genreOverlap > 0) {
          rating = rand(3, 5);
        } else {
          rating = Math.random() > 0.5 ? rand(1, 3) : null;
        }
        try {
          insertBookMark.run(uid, book.id, status, rating);
          insertActivity.run(uid, `mark_${status}_book`, 'book', book.id, book.title, book.cover, JSON.stringify({ categories: book.genres }));
          bookMarks++;
        } catch {}
      }
    }
  });

  seedTx();

  return {
    message: '基于真实 API 数据的模拟行为已生成',
    stats: {
      users: userIds.length,
      movieMarks,
      bookMarks,
      movieItems: movieItems.length,
      bookItems: bookItems.length,
      metaCached: metaItems.length,
    },
  };
}

export function clearSeedData() {
  const simUsers: any[] = db.prepare("SELECT id FROM users WHERE username LIKE 'user_sim_%'").all();
  if (simUsers.length === 0) return { message: '没有模拟数据需要清除' };
  const ids = simUsers.map(u => u.id);
  const ph = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM movie_marks WHERE user_id IN (${ph})`).run(...ids);
  db.prepare(`DELETE FROM book_marks WHERE user_id IN (${ph})`).run(...ids);
  db.prepare(`DELETE FROM music_likes WHERE user_id IN (${ph})`).run(...ids);
  db.prepare(`DELETE FROM activities WHERE user_id IN (${ph})`).run(...ids);
  db.prepare("DELETE FROM users WHERE username LIKE 'user_sim_%'").run();
  return { message: `已清除 ${simUsers.length} 个模拟用户及其所有数据` };
}
