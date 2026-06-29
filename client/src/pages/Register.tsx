import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMusicalNote, HiBookOpen, HiFilm, HiEye, HiEyeSlash } from 'react-icons/hi2';
import { authApi } from '@/services/authApi';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) return;
    if (password !== confirm) { toast.error('两次密码不一致'); return; }
    if (password.length < 6) { toast.error('密码至少6位'); return; }
    setLoading(true);
    try {
      const res = await authApi.register(username.trim(), email.trim(), password);
      setAuth(res.data.token, res.data.user);
      toast.success('注册成功！');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '注册失败');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-muse-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HiFilm className="w-6 h-6 text-muse-400" />
            <HiBookOpen className="w-6 h-6 text-cyan-400" />
            <HiMusicalNote className="w-6 h-6 text-pink-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">注册 <span className="gradient-text">MuseHub</span></h1>
          <p className="text-gray-400 mt-2">创建账号，开始你的文化之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl border border-white/10 p-8 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">用户名</label>
            <input value={username} onChange={e => setUsername(e.target.value)} type="text" autoFocus
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50 transition-colors" placeholder="取一个好听的名字" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">邮箱</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50 transition-colors" placeholder="your@email.com" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">密码</label>
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPwd ? 'text' : 'password'}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50 transition-colors" placeholder="至少6位" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPwd ? <HiEyeSlash className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">确认密码</label>
            <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50 transition-colors" placeholder="再输入一次密码" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-muse-500 to-cyan-500 text-white font-semibold hover:from-muse-400 hover:to-cyan-400 transition-all disabled:opacity-50">
            {loading ? '注册中...' : '注 册'}
          </button>
          <p className="text-center text-sm text-gray-400">
            已有账号？<Link to="/login" className="text-muse-400 hover:text-muse-300 transition-colors">立即登录</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
