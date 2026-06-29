import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiTrash } from 'react-icons/hi2';
import { musicFullApi } from '@/services/musicApi';
import { useAuthStore } from '@/store/authStore';
import type { MusicComment, SiteSongComment } from '@/types/music';

function formatNeteaseTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatSiteTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface SongCommentsPanelProps {
  songId: number;
  songName: string;
}

export default function SongCommentsPanel({ songId, songName }: SongCommentsPanelProps) {
  const { user, isLoggedIn } = useAuthStore();
  const [siteComments, setSiteComments] = useState<SiteSongComment[]>([]);
  const [hotComments, setHotComments] = useState<MusicComment[]>([]);
  const [neteaseComments, setNeteaseComments] = useState<MusicComment[]>([]);
  const [neteaseTotal, setNeteaseTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [site, netease] = await Promise.all([
        musicFullApi.getSongSiteComments(songId).catch(() => [] as SiteSongComment[]),
        musicFullApi.getSongComments(songId, 30, 0).catch(() => ({
          comments: [] as MusicComment[],
          total: 0,
          hotComments: [] as MusicComment[],
        })),
      ]);
      setSiteComments(Array.isArray(site) ? site : []);
      setHotComments(netease.hotComments || []);
      setNeteaseComments(netease.comments || []);
      setNeteaseTotal(netease.total || 0);
    } catch {
      toast.error('评论加载失败');
    } finally {
      setLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    if (!isLoggedIn()) {
      toast.error('请先登录后再评论');
      return;
    }
    setSubmitting(true);
    try {
      const row = await musicFullApi.postSongSiteComment(songId, t, songName);
      setText('');
      setSiteComments((prev) => [row, ...prev]);
      toast.success('评论已发布');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await musicFullApi.deleteSongSiteComment(id);
      setSiteComments((prev) => prev.filter((c) => c.id !== id));
      toast.success('已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  const CommentRow = ({
    avatar,
    name,
    body,
    sub,
    right,
  }: {
    avatar?: string;
    name: string;
    body: string;
    sub: string;
    right?: React.ReactNode;
  }) => (
    <div className="flex gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white/10 border border-white/10">
        {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">{name[0]}</div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-sm font-medium text-white">{name}</span>
            <span className="text-[10px] text-gray-500 ml-2">{sub}</span>
          </div>
          {right}
        </div>
        <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap break-words leading-relaxed">{body}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 max-h-[min(56vh,520px)] w-full max-w-2xl mx-auto rounded-2xl glass border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
        <p className="text-xs text-gray-500">
          MuseHub 评论保存在本站；网易云热评通过公开接口拉取，与官方 App 热评一致（若接口限流或版权原因可能为空）。
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-6">
        {/* 本站 */}
        <section>
          <h3 className="text-sm font-semibold text-muse-300 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-muse-400 to-pink-500" />
            MuseHub 乐友评论
          </h3>
          {isLoggedIn() ? (
            <div className="mb-3 space-y-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="分享你对这首歌的感受…"
                rows={3}
                maxLength={2000}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-muse-500/50 resize-none"
              />
              <div className="flex justify-between items-center text-[10px] text-gray-500">
                <span>{text.length}/2000</span>
                <button
                  type="button"
                  disabled={submitting || !text.trim()}
                  onClick={submit}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-muse-500 to-pink-500 text-white text-xs font-medium disabled:opacity-40"
                >
                  {submitting ? '发送中…' : '发布评论'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 mb-3">登录后可参与 MuseHub 讨论。</p>
          )}

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />)}</div>
          ) : siteComments.length === 0 ? (
            <p className="text-xs text-gray-500 py-4">暂无本站评论，来做第一个留言的人吧。</p>
          ) : (
            <div>
              {siteComments.map((c) => (
                <CommentRow
                  key={c.id}
                  avatar={c.avatar || undefined}
                  name={c.username}
                  body={c.content}
                  sub={formatSiteTime(c.createdAt)}
                  right={
                    user?.id === c.userId ? (
                      <button type="button" onClick={() => remove(c.id)} className="p-1 rounded-lg text-gray-500 hover:text-red-400" title="删除">
                        <HiTrash className="w-4 h-4" />
                      </button>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* 网易云热评 */}
        <section>
          <h3 className="text-sm font-semibold text-amber-200/90 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
            网易云热评
          </h3>
          {loading ? (
            <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />)}</div>
          ) : hotComments.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">暂无热评数据（部分歌曲或地区可能不返回）。</p>
          ) : (
            <div>
              {hotComments.map((c) => (
                <CommentRow
                  key={`hot-${c.commentId}`}
                  avatar={c.user.avatarUrl}
                  name={c.user.nickname}
                  body={c.content}
                  sub={`${formatNeteaseTime(c.time)} · ${c.likedCount} 赞`}
                />
              ))}
            </div>
          )}
        </section>

        {/* 网易云最新 */}
        {neteaseComments.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-cyan-200/80 mb-2 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" />
              网易云精彩评论
              {neteaseTotal > 0 && <span className="text-[10px] font-normal text-gray-500">共约 {neteaseTotal} 条</span>}
            </h3>
            <div>
              {neteaseComments.map((c) => (
                <CommentRow
                  key={`nw-${c.commentId}`}
                  avatar={c.user.avatarUrl}
                  name={c.user.nickname}
                  body={c.content}
                  sub={`${formatNeteaseTime(c.time)} · ${c.likedCount} 赞`}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
