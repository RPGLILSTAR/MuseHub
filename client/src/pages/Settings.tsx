import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiCamera, HiKey } from 'react-icons/hi2';
import { authApi } from '@/services/authApi';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authApi.updateProfile({ username: username.trim(), email: email.trim(), bio });
      updateUser(res.data);
      toast.success('资料已更新');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '更新失败');
    } finally { setSaving(false); }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await authApi.uploadAvatar(file);
      updateUser({ avatar: res.data.avatar });
      toast.success('头像已更新');
    } catch { toast.error('上传失败'); }
  };

  const handlePassword = async () => {
    if (!oldPwd || !newPwd) return;
    try {
      await authApi.changePassword(oldPwd, newPwd);
      toast.success('密码已修改');
      setOldPwd(''); setNewPwd('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '修改失败');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-20 max-w-2xl mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-8">个人设置</h1>

        <div className="glass rounded-2xl p-6 border border-white/5 mb-6">
          <h2 className="text-base font-semibold text-white mb-5">基本信息</h2>
          <div className="flex items-center gap-6 mb-6">
            <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
              {user.avatar ? (
                <img src={user.avatar} className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">{user.username[0]}</div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <HiCamera className="w-6 h-6 text-white" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </div>
            <div className="text-sm text-gray-400">点击修改头像<br /><span className="text-xs text-gray-600">支持 jpg/png/gif，最大 5MB</span></div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">用户名</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-muse-500/50" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">邮箱</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-muse-500/50" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">个人简介</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-muse-500/50 resize-none" placeholder="介绍一下自己..." />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="mt-5 px-6 py-2.5 rounded-xl bg-muse-500 text-white text-sm font-medium hover:bg-muse-400 disabled:opacity-50">
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2"><HiKey className="w-5 h-5 text-muse-400" /> 修改密码</h2>
          <div className="space-y-4">
            <input value={oldPwd} onChange={e => setOldPwd(e.target.value)} type="password" placeholder="当前密码"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50" />
            <input value={newPwd} onChange={e => setNewPwd(e.target.value)} type="password" placeholder="新密码（至少6位）"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-muse-500/50" />
          </div>
          <button onClick={handlePassword}
            className="mt-5 px-6 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/20">
            修改密码
          </button>
        </div>
      </motion.div>
    </div>
  );
}
