import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMusicalNote, HiBookOpen, HiFilm, HiEye, HiEyeSlash } from 'react-icons/hi2';
import { authApi } from '@/services/authApi';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.trim() || !password) return;
    setLoading(true);
    try {
      const res = await authApi.login(account.trim(), password);
      setAuth(res.data.token, res.data.user);
      toast.success(`欢迎回来，${res.data.user.username}！`);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '登录失败');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-muse-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex gap-1.5">
              <HiFilm className="w-6 h-6 text-muse-400" />
              <HiBookOpen className="w-6 h-6 text-cyan-400" />
              <HiMusicalNote className="w-6 h-6 text-pink-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">登录 <span className="gradient-text">MuseHub</span></h1>
          <p className="text-gray-400 mt-2">影 · 书 · 乐 全维度娱乐平台</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl border border-white/10 p-8 space-y-5">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">用户名 / 邮箱</label>
            <input value={account} onChange={e => setAccount(e.target.value)} type="text" autoFocus
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50 transition-colors" placeholder="请输入用户名或邮箱" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">密码</label>
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPwd ? 'text' : 'password'}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50 transition-colors" placeholder="请输入密码" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPwd ? <HiEyeSlash className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-muse-500 to-pink-500 text-white font-semibold hover:from-muse-400 hover:to-pink-400 transition-all disabled:opacity-50">
            {loading ? '登录中...' : '登 录'}
          </button>
          <p className="text-center text-sm text-gray-400">
            还没有账号？<Link to="/register" className="text-muse-400 hover:text-muse-300 transition-colors">立即注册</Link>
          </p>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">管理员账号：admin / admin123</p>
      </motion.div>
    </div>
  );
}
