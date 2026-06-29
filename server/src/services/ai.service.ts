import OpenAI from 'openai';
import db from '../database';
import { config } from '../config';
import { v4 as uuid } from 'uuid';

const client = new OpenAI({
  apiKey: config.ai.apiKey,
  baseURL: config.ai.baseUrl,
});

// ─── 用户画像采集 ───

interface UserProfile {
  username: string;
  movieStats: { total: number; wish: number; doing: number; done: number; avgRating: number; topGenres: string[] };
  bookStats: { total: number; wish: number; doing: number; done: number; avgRating: number; topGenres: string[] };
  musicStats: { likedCount: number; playlistCount: number; recentPlays: string[] };
  recentMovies: { title: string; rating: number | null; status: string }[];
  recentBooks: { title: string; rating: number | null; status: string }[];
}

function getUserProfile(userId: number): UserProfile {
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;

  const movieMarks = db.prepare(`
    SELECT mm.status, mm.rating, im.title, im.genres
    FROM movie_marks mm
    LEFT JOIN item_metadata im ON im.item_type = 'movie' AND im.item_id = CAST(mm.movie_id AS TEXT)
    WHERE mm.user_id = ? ORDER BY mm.updated_at DESC
  `).all(userId) as any[];

  const bookMarks = db.prepare(`
    SELECT bm.status, bm.rating, im.title, im.genres
    FROM book_marks bm
    LEFT JOIN item_metadata im ON im.item_type = 'book' AND im.item_id = bm.book_id
    WHERE bm.user_id = ? ORDER BY bm.updated_at DESC
  `).all(userId) as any[];

  const musicLikeCount = (db.prepare('SELECT COUNT(*) as c FROM music_likes WHERE user_id = ?').get(userId) as any).c;
  const playlistCount = (db.prepare('SELECT COUNT(*) as c FROM user_playlists WHERE user_id = ?').get(userId) as any).c;
  const recentPlays = db.prepare(`
    SELECT im.title FROM play_history ph
    LEFT JOIN item_metadata im ON im.item_type = 'music' AND im.item_id = CAST(ph.song_id AS TEXT)
    WHERE ph.user_id = ? ORDER BY ph.played_at DESC LIMIT 10
  `).all(userId) as any[];

  const extractGenres = (items: any[]): string[] => {
    const freq: Record<string, number> = {};
    items.forEach(i => {
      try {
        const g = JSON.parse(i.genres || '[]');
        (Array.isArray(g) ? g : []).forEach((name: string) => { freq[name] = (freq[name] || 0) + 1; });
      } catch {}
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
  };

  const statsByStatus = (items: any[]) => {
    const rated = items.filter(i => i.rating);
    return {
      total: items.length,
      wish: items.filter(i => i.status === 'wish').length,
      doing: items.filter(i => i.status === 'doing').length,
      done: items.filter(i => i.status === 'done').length,
      avgRating: rated.length ? +(rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1) : 0,
      topGenres: extractGenres(items),
    };
  };

  return {
    username: user?.username || 'unknown',
    movieStats: statsByStatus(movieMarks),
    bookStats: statsByStatus(bookMarks),
    musicStats: {
      likedCount: musicLikeCount,
      playlistCount,
      recentPlays: recentPlays.map(p => p.title).filter(Boolean),
    },
    recentMovies: movieMarks.slice(0, 8).map(m => ({ title: m.title || '未知', rating: m.rating, status: m.status })),
    recentBooks: bookMarks.slice(0, 8).map(b => ({ title: b.title || '未知', rating: b.rating, status: b.status })),
  };
}

// ─── System Prompt 构建 ───

function buildSystemPrompt(userId: number): string {
  const profile = getUserProfile(userId);

  const profileSummary = [
    `## 用户画像（${profile.username}）`,
    '',
    `### 影视`,
    `- 标记 ${profile.movieStats.total} 部（想看 ${profile.movieStats.wish} / 在看 ${profile.movieStats.doing} / 看过 ${profile.movieStats.done}）`,
    profile.movieStats.avgRating ? `- 平均评分 ${profile.movieStats.avgRating}/10` : '',
    profile.movieStats.topGenres.length ? `- 偏好类型：${profile.movieStats.topGenres.join('、')}` : '',
    profile.recentMovies.length ? `- 最近标记：${profile.recentMovies.map(m => `${m.title}${m.rating ? `(${m.rating}分)` : ''}`).join('、')}` : '',
    '',
    `### 书籍`,
    `- 标记 ${profile.bookStats.total} 本（想读 ${profile.bookStats.wish} / 在读 ${profile.bookStats.doing} / 读过 ${profile.bookStats.done}）`,
    profile.bookStats.avgRating ? `- 平均评分 ${profile.bookStats.avgRating}/10` : '',
    profile.bookStats.topGenres.length ? `- 偏好类型：${profile.bookStats.topGenres.join('、')}` : '',
    profile.recentBooks.length ? `- 最近标记：${profile.recentBooks.map(b => `${b.title}${b.rating ? `(${b.rating}分)` : ''}`).join('、')}` : '',
    '',
    `### 音乐`,
    `- 喜欢 ${profile.musicStats.likedCount} 首歌，${profile.musicStats.playlistCount} 个歌单`,
    profile.musicStats.recentPlays.length ? `- 最近在听：${profile.musicStats.recentPlays.join('、')}` : '',
  ].filter(Boolean).join('\n');

  return `你是 MuseHub 的 AI 助手「Muse」，一个专业且友好的泛娱乐顾问。
MuseHub 是一个集影视、书籍、音乐于一体的多维娱乐推荐平台。

你的核心能力：
1. **个性化推荐** — 基于用户画像推荐电影、书籍、音乐，可跨领域联想（如"看完这本书适合配什么音乐"）
2. **内容解读** — 解读影视/书籍的主题、风格和深层含义
3. **品味分析** — 分析用户的娱乐偏好并给出画像总结
4. **榜单与趋势** — 推荐当下热门、经典必看/必读/必听内容
5. **跨模块联想** — 从一种内容形式出发推荐其他形式（电影→配乐→相关书籍）

回复规则：
- 使用中文回复，语气友好专业，适度使用 emoji 让对话更生动
- 推荐时说明推荐理由，结合用户已有偏好
- 每次推荐控制在 3-5 个，避免信息过载
- 如果不确定用户的需求，主动追问
- 不要编造虚假信息（如不存在的电影/书籍/歌曲）
- Markdown 格式让回复结构清晰

${profileSummary}`;
}

// ─── 对话管理 ───

function getOrCreateConversation(userId: number, conversationId?: string) {
  if (conversationId) {
    const conv = db.prepare('SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
    if (conv) return conv as any;
  }
  const id = uuid();
  db.prepare('INSERT INTO ai_conversations (id, user_id) VALUES (?, ?)').run(id, userId);
  return { id, user_id: userId, title: 'New Chat' };
}

function getConversationHistory(conversationId: string, limit = 20): { role: string; content: string }[] {
  return db.prepare(
    'SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(conversationId, limit).reverse() as any[];
}

function saveMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
  db.prepare('INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, ?, ?)').run(conversationId, role, content);
  db.prepare('UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);
}

function autoTitle(conversationId: string, firstMessage: string) {
  const title = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '');
  db.prepare('UPDATE ai_conversations SET title = ? WHERE id = ?').run(title, conversationId);
}

// ─── 每日限额 ───

function getDailyUsage(userId: number): number {
  const today = new Date().toISOString().slice(0, 10);
  const row = db.prepare(`
    SELECT COUNT(*) as c FROM ai_messages m
    JOIN ai_conversations c ON c.id = m.conversation_id
    WHERE c.user_id = ? AND m.role = 'user' AND DATE(m.created_at) = ?
  `).get(userId, today) as any;
  return row?.c || 0;
}

// ─── 流式聊天 ───

export async function* streamChat(
  userId: number,
  message: string,
  conversationId?: string
): AsyncGenerator<{ type: 'meta' | 'delta' | 'done' | 'error'; data: string }> {
  if (!config.ai.apiKey) {
    yield { type: 'error', data: 'AI 服务未配置，请联系管理员设置 AI_API_KEY' };
    return;
  }

  const usage = getDailyUsage(userId);
  if (usage >= config.ai.dailyLimit) {
    yield { type: 'error', data: `今日对话次数已用完（${config.ai.dailyLimit}次/天），明天再来吧~` };
    return;
  }

  const conv = getOrCreateConversation(userId, conversationId);
  const history = getConversationHistory(conv.id);
  const isFirst = history.length === 0;

  saveMessage(conv.id, 'user', message);
  if (isFirst) autoTitle(conv.id, message);

  yield { type: 'meta', data: JSON.stringify({ conversationId: conv.id }) };

  const systemPrompt = buildSystemPrompt(userId);
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user', content: message },
  ];

  try {
    const stream = await client.chat.completions.create({
      model: config.ai.model,
      messages,
      max_tokens: config.ai.maxTokens,
      stream: true,
      temperature: 0.8,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        yield { type: 'delta', data: delta };
      }
    }

    if (fullResponse) {
      saveMessage(conv.id, 'assistant', fullResponse);
    }

    yield { type: 'done', data: '' };
  } catch (err: any) {
    console.error('[AI] Stream error:', err.message);
    const errMsg = err.status === 401 ? 'AI 密钥无效，请检查配置'
      : err.status === 429 ? 'AI 服务繁忙，请稍后再试'
      : `AI 服务异常: ${err.message}`;
    yield { type: 'error', data: errMsg };
  }
}

// ─── CRUD 接口 ───

export function listConversations(userId: number, limit = 30) {
  return db.prepare(
    'SELECT id, title, created_at, updated_at FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?'
  ).all(userId, limit);
}

export function getConversationMessages(userId: number, conversationId: string) {
  const conv = db.prepare('SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
  if (!conv) return null;
  return db.prepare('SELECT id, role, content, created_at FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId);
}

export function deleteConversation(userId: number, conversationId: string) {
  const result = db.prepare('DELETE FROM ai_conversations WHERE id = ? AND user_id = ?').run(conversationId, userId);
  return result.changes > 0;
}
