import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { HiChartBarSquare, HiUsers, HiChatBubbleLeftRight, HiMegaphone, HiArrowLeftOnRectangle, HiHome, HiCpuChip } from 'react-icons/hi2';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';

const navItems = [
  { path: '/admin', icon: HiChartBarSquare, label: '仪表盘' },
  { path: '/admin/users', icon: HiUsers, label: '用户管理' },
  { path: '/admin/reviews', icon: HiChatBubbleLeftRight, label: '内容审核' },
  { path: '/admin/announcements', icon: HiMegaphone, label: '公告管理' },
  { path: '/admin/recommend', icon: HiCpuChip, label: '推荐引擎' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuthStore();
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  useEffect(() => {
    if (!isAdmin()) navigate('/login');
  }, [user]);

  return (
    <div className="min-h-screen bg-dark-950 flex">
      <aside className="w-64 bg-dark-900 border-r border-white/5 flex flex-col fixed h-full z-30">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold gradient-text">MuseHub Admin</h1>
          <p className="text-xs text-gray-500 mt-1">管理后台</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-muse-500/10 text-muse-300 border border-muse-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link to="/" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <HiHome className="w-4 h-4" /> 返回前台
          </Link>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
            <HiArrowLeftOnRectangle className="w-4 h-4" /> 退出登录
          </button>
        </div>
      </aside>
      <main className={`flex-1 ml-64 p-8 min-h-screen ${currentTrack ? 'pb-28' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
