import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'musehub.db');

// 确保目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// 清空所有用户数据表（保留表结构）
const tables = [
  'users',
  'user_playlists',
  'playlist_songs',
  'music_likes',
  'play_history',
  'movie_marks',
  'book_marks',
  'user_movies_lists',
  'user_movies_lists_items',
  'user_books_lists',
  'user_books_lists_items',
  'song_comments',
  'movie_reviews',
  'book_reviews',
  'activities',
];

console.log('开始清空数据...');

try {
  db.exec('PRAGMA foreign_keys = OFF');
  
  for (const table of tables) {
    try {
      db.prepare(`DELETE FROM ${table}`).run();
      console.log(`✓ 清空了 ${table} 表`);
    } catch (err: any) {
      if (!err.message.includes('no such table')) {
        console.log(`⚠ ${table} 表不存在，跳过`);
      }
    }
  }
  
  db.exec('PRAGMA foreign_keys = ON');
  console.log('\n✅ 数据清空完成！项目已还原到无人使用的状态。');
} catch (err) {
  console.error('❌ 清空失败:', err);
  process.exit(1);
}

db.close();
