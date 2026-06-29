import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiFilm, HiBookOpen, HiMusicalNote, HiUserPlus, HiUserMinus, HiCog6Tooth, HiUsers, HiArrowPath, HiSparkles } from 'react-icons/hi2';
import { socialApi } from '@/services/socialApi';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const ACTIVITY_TYPE_META: Record<string, { label: string; gradient: string }> = {
  movie: { label: '影视', gradient: 'from-orange-500 to-red-500' },
  book: { label: '书籍', gradient: 'from-cyan-500 to-teal-500' },
  music: { label: '音乐', gradient: 'from-pink-500 to-rose-500' },
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

function getActivityLink(activity: any): string | null {
  if (activity.item_type === 'movie') {
    if (activity.action === 'create_list_movie') return `/movies/list/${activity.item_id}`;
    return `/movies/${activity.item_id}`;
  }
  if (activity.item_type === 'book') {
    if (activity.action === 'create_list') return `/books/list/${activity.item_id}`;
    return `/books/${activity.item_id}`;
  }
  if (activity.item_type === 'music') {
    if (activity.action === 'create_playlist') return `/music/playlist/${activity.item_id}`;
    return `/music/search?q=${encodeURIComponent(activity.item_title || activity.item_id)}`;
  }
  return null;
}

function getActivityTags(activity: any): string[] {
  const tags = activity?.extra?.genres || activity?.extra?.categories || [];
  return Array.isArray(tags) ? tags.slice(0, 3) : [];
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [tab, setTab] = useState<'activities' | 'stats'>('activities');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = useAuthStore(s => s.user);

  const userId = parseInt(id || '0');
  const isSelf = currentUser?.id === userId;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError('');
    Promise.all([
      socialApi.getUserProfile(userId),
      socialApi.getUserActivities(userId),
    ]).then(([p, a]) => {
      setProfile(p);
      setActivities(a.data || []);
    }).catch(() => {
      setError('用户信息加载失败，请稍后重试');
    }).finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    try {
      const res = await socialApi.toggleFollow(userId);
      setProfile((p: any) => ({
        ...p,
        isFollowing: res.following,
        followerCount: p.followerCount + (res.following ? 1 : -1),
      }));
      toast.success(res.following ? '已关注' : '已取消关注');
    } catch {
      toast.error('关注操作失败，请稍后重试');
    }
  };

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-10 h-10 border-2 border-muse-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen pt-24 flex items-center justify-center text-red-300">{error}</div>;
  if (!profile) return <div className="min-h-screen pt-24 flex items-center justify-center text-gray-400">用户不存在</div>;

  const overviewCards = [
    {
      label: '影视标记',
      value: profile.stats.totalMovies,
      detail: `看过 ${profile.stats.movies.done} / 想看 ${profile.stats.movies.wish}`,
      icon: HiFilm,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      label: '书籍标记',
      value: profile.stats.totalBooks,
      detail: `读过 ${profile.stats.books.done} / 想读 ${profile.stats.books.wish}`,
      icon: HiBookOpen,
      gradient: 'from-cyan-500 to-teal-500',
    },
    {
      label: '喜欢音乐',
      value: profile.stats.likedSongs,
      detail: profile.stats.likedSongs > 0 ? '音乐口味已建立' : '开始收藏歌曲吧',
      icon: HiMusicalNote,
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      label: '评论数量',
      value: profile.reviewCount,
      detail: '内容互动与表达',
      icon: HiUsers,
      gradient: 'from-violet-500 to-fuchsia-500',
    },
  ];

  const quickLinks = [
    { label: '动态流', to: '/feed', icon: HiArrowPath },
    { label: '年度报告', to: `/user/${userId}/annual`, icon: HiSparkles },
    { label: '关注者', to: `/user/${userId}/followers`, icon: HiUsers },
    { label: '关注中', to: `/user/${userId}/following`, icon: HiUsers },
  ];

  const actionText: Record<string, string> = {
    mark_wish: '想看', mark_doing: '在看', mark_done: '看过',
    mark_wish_book: '想读', mark_doing_book: '在读', mark_done_book: '读过',
    review: '评论了', like_song: '喜欢了', create_playlist: '创建了歌单', create_list: '创建了书单', create_list_movie: '创建了片单',
  };

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-r from-muse-600/30 via-purple-600/20 to-pink-600/30" />
        <div className="absolute inset-x-1/2 top-8 h-40 w-40 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute inset-0 bg-dark-950/40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
        <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <motion.aside initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="lg:sticky lg:top-24 self-start space-y-6">
            <div className="glass rounded-3xl border border-white/10 p-6 sm:p-7">
              <div className="flex items-start gap-5">
                {profile.avatar ? (
                  <img src={profile.avatar} className="w-24 h-24 rounded-2xl border-4 border-dark-950 object-cover shadow-lg flex-shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-4 border-dark-950 bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg flex-shrink-0">
                    {profile.username[0]}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-white truncate">{profile.username}</h1>
                    {profile.role === 'admin' && <span className="text-[11px] px-2.5 py-1 rounded-full bg-muse-500/20 text-muse-300 border border-muse-500/30">管理员</span>}
                    {isSelf && <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-gray-300 border border-white/10">我的主页</span>}
                  </div>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">{profile.bio || '这个人很懒，什么都没写'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6 text-sm text-gray-400">
                <Link to={`/user/${userId}/followers`} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center hover:border-white/20 hover:bg-white/10 transition-all">
                  <strong className="block text-lg text-white leading-none">{profile.followerCount}</strong>
                  <span className="mt-1 block text-xs">关注者</span>
                </Link>
                <Link to={`/user/${userId}/following`} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center hover:border-white/20 hover:bg-white/10 transition-all">
                  <strong className="block text-lg text-white leading-none">{profile.followingCount}</strong>
                  <span className="mt-1 block text-xs">关注中</span>
                </Link>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center">
                  <strong className="block text-lg text-white leading-none">{profile.reviewCount}</strong>
                  <span className="mt-1 block text-xs">评论</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link to={`/user/${userId}/annual`} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-all">
                  <HiSparkles className="w-4 h-4" /> 年度报告
                </Link>
                <Link to="/feed" className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-all">
                  <HiArrowPath className="w-4 h-4" /> 动态流
                </Link>
                {isSelf ? (
                  <Link to="/settings" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-muse-500 to-pink-500 text-sm text-white font-medium hover:from-muse-400 hover:to-pink-400 transition-all">
                    <HiCog6Tooth className="w-4 h-4" /> 编辑资料
                  </Link>
                ) : currentUser ? (
                  <button onClick={handleFollow}
                    className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${profile.isFollowing ? 'bg-white/10 border border-white/10 text-gray-300 hover:text-red-400 hover:border-red-500/30' : 'bg-muse-500 text-white hover:bg-muse-400'}`}>
                    {profile.isFollowing ? <><HiUserMinus className="w-4 h-4" /> 已关注</> : <><HiUserPlus className="w-4 h-4" /> 关注</>}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="glass rounded-3xl border border-white/10 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-gray-500">答辩展示重点</p>
              <div className="mt-4 space-y-3">
                {[
                  '动态流、关注关系和年度报告都可直接跳转。',
                  '影视、书籍、音乐和评论数据在一个页面统一呈现。',
                  '收藏、关注与活动记录已经和后端数据联动。',
                ].map((item, index) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${index === 0 ? 'from-muse-500 to-pink-500' : index === 1 ? 'from-cyan-500 to-teal-500' : 'from-orange-500 to-red-500'}`}>
                      <HiSparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <p className="text-sm leading-relaxed text-gray-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>

          <main className="space-y-6 min-w-0">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl border border-white/10 p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-gray-500">个人数据看板</p>
                  <h2 className="text-lg font-semibold text-white mt-2">{isSelf ? '这是你的答辩展示主页' : `${profile.username} 的个人主页`}</h2>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <HiArrowPath className="h-3.5 w-3.5" />
                  <span>动态与统计同步展示</span>
                </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {overviewCards.map((card) => (
                  <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">{card.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                      </div>
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                        <card.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 leading-relaxed">{card.detail}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
                {quickLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                    <span className="flex items-center gap-2">
                      <link.icon className="w-4 h-4" /> {link.label}
                    </span>
                    <span className="text-xs text-gray-500">进入</span>
                  </Link>
                ))}
              </div>
            </motion.section>

            <div className="flex gap-2">
              <button onClick={() => setTab('activities')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'activities' ? 'bg-muse-500/10 text-muse-300 border border-muse-500/20' : 'bg-white/5 text-gray-400 border border-white/5'}`}>动态</button>
              <button onClick={() => setTab('stats')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'stats' ? 'bg-muse-500/10 text-muse-300 border border-muse-500/20' : 'bg-white/5 text-gray-400 border border-white/5'}`}>统计</button>
            </div>

            {tab === 'activities' && (
              <div className="space-y-3">
                {activities.map((a, i) => {
                  const link = getActivityLink(a);
                  const typeMeta = ACTIVITY_TYPE_META[a.item_type] || { label: '内容', gradient: 'from-gray-500 to-slate-600' };
                  const tags = getActivityTags(a);

                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="glass rounded-2xl p-4 border border-white/5 flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-muse-500 flex-shrink-0 mt-2" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-300 leading-relaxed">
                              <span className="text-white font-medium">{a.username}</span>
                              {' '}{actionText[a.action] || a.action}{' '}
                              {a.item_title && <span className="text-muse-300">{a.item_title}</span>}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                              <span>{formatRelativeTime(a.created_at)}</span>
                              {a.extra?.rating != null && (
                                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                                  评分 {a.extra.rating}
                                </span>
                              )}
                              {tags.map((tag: string) => (
                                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-gray-300">{tag}</span>
                              ))}
                            </div>
                          </div>

                          <span className={`inline-flex items-center gap-1 self-start rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-medium text-white ${typeMeta.gradient}`}>
                            {typeMeta.label}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center gap-4">
                          {a.item_cover && link ? (
                            <Link to={link} className="flex-shrink-0">
                              <img src={a.item_cover} className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                            </Link>
                          ) : a.item_cover ? (
                            <img src={a.item_cover} className="w-14 h-14 rounded-xl object-cover border border-white/10 flex-shrink-0" />
                          ) : null}

                          {link && a.item_title ? (
                            <Link to={link} className="text-xs text-muse-300 hover:text-muse-200 transition-colors">
                              查看相关内容
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {activities.length === 0 && <p className="text-center py-12 text-gray-500">暂无动态</p>}
              </div>
            )}

            {tab === 'stats' && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="glass rounded-2xl p-4 border border-white/5">
                    <p className="text-xs text-gray-500">影视完成率</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {profile.stats.totalMovies ? Math.round((profile.stats.movies.done / profile.stats.totalMovies) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">看过 {profile.stats.movies.done} / 总计 {profile.stats.totalMovies}</p>
                  </div>
                  <div className="glass rounded-2xl p-4 border border-white/5">
                    <p className="text-xs text-gray-500">书籍完成率</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {profile.stats.totalBooks ? Math.round((profile.stats.books.done / profile.stats.totalBooks) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">读过 {profile.stats.books.done} / 总计 {profile.stats.totalBooks}</p>
                  </div>
                  <div className="glass rounded-2xl p-4 border border-white/5">
                    <p className="text-xs text-gray-500">音乐活跃指数</p>
                    <p className="text-2xl font-bold text-white mt-1">{profile.stats.likedSongs}</p>
                    <p className="text-xs text-gray-400 mt-1">喜欢歌曲总数</p>
                  </div>
                </div>

                <div className="glass rounded-2xl p-5 border border-white/5">
                  <h3 className="text-sm font-semibold text-white mb-3">影视状态分布</h3>
                  {([
                    { label: '想看', value: profile.stats.movies.wish, color: 'bg-blue-400' },
                    { label: '在看', value: profile.stats.movies.doing, color: 'bg-amber-400' },
                    { label: '看过', value: profile.stats.movies.done, color: 'bg-emerald-400' },
                  ]).map((row) => {
                    const total = profile.stats.totalMovies || 1;
                    const percent = Math.round((row.value / total) * 100);
                    return (
                      <div key={row.label} className="mb-2.5 last:mb-0">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>{row.label}</span>
                          <span>{row.value} ({percent}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full ${row.color}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="glass rounded-2xl p-5 border border-white/5">
                  <h3 className="text-sm font-semibold text-white mb-3">书籍状态分布</h3>
                  {([
                    { label: '想读', value: profile.stats.books.wish, color: 'bg-cyan-400' },
                    { label: '在读', value: profile.stats.books.doing, color: 'bg-orange-400' },
                    { label: '读过', value: profile.stats.books.done, color: 'bg-green-400' },
                  ]).map((row) => {
                    const total = profile.stats.totalBooks || 1;
                    const percent = Math.round((row.value / total) * 100);
                    return (
                      <div key={row.label} className="mb-2.5 last:mb-0">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>{row.label}</span>
                          <span>{row.value} ({percent}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full ${row.color}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="glass rounded-2xl p-6 border border-white/5 text-center">
                  <p className="text-sm text-gray-400">查看月度趋势和年度总结</p>
                  <Link to={`/user/${userId}/annual`} className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-muse-500 to-pink-500 text-white text-sm font-medium hover:from-muse-400 hover:to-pink-400">
                    查看年度报告
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
