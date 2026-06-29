import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiUserPlus, HiUserMinus, HiUsers } from 'react-icons/hi2';
import { socialApi } from '@/services/socialApi';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

type ViewMode = 'followers' | 'following';

interface SocialUser {
  id: number;
  username: string;
  avatar: string | null;
  bio: string;
  isFollowing?: boolean;
}

export default function SocialConnections({ view }: { view: ViewMode }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => !!s.token);

  const userId = parseInt(id || '0');
  const isSelf = currentUser?.id === userId;

  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const title = view === 'followers' ? '关注者' : '关注中';
  const desc = view === 'followers' ? '正在关注这个用户的人' : '这个用户正在关注的人';

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const [p, list] = await Promise.all([
        socialApi.getUserProfile(userId),
        view === 'followers' ? socialApi.getFollowers(userId) : socialApi.getFollowing(userId),
      ]);
      setProfile(p);
      setUsers(list || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('登录已过期，请重新登录');
      } else if (err.response?.status === 404) {
        setError('用户不存在');
      } else {
        setError('社交关系加载失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, view]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs = useMemo(() => ([
    { key: 'followers' as const, label: '关注者', to: `/user/${userId}/followers` },
    { key: 'following' as const, label: '关注中', to: `/user/${userId}/following` },
  ]), [userId]);

  const handleToggleFollow = async (targetId: number) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (targetId === currentUser?.id) return;

    const previous = users;
    const target = users.find((u) => u.id === targetId);
    if (!target) return;

    setActionLoading(targetId);
    setUsers((prev) => prev.map((u) => (u.id === targetId ? { ...u, isFollowing: !u.isFollowing } : u)));

    try {
      const result = await socialApi.toggleFollow(targetId);
      setUsers((prev) => prev.map((u) => (u.id === targetId ? { ...u, isFollowing: result.following } : u)));
      toast.success(result.following ? '已关注' : '已取消关注');
    } catch {
      setUsers(previous);
      toast.error('关注操作失败，请稍后重试');
    } finally {
      setActionLoading(null);
    }
  };

  if (!userId) {
    return <div className="min-h-screen pt-24 flex items-center justify-center text-gray-400">参数错误</div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/user/${userId}`)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <HiArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">社交关系</p>
            <h1 className="text-2xl font-bold text-white">{profile?.username || '用户'} 的 {title}</h1>
          </div>
        </div>

        <div className="glass rounded-3xl border border-white/10 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white border border-white/10">
                  {profile?.username?.[0] || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white truncate">{profile?.username || '加载中'}</h2>
                <p className="text-sm text-gray-400 mt-1">{desc}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={`/user/${userId}/followers`} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === 'followers' ? 'bg-muse-500/10 border border-muse-500/20 text-muse-300' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                关注者
              </Link>
              <Link to={`/user/${userId}/following`} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === 'following' ? 'bg-muse-500/10 border border-muse-500/20 text-muse-300' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                关注中
              </Link>
            </div>
          </div>

          {profile && (
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <p className="text-xs text-gray-500">关注者</p>
                <p className="text-2xl font-bold text-white mt-1">{profile.followerCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <p className="text-xs text-gray-500">关注中</p>
                <p className="text-2xl font-bold text-white mt-1">{profile.followingCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <p className="text-xs text-gray-500">动态</p>
                <p className="text-2xl font-bold text-white mt-1">{profile.reviewCount}</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl border border-white/10 p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-white/10" />
                    <div className="h-3 w-2/3 rounded bg-white/10" />
                  </div>
                  <div className="h-9 w-24 rounded-xl bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length > 0 ? (
          <div className="grid gap-3">
            {users.map((u, idx) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.18) }}
                className="glass rounded-2xl border border-white/10 p-4"
              >
                <div className="flex items-center gap-4">
                  <Link to={`/user/${u.id}`} className="flex-shrink-0">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.username} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center text-white font-bold border border-white/10">
                        {u.username?.[0] || 'U'}
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link to={`/user/${u.id}`} className="text-white font-semibold hover:text-muse-300 transition-colors truncate">
                        {u.username}
                      </Link>
                      {u.id === currentUser?.id && (
                        <span className="rounded-full border border-muse-500/20 bg-muse-500/10 px-2 py-0.5 text-[11px] text-muse-300">你</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{u.bio || '这个人很懒，什么都没写'}</p>
                  </div>

                  {currentUser && u.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(u.id)}
                      disabled={actionLoading === u.id}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${u.isFollowing ? 'bg-white/10 border border-white/10 text-gray-300 hover:text-red-400 hover:border-red-500/30' : 'bg-muse-500 text-white hover:bg-muse-400'}`}
                    >
                      {u.isFollowing ? <HiUserMinus className="w-4 h-4" /> : <HiUserPlus className="w-4 h-4" />}
                      {actionLoading === u.id ? '处理中...' : u.isFollowing ? '已关注' : '关注'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl border border-white/10 p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-neon-purple">
              <HiUsers className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">暂无{title}</h2>
            <p className="text-sm text-gray-400 mt-3 max-w-xl mx-auto leading-relaxed">
              {isSelf ? '你还没有建立足够的社交关系。可以先去关注几个用户，系统会自动帮你形成动态流。' : '这个用户暂时还没有对应的社交关系。'}
            </p>
            {isSelf && (
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Link to="/feed" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                  看动态流
                </Link>
                <Link to="/recommend" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                  去找推荐
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}