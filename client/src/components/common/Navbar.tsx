import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiFilm, HiMusicalNote, HiBookOpen, HiMagnifyingGlass, HiXMark, HiBars3, HiUser, HiArrowRightOnRectangle, HiCog6Tooth, HiShieldCheck, HiSparkles, HiPlay, HiPause, HiArrowPath } from 'react-icons/hi2';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';

const navLinks = [
  { to: '/', label: '首页', icon: null },
  { to: '/movies', label: '影视', icon: HiFilm },
  { to: '/books', label: '书籍', icon: HiBookOpen },
  { to: '/music', label: '音乐', icon: HiMusicalNote },
  { to: '/feed', label: '动态', icon: HiArrowPath },
  { to: '/recommend', label: '推荐', icon: HiSparkles },
];

const myLinks = [
  { to: '/movies/my', label: '我的影视' },
  { to: '/books/my', label: '我的书架' },
  { to: '/music/my', label: '我的音乐' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggedIn, isAdmin } = useAuthStore();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleExpand = usePlayerStore((s) => s.toggleExpand);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); setUserMenuOpen(false); }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const p = location.pathname;
    let target = '/movies';
    if (p.startsWith('/books')) target = '/books';
    else if (p.startsWith('/music')) target = '/music/search';
    if (target === '/music/search') navigate(`${target}?q=${encodeURIComponent(searchQuery.trim())}`);
    else navigate(`${target}?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false); setSearchQuery('');
  };

  const handleLogout = () => { logout(); setUserMenuOpen(false); navigate('/'); };

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass border-b border-white/5' : 'bg-transparent'}`}
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center shadow-neon-purple group-hover:shadow-neon-pink transition-shadow duration-300">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">MuseHub</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
                return (
                  <Link key={link.to} to={link.to} className="relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group">
                    <span className={`relative z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                      {link.icon && <link.icon className="w-4 h-4" />}
                      {link.label}
                    </span>
                    {isActive && <motion.div layoutId="nav-active" className="absolute inset-0 bg-white/10 rounded-xl border border-white/10" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {/* Now Playing mini indicator */}
              <AnimatePresence>
                {currentTrack && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, width: 0 }}
                    animate={{ opacity: 1, scale: 1, width: 'auto' }}
                    exit={{ opacity: 0, scale: 0.8, width: 0 }}
                    className="hidden md:flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all overflow-hidden"
                  >
                    <button
                      onClick={toggleExpand}
                      className="flex items-center gap-2 pl-2 pr-1 py-1.5 min-w-0"
                      title="展开歌词页面"
                    >
                      <div className="relative w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                        <img src={currentTrack.album.picUrl} alt="" className="w-full h-full object-cover" />
                        {isPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="flex items-end gap-[2px] h-3">
                              <span className="w-[2px] bg-muse-400 rounded-full animate-[musicBar1_0.8s_ease-in-out_infinite]" />
                              <span className="w-[2px] bg-muse-400 rounded-full animate-[musicBar2_0.6s_ease-in-out_infinite_0.2s]" />
                              <span className="w-[2px] bg-muse-400 rounded-full animate-[musicBar3_0.7s_ease-in-out_infinite_0.1s]" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 max-w-[100px] lg:max-w-[140px]">
                        <p className="text-[11px] font-medium text-white truncate leading-tight">{currentTrack.name}</p>
                        <p className="text-[9px] text-gray-500 truncate leading-tight">{currentTrack.artists.map(a => a.name).join(' / ')}</p>
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 mr-1"
                      title={isPlaying ? '暂停' : '播放'}
                    >
                      {isPlaying ? <HiPause className="w-4 h-4 text-white" /> : <HiPlay className="w-4 h-4 text-white ml-[1px]" />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={() => setSearchOpen(true)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                <HiMagnifyingGlass className="w-5 h-5 text-gray-300" />
              </button>

              <div className="relative hidden md:block">
                {isLoggedIn() ? (
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                    {user?.avatar ? <img src={user.avatar} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-bold">{user?.username[0]}</div>}
                    <span className="text-sm text-gray-300 max-w-[80px] truncate">{user?.username}</span>
                  </button>
                ) : (
                  <Link to="/login" className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-muse-500 to-pink-500 text-white text-sm font-medium hover:from-muse-400 hover:to-pink-400 transition-all">登录</Link>
                )}

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 z-50 w-48 glass rounded-xl border border-white/10 py-2 shadow-xl">
                        <Link to={`/user/${user?.id}`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5">
                          <HiUser className="w-4 h-4" /> 个人主页
                        </Link>
                        {myLinks.map(l => (
                          <Link key={l.to} to={l.to} onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5">{l.label}</Link>
                        ))}
                        <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5">
                          <HiCog6Tooth className="w-4 h-4" /> 设置
                        </Link>
                        {isAdmin() && (
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-muse-300 hover:text-muse-200 hover:bg-muse-500/10">
                            <HiShieldCheck className="w-4 h-4" /> 管理后台
                          </Link>
                        )}
                        <div className="border-t border-white/5 mt-1 pt-1">
                          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10">
                            <HiArrowRightOnRectangle className="w-4 h-4" /> 退出登录
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all md:hidden">
                <HiBars3 className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 glass border-b border-white/10 md:hidden">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
                return (
                  <Link key={link.to} to={link.to} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                    {link.icon && <link.icon className="w-5 h-5" />} {link.label}
                  </Link>
                );
              })}
              <div className="border-t border-white/5 pt-2 mt-2">
                {isLoggedIn() ? (
                  <>
                    <Link to={`/user/${user?.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5"><HiUser className="w-5 h-5" /> 个人主页</Link>
                    {myLinks.map(l => <Link key={l.to} to={l.to} className="block px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5">{l.label}</Link>)}
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5"><HiCog6Tooth className="w-5 h-5" /> 设置</Link>
                    {isAdmin() && <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muse-300 hover:bg-muse-500/10"><HiShieldCheck className="w-5 h-5" /> 管理后台</Link>}
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10"><HiArrowRightOnRectangle className="w-5 h-5" /> 退出</button>
                  </>
                ) : (
                  <Link to="/login" className="block text-center px-4 py-3 rounded-xl bg-gradient-to-r from-muse-500 to-pink-500 text-white font-medium">登录 / 注册</Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={() => setSearchOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
              <form onSubmit={handleSearch} className="glass rounded-2xl p-2">
                <div className="flex items-center gap-3 px-4">
                  <HiMagnifyingGlass className="w-6 h-6 text-muse-400 flex-shrink-0" />
                  <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="搜索影视、书籍、音乐..." className="flex-1 bg-transparent py-4 text-lg text-white placeholder-gray-500 outline-none" />
                  <button type="button" onClick={() => setSearchOpen(false)} className="p-2 rounded-lg hover:bg-white/10"><HiXMark className="w-5 h-5 text-gray-400" /></button>
                </div>
              </form>
              <p className="text-center text-gray-500 text-sm mt-4">按 Enter 搜索 · ESC 关闭</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
