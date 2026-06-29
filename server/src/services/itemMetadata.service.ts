/**
 * 物品元数据缓存服务
 * 所有进入推荐系统的物品，其标题/封面/类型都缓存在本地 item_metadata 表中
 * 保证推荐结果可直接携带展示信息，不依赖外部 API 二次查询
 */

import db from '../database';

export interface ItemMeta {
  item_type: 'movie' | 'book' | 'music';
  item_id: string;
  title: string;
  cover: string;
  genres: string[];
  extra?: Record<string, any>;
}

let _upsertStmt: any = null;
function getUpsertStmt() {
  if (!_upsertStmt) {
    _upsertStmt = db.prepare(`
      INSERT INTO item_metadata (item_type, item_id, title, cover, genres, extra, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(item_type, item_id)
      DO UPDATE SET title = excluded.title, cover = excluded.cover, genres = excluded.genres, extra = excluded.extra, updated_at = CURRENT_TIMESTAMP
    `);
  }
  return _upsertStmt;
}

export function saveItemMeta(meta: ItemMeta) {
  getUpsertStmt().run(meta.item_type, meta.item_id, meta.title, meta.cover || '', JSON.stringify(meta.genres || []), JSON.stringify(meta.extra || {}));
}

export function saveItemMetaBatch(items: ItemMeta[]) {
  const stmt = getUpsertStmt();
  const tx = db.transaction(() => {
    for (const m of items) {
      stmt.run(m.item_type, m.item_id, m.title, m.cover || '', JSON.stringify(m.genres || []), JSON.stringify(m.extra || {}));
    }
  });
  tx();
}

export function getItemMeta(itemType: string, itemId: string): ItemMeta | null {
  const row: any = db.prepare('SELECT * FROM item_metadata WHERE item_type = ? AND item_id = ?').get(itemType, itemId);
  if (!row) return null;
  return {
    item_type: row.item_type,
    item_id: row.item_id,
    title: row.title,
    cover: row.cover,
    genres: JSON.parse(row.genres || '[]'),
    extra: JSON.parse(row.extra || '{}'),
  };
}

export function getItemMetaBatch(itemType: string, itemIds: string[]): Map<string, ItemMeta> {
  if (itemIds.length === 0) return new Map();
  const ph = itemIds.map(() => '?').join(',');
  const rows: any[] = db.prepare(`SELECT * FROM item_metadata WHERE item_type = ? AND item_id IN (${ph})`).all(itemType, ...itemIds);
  const map = new Map<string, ItemMeta>();
  for (const row of rows) {
    map.set(row.item_id, {
      item_type: row.item_type,
      item_id: row.item_id,
      title: row.title,
      cover: row.cover,
      genres: JSON.parse(row.genres || '[]'),
      extra: JSON.parse(row.extra || '{}'),
    });
  }
  return map;
}

export function getAllItemMeta(itemType: string): ItemMeta[] {
  const rows: any[] = db.prepare('SELECT * FROM item_metadata WHERE item_type = ?').all(itemType);
  return rows.map(r => ({
    item_type: r.item_type,
    item_id: r.item_id,
    title: r.title,
    cover: r.cover,
    genres: JSON.parse(r.genres || '[]'),
    extra: JSON.parse(r.extra || '{}'),
  }));
}
