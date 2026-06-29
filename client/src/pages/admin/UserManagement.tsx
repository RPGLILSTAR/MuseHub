import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiMagnifyingGlass, HiShieldCheck, HiNoSymbol, HiUser } from 'react-icons/hi2';
import { adminApi } from '@/services/adminApi';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback((p: number, q?: string) => {
    setLoading(true);
    adminApi.getUsers(p, q).then(res => {
      setUsers(res.data);
      setTotalPages(res.totalPages || 1);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(page, search || undefined); }, [page, fetchUsers]);

  const handleSearch = () => { setPage(1); fetchUsers(1, search || undefined); };
  const toggleRole = async (id: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await adminApi.setUserRole(id, newRole);
    toast.success(`已设为${newRole === 'admin' ? '管理员' : '普通用户'}`);
    fetchUsers(page, search || undefined);
  };
  const toggleDisable = async (id: number) => {
    const res = await adminApi.toggleDisableUser(id);
    toast.success(res.data?.disabled ? '已禁用' : '已启用');
    fetchUsers(page, search || undefined);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">用户管理</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="搜索用户名/邮箱..." className="pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 outline-none focus:border-muse-500/50 w-64" />
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
          <button onClick={handleSearch} className="px-4 py-2.5 rounded-xl bg-muse-500 text-white text-sm hover:bg-muse-400">搜索</button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">用户</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">邮箱</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">角色</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">注册时间</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {u.avatar ? <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center text-xs text-white font-bold">{u.username[0]}</div>}
                    <span className="text-sm text-white font-medium">{u.username}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-400">{u.email}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-muse-500/10 text-muse-300 border border-muse-500/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                    {u.role === 'admin' ? '管理员' : '用户'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${u.disabled ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                    {u.disabled ? '已禁用' : '正常'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString('zh-CN')}</td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => toggleRole(u.id, u.role)} title="切换角色" className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-muse-300"><HiShieldCheck className="w-4 h-4" /></button>
                    <button onClick={() => toggleDisable(u.id)} title="启用/禁用" className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400"><HiNoSymbol className="w-4 h-4" /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && <p className="text-center py-12 text-gray-500">暂无数据</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm ${page === i + 1 ? 'bg-muse-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
