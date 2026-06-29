/**
 * MuseHub 协同过滤推荐引擎
 *
 * 算法体系：
 *   1. User-based CF   — 基于用户的协同过滤（Pearson 相关系数）
 *   2. Item-based CF   — 基于物品的协同过滤（余弦相似度）
 *   3. Content-based   — 基于内容的过滤（类型/标签向量）
 *   4. Hybrid          — 加权混合推荐（可调权重）
 *   5. Cross-module    — 跨模块联动推荐
 *
 * 数据闭环：
 *   所有推荐物品的元信息（标题/封面/类型）统一来自 item_metadata 缓存表
 *   该表在用户标记时同步写入，与前端展示数据保持同源
 *
 * 冷启动策略：新用户 → 热度排行 + 随机探索；新物品 → 内容相似度
 */

import db from '../database';
import { getItemMeta, getItemMetaBatch, type ItemMeta } from './itemMetadata.service';

// ─── 类型定义 ───

export interface RecommendItem {
  itemId: string;
  itemType: 'movie' | 'book' | 'music';
  score: number;
  reasons: string[];
  method: 'user-cf' | 'item-cf' | 'content' | 'hybrid' | 'popularity' | 'cross-module';
  title?: string;
  cover?: string;
  genres?: string[];
}

export interface SimilarityPair {
  id: number | string;
  similarity: number;
}

export interface AlgorithmWeights {
  userCF: number;
  itemCF: number;
  content: number;
}

interface UserRatingVector {
  userId: number;
  ratings: Map<string, number>;
}

// ─── 默认算法权重 ───
const DEFAULT_WEIGHTS: AlgorithmWeights = {
  userCF: 0.4,
  itemCF: 0.35,
  content: 0.25,
};

// ─── 工具函数 ───

function pearsonCorrelation(vecA: Map<string, number>, vecB: Map<string, number>): number {
  const common: string[] = [];
  vecA.forEach((_, key) => { if (vecB.has(key)) common.push(key); });
  const n = common.length;
  if (n < 2) return 0;

  let sumA = 0, sumB = 0, sumA2 = 0, sumB2 = 0, sumAB = 0;
  for (const key of common) {
    const a = vecA.get(key)!;
    const b = vecB.get(key)!;
    sumA += a; sumB += b;
    sumA2 += a * a; sumB2 += b * b;
    sumAB += a * b;
  }

  const num = sumAB - (sumA * sumB) / n;
  const den = Math.sqrt((sumA2 - sumA * sumA / n) * (sumB2 - sumB * sumB / n));
  if (den === 0) return 0;
  return num / den;
}

function cosineSimilarity(vecA: Map<number, number>, vecB: Map<number, number>): number {
  let dot = 0, normA = 0, normB = 0;
  vecA.forEach((valA, key) => {
    const valB = vecB.get(key);
    if (valB !== undefined) dot += valA * valB;
    normA += valA * valA;
  });
  vecB.forEach((val) => { normB += val * val; });
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  let intersection = 0;
  setA.forEach(item => { if (setB.has(item)) intersection++; });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** 给推荐结果列表批量填充元信息 */
function enrichResults(items: RecommendItem[]): RecommendItem[] {
  const grouped = new Map<string, string[]>();
  for (const item of items) {
    const key = item.itemType;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item.itemId);
  }
  const metaLookup = new Map<string, ItemMeta>();
  grouped.forEach((ids, type) => {
    const batch = getItemMetaBatch(type, ids);
    batch.forEach((v, k) => metaLookup.set(`${type}:${k}`, v));
  });

  return items.map(item => {
    const meta = metaLookup.get(`${item.itemType}:${item.itemId}`);
    if (meta) {
      return { ...item, title: meta.title, cover: meta.cover, genres: meta.genres };
    }
    return item;
  });
}

// ─── 核心推荐引擎 ───

class RecommendationEngine {
  private weights: AlgorithmWeights = { ...DEFAULT_WEIGHTS };

  setWeights(w: Partial<AlgorithmWeights>) {
    if (w.userCF !== undefined) this.weights.userCF = w.userCF;
    if (w.itemCF !== undefined) this.weights.itemCF = w.itemCF;
    if (w.content !== undefined) this.weights.content = w.content;
    const total = this.weights.userCF + this.weights.itemCF + this.weights.content;
    this.weights.userCF /= total;
    this.weights.itemCF /= total;
    this.weights.content /= total;
  }

  getWeights() { return { ...this.weights }; }

  // ═══════════════════════════════════════
  //  1. User-based Collaborative Filtering
  // ═══════════════════════════════════════

  private buildUserRatingMatrix(itemType: 'movie' | 'book'): UserRatingVector[] {
    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const idCol = itemType === 'movie' ? 'movie_id' : 'book_id';
    const statusScore: Record<string, number> = { wish: 1, doing: 2, done: 3 };

    const rows: any[] = db.prepare(`SELECT user_id, ${idCol} as item_id, status, rating FROM ${table}`).all();
    const userMap = new Map<number, Map<string, number>>();

    for (const row of rows) {
      if (!userMap.has(row.user_id)) userMap.set(row.user_id, new Map());
      const score = row.rating || statusScore[row.status] || 1;
      userMap.get(row.user_id)!.set(String(row.item_id), score);
    }

    return Array.from(userMap.entries()).map(([userId, ratings]) => ({ userId, ratings }));
  }

  findSimilarUsers(userId: number, itemType: 'movie' | 'book', topK = 20): SimilarityPair[] {
    const matrix = this.buildUserRatingMatrix(itemType);
    const targetVec = matrix.find(v => v.userId === userId);
    if (!targetVec || targetVec.ratings.size < 1) return [];

    const similarities: SimilarityPair[] = [];
    for (const other of matrix) {
      if (other.userId === userId) continue;
      const sim = pearsonCorrelation(targetVec.ratings, other.ratings);
      if (sim > 0) similarities.push({ id: other.userId, similarity: sim });
    }

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }

  recommendByUserCF(userId: number, itemType: 'movie' | 'book', limit = 20): RecommendItem[] {
    const similarUsers = this.findSimilarUsers(userId, itemType);
    if (similarUsers.length === 0) return [];

    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const idCol = itemType === 'movie' ? 'movie_id' : 'book_id';

    const userItems = new Set<string>(
      db.prepare(`SELECT ${idCol} as id FROM ${table} WHERE user_id = ?`).all(userId).map((r: any) => String(r.id))
    );

    const candidateScores = new Map<string, { score: number; contributors: number[] }>();

    for (const { id: simUserId, similarity } of similarUsers) {
      const rows: any[] = db.prepare(`SELECT ${idCol} as item_id, status, rating FROM ${table} WHERE user_id = ?`).all(simUserId);
      const statusScore: Record<string, number> = { wish: 1, doing: 2, done: 3 };

      for (const row of rows) {
        const itemId = String(row.item_id);
        if (userItems.has(itemId)) continue;
        const rawScore = row.rating || statusScore[row.status] || 1;
        const weightedScore = similarity * rawScore;

        if (!candidateScores.has(itemId)) candidateScores.set(itemId, { score: 0, contributors: [] });
        const entry = candidateScores.get(itemId)!;
        entry.score += weightedScore;
        entry.contributors.push(simUserId as number);
      }
    }

    return Array.from(candidateScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([itemId, { score, contributors }]) => ({
        itemId,
        itemType,
        score: Math.min(score / (contributors.length || 1), 5),
        reasons: [`${contributors.length}位品味相似的用户也喜欢`],
        method: 'user-cf' as const,
      }));
  }

  // ═══════════════════════════════════════
  //  2. Item-based Collaborative Filtering
  // ═══════════════════════════════════════

  private buildItemRatingVectors(itemType: 'movie' | 'book'): Map<string, Map<number, number>> {
    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const idCol = itemType === 'movie' ? 'movie_id' : 'book_id';
    const statusScore: Record<string, number> = { wish: 1, doing: 2, done: 3 };

    const rows: any[] = db.prepare(`SELECT user_id, ${idCol} as item_id, status, rating FROM ${table}`).all();
    const itemMap = new Map<string, Map<number, number>>();

    for (const row of rows) {
      const itemId = String(row.item_id);
      if (!itemMap.has(itemId)) itemMap.set(itemId, new Map());
      itemMap.get(itemId)!.set(row.user_id, row.rating || statusScore[row.status] || 1);
    }
    return itemMap;
  }

  findSimilarItems(targetItemId: string, itemType: 'movie' | 'book', topK = 20): SimilarityPair[] {
    const itemVectors = this.buildItemRatingVectors(itemType);
    const targetVec = itemVectors.get(targetItemId);
    if (!targetVec || targetVec.size < 1) return [];

    const similarities: SimilarityPair[] = [];
    itemVectors.forEach((vec, itemId) => {
      if (itemId === targetItemId) return;
      const sim = cosineSimilarity(targetVec, vec);
      if (sim > 0) similarities.push({ id: itemId, similarity: sim });
    });

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }

  recommendByItemCF(userId: number, itemType: 'movie' | 'book', limit = 20): RecommendItem[] {
    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const idCol = itemType === 'movie' ? 'movie_id' : 'book_id';

    const userMarks: any[] = db.prepare(
      `SELECT ${idCol} as item_id, status, rating FROM ${table} WHERE user_id = ? ORDER BY rating DESC, updated_at DESC LIMIT 30`
    ).all(userId);

    if (userMarks.length === 0) return [];

    const userItemSet = new Set(userMarks.map(m => String(m.item_id)));
    const candidateScores = new Map<string, { score: number; sourceItems: string[] }>();
    const statusScore: Record<string, number> = { wish: 1, doing: 2, done: 3 };

    for (const mark of userMarks) {
      const baseScore = mark.rating || statusScore[mark.status] || 1;
      const similar = this.findSimilarItems(String(mark.item_id), itemType, 10);

      for (const { id, similarity } of similar) {
        const candidateId = String(id);
        if (userItemSet.has(candidateId)) continue;

        if (!candidateScores.has(candidateId)) candidateScores.set(candidateId, { score: 0, sourceItems: [] });
        const entry = candidateScores.get(candidateId)!;
        entry.score += similarity * baseScore;
        if (entry.sourceItems.length < 3) entry.sourceItems.push(String(mark.item_id));
      }
    }

    return Array.from(candidateScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([itemId, { score, sourceItems }]) => ({
        itemId,
        itemType,
        score: Math.min(score, 5),
        reasons: [`与你喜欢的${sourceItems.length}个${itemType === 'movie' ? '影视' : '书籍'}相似`],
        method: 'item-cf' as const,
      }));
  }

  // ═══════════════════════════════════════
  //  3. Content-based Filtering
  //     数据来源：item_metadata 表（与前端展示同源）
  // ═══════════════════════════════════════

  buildUserProfile(userId: number, itemType: 'movie' | 'book'): Map<string, number> {
    const profile = new Map<string, number>();
    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const idCol = itemType === 'movie' ? 'movie_id' : 'book_id';

    const marks: any[] = db.prepare(
      `SELECT ${idCol} as item_id, status, rating FROM ${table} WHERE user_id = ? AND (status = 'done' OR rating >= 3)`
    ).all(userId);

    const itemIds = marks.map(m => String(m.item_id));
    const metaBatch = getItemMetaBatch(itemType, itemIds);

    for (const mark of marks) {
      const weight = mark.rating || (mark.status === 'done' ? 3 : 2);
      const meta = metaBatch.get(String(mark.item_id));
      if (meta && meta.genres) {
        for (const g of meta.genres) {
          profile.set(g, (profile.get(g) || 0) + weight);
        }
      }
    }

    return profile;
  }

  recommendByContent(userId: number, itemType: 'movie' | 'book', limit = 20): RecommendItem[] {
    const profile = this.buildUserProfile(userId, itemType);
    if (profile.size === 0) return [];

    const topGenres = Array.from(profile.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);

    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const idCol = itemType === 'movie' ? 'movie_id' : 'book_id';

    const userItems = new Set<string>(
      db.prepare(`SELECT ${idCol} as id FROM ${table} WHERE user_id = ?`).all(userId).map((r: any) => String(r.id))
    );

    // 从 item_metadata 中获取所有该类型物品的类型信息
    const allMeta: any[] = db.prepare('SELECT item_id, genres FROM item_metadata WHERE item_type = ?').all(itemType);

    const results: RecommendItem[] = [];
    for (const row of allMeta) {
      if (userItems.has(row.item_id)) continue;
      const itemGenres: string[] = JSON.parse(row.genres || '[]');
      const matching = topGenres.filter(g => itemGenres.includes(g));
      if (matching.length > 0) {
        results.push({
          itemId: row.item_id,
          itemType,
          score: matching.length / topGenres.length * 4,
          reasons: [`因为你喜欢${matching.join('、')}类型`],
          method: 'content',
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // ═══════════════════════════════════════
  //  4. 混合推荐 (Hybrid)
  // ═══════════════════════════════════════

  recommendHybrid(userId: number, itemType: 'movie' | 'book', limit = 20): RecommendItem[] {
    const userCFResults = this.recommendByUserCF(userId, itemType, limit * 2);
    const itemCFResults = this.recommendByItemCF(userId, itemType, limit * 2);
    const contentResults = this.recommendByContent(userId, itemType, limit * 2);

    const scoreMap = new Map<string, {
      score: number;
      reasons: Set<string>;
      methods: Set<string>;
      breakdown: { userCF: number; itemCF: number; content: number };
    }>();

    const addResults = (results: RecommendItem[], weight: number, methodKey: keyof AlgorithmWeights) => {
      for (const item of results) {
        if (!scoreMap.has(item.itemId)) {
          scoreMap.set(item.itemId, {
            score: 0,
            reasons: new Set(),
            methods: new Set(),
            breakdown: { userCF: 0, itemCF: 0, content: 0 },
          });
        }
        const entry = scoreMap.get(item.itemId)!;
        const weighted = item.score * weight;
        entry.score += weighted;
        entry.breakdown[methodKey] = item.score;
        entry.methods.add(item.method);
        item.reasons.forEach(r => entry.reasons.add(r));
      }
    };

    addResults(userCFResults, this.weights.userCF, 'userCF');
    addResults(itemCFResults, this.weights.itemCF, 'itemCF');
    addResults(contentResults, this.weights.content, 'content');

    return Array.from(scoreMap.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([itemId, entry]) => ({
        itemId,
        itemType,
        score: Math.round(entry.score * 100) / 100,
        reasons: Array.from(entry.reasons).slice(0, 3),
        method: 'hybrid' as const,
        breakdown: entry.breakdown,
        methodCount: entry.methods.size,
      }));
  }

  // ═══════════════════════════════════════
  //  5. 音乐推荐（基于喜欢的 Jaccard 相似度）
  // ═══════════════════════════════════════

  recommendMusic(userId: number, limit = 30): RecommendItem[] {
    const userLikes = new Set<string>(
      db.prepare('SELECT song_id FROM music_likes WHERE user_id = ?').all(userId).map((r: any) => String(r.song_id))
    );
    if (userLikes.size === 0) return enrichResults(this.getPopularMusic(limit));

    const allUsers: any[] = db.prepare('SELECT DISTINCT user_id FROM music_likes WHERE user_id != ?').all(userId);
    const similarities: { userId: number; sim: number }[] = [];
    for (const { user_id } of allUsers) {
      const otherLikes = new Set<string>(
        db.prepare('SELECT song_id FROM music_likes WHERE user_id = ?').all(user_id).map((r: any) => String(r.song_id))
      );
      const sim = jaccardSimilarity(userLikes, otherLikes);
      if (sim > 0) similarities.push({ userId: user_id, sim });
    }

    similarities.sort((a, b) => b.sim - a.sim);
    const topSimilar = similarities.slice(0, 20);

    const candidateScores = new Map<string, { score: number; count: number }>();
    for (const { userId: simUser, sim } of topSimilar) {
      const songs: any[] = db.prepare('SELECT song_id FROM music_likes WHERE user_id = ?').all(simUser);
      for (const { song_id } of songs) {
        const sid = String(song_id);
        if (userLikes.has(sid)) continue;
        if (!candidateScores.has(sid)) candidateScores.set(sid, { score: 0, count: 0 });
        const e = candidateScores.get(sid)!;
        e.score += sim;
        e.count++;
      }
    }

    const raw = Array.from(candidateScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([itemId, { score, count }]) => ({
        itemId,
        itemType: 'music' as const,
        score: Math.round(score * 100) / 100,
        reasons: [`${count}位听歌口味相似的用户也喜欢`],
        method: 'user-cf' as const,
      }));

    return enrichResults(raw);
  }

  private getPopularMusic(limit: number): RecommendItem[] {
    const rows: any[] = db.prepare(
      'SELECT song_id, COUNT(*) as cnt FROM music_likes GROUP BY song_id ORDER BY cnt DESC LIMIT ?'
    ).all(limit);
    return rows.map(r => ({
      itemId: String(r.song_id),
      itemType: 'music' as const,
      score: r.cnt,
      reasons: ['平台热门歌曲'],
      method: 'popularity' as const,
    }));
  }

  // ═══════════════════════════════════════
  //  6. 冷启动策略
  // ═══════════════════════════════════════

  getPopularItems(itemType: 'movie' | 'book', limit = 20): RecommendItem[] {
    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const idCol = itemType === 'movie' ? 'movie_id' : 'book_id';
    const rows: any[] = db.prepare(
      `SELECT ${idCol} as item_id, COUNT(*) as cnt, AVG(COALESCE(rating,3)) as avg_r FROM ${table} GROUP BY ${idCol} ORDER BY cnt DESC, avg_r DESC LIMIT ?`
    ).all(limit);
    return rows.map(r => ({
      itemId: String(r.item_id),
      itemType,
      score: r.avg_r || 3,
      reasons: [`${r.cnt}人标记，平台热门`],
      method: 'popularity' as const,
    }));
  }

  /** 智能推荐入口 — 结果携带元信息 */
  recommend(userId: number, itemType: 'movie' | 'book', limit = 20): RecommendItem[] {
    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const userMarkCount = (db.prepare(`SELECT COUNT(*) as c FROM ${table} WHERE user_id = ?`).get(userId) as any).c;

    let results: RecommendItem[];

    if (userMarkCount < 3) {
      results = this.getPopularItems(itemType, limit).map(item => ({
        ...item,
        reasons: [...item.reasons, '（标记更多内容可获得个性化推荐）'],
      }));
    } else {
      results = this.recommendHybrid(userId, itemType, limit);
      if (results.length < limit) {
        const popular = this.getPopularItems(itemType, limit - results.length);
        const existingIds = new Set(results.map(h => h.itemId));
        for (const p of popular) {
          if (!existingIds.has(p.itemId)) results.push(p);
        }
      }
    }

    return enrichResults(results);
  }

  // ═══════════════════════════════════════
  //  7. 跨模块联动推荐
  // ═══════════════════════════════════════

  crossModuleRecommend(userId: number, sourceType: 'movie' | 'book' | 'music', targetType: 'movie' | 'book' | 'music', limit = 10): RecommendItem[] {
    let sourceUserIds: number[] = [];

    if (sourceType === 'music') {
      const userSongs = db.prepare('SELECT song_id FROM music_likes WHERE user_id = ?').all(userId).map((r: any) => r.song_id);
      if (userSongs.length === 0) return [];
      const placeholders = userSongs.map(() => '?').join(',');
      sourceUserIds = db.prepare(`SELECT DISTINCT user_id FROM music_likes WHERE song_id IN (${placeholders}) AND user_id != ?`)
        .all(...userSongs, userId).map((r: any) => r.user_id);
    } else {
      const table = sourceType === 'movie' ? 'movie_marks' : 'book_marks';
      const idCol = sourceType === 'movie' ? 'movie_id' : 'book_id';
      const items = db.prepare(`SELECT ${idCol} as id FROM ${table} WHERE user_id = ?`).all(userId).map((r: any) => String(r.id));
      if (items.length === 0) return [];
      const placeholders = items.map(() => '?').join(',');
      sourceUserIds = db.prepare(`SELECT DISTINCT user_id FROM ${table} WHERE ${idCol} IN (${placeholders}) AND user_id != ?`)
        .all(...items, userId).map((r: any) => r.user_id);
    }

    if (sourceUserIds.length === 0) return [];
    const sampleUsers = sourceUserIds.slice(0, 50);

    if (targetType === 'music') {
      const userLikes = new Set(db.prepare('SELECT song_id FROM music_likes WHERE user_id = ?').all(userId).map((r: any) => String(r.song_id)));
      const counts = new Map<string, number>();
      for (const uid of sampleUsers) {
        const songs: any[] = db.prepare('SELECT song_id FROM music_likes WHERE user_id = ?').all(uid);
        for (const { song_id } of songs) {
          const sid = String(song_id);
          if (userLikes.has(sid)) continue;
          counts.set(sid, (counts.get(sid) || 0) + 1);
        }
      }
      const raw = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1]).slice(0, limit)
        .map(([id, cnt]) => ({
          itemId: id, itemType: 'music' as const, score: cnt,
          reasons: [`${cnt}位有相似${sourceType === 'movie' ? '观影' : '阅读'}品味的用户也在听`],
          method: 'cross-module' as const,
        }));
      return enrichResults(raw);
    }

    const targetTable = targetType === 'movie' ? 'movie_marks' : 'book_marks';
    const targetIdCol = targetType === 'movie' ? 'movie_id' : 'book_id';
    const userItems = new Set(db.prepare(`SELECT ${targetIdCol} as id FROM ${targetTable} WHERE user_id = ?`).all(userId).map((r: any) => String(r.id)));
    const counts = new Map<string, number>();

    for (const uid of sampleUsers) {
      const items: any[] = db.prepare(`SELECT ${targetIdCol} as id FROM ${targetTable} WHERE user_id = ?`).all(uid);
      for (const { id } of items) {
        const sid = String(id);
        if (userItems.has(sid)) continue;
        counts.set(sid, (counts.get(sid) || 0) + 1);
      }
    }

    const srcLabel = sourceType === 'movie' ? '观影' : sourceType === 'book' ? '阅读' : '听歌';
    const raw = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, limit)
      .map(([id, cnt]) => ({
        itemId: id, itemType: targetType, score: cnt,
        reasons: [`${cnt}位${srcLabel}品味相似的用户也在${targetType === 'movie' ? '看' : '读'}`],
        method: 'cross-module' as const,
      }));
    return enrichResults(raw);
  }

  // ═══════════════════════════════════════
  //  8. 推荐评估指标
  // ═══════════════════════════════════════

  evaluate(itemType: 'movie' | 'book'): {
    precision: number; recall: number; coverage: number;
    userCount: number; avgListLength: number;
    methodDistribution: Record<string, number>;
  } {
    const table = itemType === 'movie' ? 'movie_marks' : 'book_marks';
    const idCol = itemType === 'movie' ? 'movie_id' : 'book_id';

    const users: any[] = db.prepare(
      `SELECT user_id, COUNT(*) as cnt FROM ${table} GROUP BY user_id HAVING cnt >= 5`
    ).all();

    let hits = 0, totalRecommended = 0, totalRelevant = 0;
    const allRecommendedItems = new Set<string>();
    const methodCounts: Record<string, number> = {};
    let totalListLen = 0;

    for (const { user_id } of users) {
      const highRated: any[] = db.prepare(
        `SELECT ${idCol} as id FROM ${table} WHERE user_id = ? AND (rating >= 4 OR status = 'done') ORDER BY RANDOM() LIMIT 1`
      ).all(user_id);
      if (highRated.length === 0) continue;

      const holdout = String(highRated[0].id);
      totalRelevant++;

      const recs = this.recommend(user_id, itemType, 20);
      totalRecommended += recs.length;
      totalListLen += recs.length;

      for (const rec of recs) {
        allRecommendedItems.add(rec.itemId);
        methodCounts[rec.method] = (methodCounts[rec.method] || 0) + 1;
        if (rec.itemId === holdout) hits++;
      }
    }

    const totalItems = (db.prepare(`SELECT COUNT(DISTINCT ${idCol}) as c FROM ${table}`).get() as any).c;

    return {
      precision: totalRecommended > 0 ? hits / totalRecommended : 0,
      recall: totalRelevant > 0 ? hits / totalRelevant : 0,
      coverage: totalItems > 0 ? allRecommendedItems.size / totalItems : 0,
      userCount: users.length,
      avgListLength: users.length > 0 ? totalListLen / users.length : 0,
      methodDistribution: methodCounts,
    };
  }

  getStats() {
    const movieUsers = (db.prepare('SELECT COUNT(DISTINCT user_id) as c FROM movie_marks').get() as any).c;
    const bookUsers = (db.prepare('SELECT COUNT(DISTINCT user_id) as c FROM book_marks').get() as any).c;
    const musicUsers = (db.prepare('SELECT COUNT(DISTINCT user_id) as c FROM music_likes').get() as any).c;
    const totalMovieMarks = (db.prepare('SELECT COUNT(*) as c FROM movie_marks').get() as any).c;
    const totalBookMarks = (db.prepare('SELECT COUNT(*) as c FROM book_marks').get() as any).c;
    const totalMusicLikes = (db.prepare('SELECT COUNT(*) as c FROM music_likes').get() as any).c;
    const uniqueMovies = (db.prepare('SELECT COUNT(DISTINCT movie_id) as c FROM movie_marks').get() as any).c;
    const uniqueBooks = (db.prepare('SELECT COUNT(DISTINCT book_id) as c FROM book_marks').get() as any).c;
    const uniqueSongs = (db.prepare('SELECT COUNT(DISTINCT song_id) as c FROM music_likes').get() as any).c;
    const metaMovies = (db.prepare("SELECT COUNT(*) as c FROM item_metadata WHERE item_type='movie'").get() as any).c;
    const metaBooks = (db.prepare("SELECT COUNT(*) as c FROM item_metadata WHERE item_type='book'").get() as any).c;
    const metaMusic = (db.prepare("SELECT COUNT(*) as c FROM item_metadata WHERE item_type='music'").get() as any).c;

    const sparsity = {
      movie: movieUsers > 0 && uniqueMovies > 0 ? 1 - totalMovieMarks / (movieUsers * uniqueMovies) : 1,
      book: bookUsers > 0 && uniqueBooks > 0 ? 1 - totalBookMarks / (bookUsers * uniqueBooks) : 1,
      music: musicUsers > 0 && uniqueSongs > 0 ? 1 - totalMusicLikes / (musicUsers * uniqueSongs) : 1,
    };

    return {
      weights: this.getWeights(),
      matrix: {
        movie: { users: movieUsers, items: uniqueMovies, interactions: totalMovieMarks, sparsity: Math.round(sparsity.movie * 10000) / 100, metaCached: metaMovies },
        book: { users: bookUsers, items: uniqueBooks, interactions: totalBookMarks, sparsity: Math.round(sparsity.book * 10000) / 100, metaCached: metaBooks },
        music: { users: musicUsers, items: uniqueSongs, interactions: totalMusicLikes, sparsity: Math.round(sparsity.music * 10000) / 100, metaCached: metaMusic },
      },
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
