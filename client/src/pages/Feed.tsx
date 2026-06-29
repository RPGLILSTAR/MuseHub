import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiArrowPath,
  HiUsers,
  HiSparkles,
  HiFilm,
  HiBookOpen,
  HiMusicalNote,
} from 'react-icons/hi2';
import { socialApi } from '@/services/socialApi';
import { useAuthStore } from '@/store/authStore';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

type FeedActivity = {
  id: number;
  user_id: number;
  username: string;
  avatar: string | null;
  action: string;
  item_type: 'movie' | 'book' | 'music' | string;
  item_id: string;
  item_title: string;
  item_cover: string;
  created_at: string;
  extra?: Record<string, any>;
};

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  mark_wish: '标记为想看',
  mark_doing: '标记为在看',
  mark_done: '标记为看过',
  mark_wish_book: '标记为想读',
  mark_doing_book: '标记为在读',
  mark_done_book: '标记为读过',
  review: '发表了评论',
  like_song: '喜欢了歌曲',
  comment_song: '评论了歌曲',
  create_playlist: '创建了歌单',
  create_list: '创建了书单',
  create_list_movie: '创建了片单',
};

const TYPE_META: Record<string, { label: string; icon: typeof HiSparkles; gradient: string }> = {
  movie: { label: '影视', icon: HiFilm, gradient: 'from-orange-500 to-red-500' },
  book: { label: '书籍', icon: HiBookOpen, gradient: 'from-cyan-500 to-teal-500' },
  music: { label: '音乐', icon: HiMusicalNote, gradient: 'from-pink-500 to-rose-500' },
};

function formatRelativeTime(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff) || diff < 0) return '刚刚';
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  return new Date(value).toLocaleString('zh-CN', { month: 'short', day: 'numeric' });
}

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}

function getTypeMeta(itemType: string) {
  return TYPE_META[itemType] || { label: '内容', icon: HiSparkles, gradient: 'from-gray-500 to-slate-600' };
}

function getItemLink(item: FeedActivity): string | null {
  if (item.item_type === 'movie') return `/movies/${item.item_id}`;
  if (item.item_type === 'book') return `/books/${item.item_id}`;
  if (item.item_type === 'music') {
    const keyword = encodeURIComponent(item.item_title || item.item_id);
    return `/music/search?q=${keyword}`;
  }
  return null;
}

function formatItemTitle(item: FeedActivity): string {
  if (!item.item_title) return '未知内容';
  if (item.item_type === 'movie' || item.item_type === 'book') return `《${item.item_title}》`;
  return item.item_title;
}

export default function Feed() {
  const { token, user } = useAuthStore();
  const isLoggedIn = !!token;
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const fetchFeed = useCallback(async (targetPage: number) => {
    const isFirstPage = targetPage === 1;
    if (isFirstPage) setLoading(true);
    else setLoadingMore(true);
    setError('');

    try {
      const response = await socialApi.getFeed(targetPage) as { data?: FeedActivity[]; page?: number };
      const rows = response?.data || [];
      setActivities((prev) => (isFirstPage ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('登录已过期，请重新登录');
      } else {
        setError(isFirstPage ? '动态流加载失败，请稍后重试' : '加载更多动态失败，请稍后重试');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setActivities([]);
      setPage(1);
      setRefreshKey(0);
      setHasMore(true);
      setLoading(false);
      setLoadingMore(false);
      setError('');
      return;
    }

    let cancelled = false;
    fetchFeed(page).then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, page, refreshKey, fetchFeed]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: () => setPage((p) => p + 1),
    hasMore,
    isLoading: loading || loadingMore,
    threshold: 500,
  });

  const refreshFeed = () => {
    if (!isLoggedIn) return;
    setActivities([]);
    setHasMore(true);
    setPage(1);
    setRefreshKey((k) => k + 1);
  };

  const renderExtraBadges = (activity: FeedActivity) => {
    const badges: JSX.Element[] = [];

    if (typeof activity.extra?.rating === 'number') {
      badges.push(
        <span
          key="rating"
          className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200"
        >
          评分 {activity.extra.rating}
        </span>
      );
    }

    const tags = (activity.extra?.genres || activity.extra?.categories || []) as string[];
    tags.slice(0, 3).forEach((tag) => {
      badges.push(
        <span
          key={tag}
          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-300"
        >
          {tag}
        </span>
      );
    });

    return badges;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md glass rounded-3xl border border-white/10 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-neon-purple">
            <HiUsers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">关注动态流</h1>
          <p className="text-sm text-gray-400 mt-3 leading-relaxed">
            登录后可查看你关注的用户最近在影视、书籍和音乐模块里的最新行为。
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-muse-500 to-pink-500 text-white font-medium hover:shadow-neon-purple transition-all"
          >
            立即登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl border border-white/10 p-6 sm:p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-muse-500/20 bg-muse-500/10 px-3 py-1 text-xs text-muse-300">
                <HiSparkles className="w-3.5 h-3.5" />
                社交动态
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mt-4">关注动态流</h1>
              <p className="text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
                {user?.username ? `${user.username}，` : ''}这里展示你关注的人在平台上的最新标记、评论、歌单和喜欢记录。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 min-w-[140px]">
                <p className="text-[11px] uppercase tracking-wider text-gray-500">已加载</p>
                <p className="text-2xl font-bold text-white mt-1">{activities.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 min-w-[140px]">
                <p className="text-[11px] uppercase tracking-wider text-gray-500">当前页</p>
                <p className="text-2xl font-bold text-white mt-1">{page}</p>
              </div>
              <button
                type="button"
                onClick={refreshFeed}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <HiArrowPath className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                刷新动态
              </button>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl border border-white/10 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-1/3 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/10" />
                    <div className="h-28 rounded-2xl bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, idx) => {
              const itemLink = getItemLink(activity);
              const typeMeta = getTypeMeta(activity.item_type);
              const TypeIcon = typeMeta.icon;

              return (
                <motion.article
                  key={activity.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                  className="glass rounded-2xl border border-white/10 p-5"
                >
                  <div className="flex gap-4">
                    <Link to={`/user/${activity.user_id}`} className="flex-shrink-0">
                      {activity.avatar ? (
                        <img src={activity.avatar} alt={activity.username} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center text-lg font-bold text-white border border-white/10">
                          {activity.username?.[0] || 'U'}
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-300 leading-relaxed">
                            <Link to={`/user/${activity.user_id}`} className="font-semibold text-white hover:text-muse-300 transition-colors">
                              {activity.username}
                            </Link>
                            <span className="text-gray-400"> {getActionLabel(activity.action)} </span>
                            {activity.item_title && (
                              <span className="font-medium text-white">{formatItemTitle(activity)}</span>
                            )}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span>{formatRelativeTime(activity.created_at)}</span>
                            {activity.user_id === user?.id && (
                              <span className="rounded-full border border-muse-500/20 bg-muse-500/10 px-2 py-0.5 text-muse-300">你自己</span>
                            )}
                            {renderExtraBadges(activity)}
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1 self-start rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-medium text-white ${typeMeta.gradient}`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          {typeMeta.label}
                        </span>
                      </div>

                      <div className="mt-4 flex gap-4">
                        {activity.item_cover ? (
                          itemLink ? (
                            <Link to={itemLink} className="flex-shrink-0 w-20 sm:w-24">
                              <img src={activity.item_cover} alt={activity.item_title} className="w-full rounded-xl object-cover border border-white/10 aspect-[2/3]" />
                            </Link>
                          ) : (
                            <img src={activity.item_cover} alt={activity.item_title} className="flex-shrink-0 w-20 sm:w-24 rounded-xl object-cover border border-white/10 aspect-[2/3]" />
                          )
                        ) : null}

                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {activity.item_type === 'movie' && '最近在影视模块的互动会出现在这里。'}
                            {activity.item_type === 'book' && '最近在书籍模块的互动会出现在这里。'}
                            {activity.item_type === 'music' && '最近在音乐模块的互动会出现在这里。'}
                          </p>

                          {itemLink && activity.item_title && (
                            <Link to={itemLink} className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-muse-300 hover:text-muse-200 transition-colors">
                              查看相关内容
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}

            <div ref={sentinelRef} className="h-2" />

            {loadingMore && (
              <div className="flex items-center justify-center py-6 text-sm text-gray-400 gap-2">
                <HiArrowPath className="w-4 h-4 animate-spin" />
                正在加载更多动态...
              </div>
            )}

            {!hasMore && activities.length > 0 && (
              <div className="text-center py-6 text-sm text-gray-500">
                没有更多动态了
              </div>
            )}
          </div>
        ) : (
          <div className="glass rounded-3xl border border-white/10 p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-neon-purple">
              <HiUsers className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">暂时没有动态</h2>
            <p className="text-sm text-gray-400 mt-3 max-w-xl mx-auto leading-relaxed">
              先去关注几个用户，或者使用影视、书籍和音乐模块完成标记、评论、收藏，动态流就会逐渐丰富起来。
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Link to="/recommend" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                去看推荐
              </Link>
              <Link to="/movies" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                去看影视
              </Link>
              <Link to="/books" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                去看书籍
              </Link>
              <Link to="/music" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                去听音乐
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}