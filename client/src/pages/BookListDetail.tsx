import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiBookOpen, HiXMark } from 'react-icons/hi2';
import { collectionApi, type UserList } from '@/services/collectionApi';
import { bookApi } from '@/services/api';
import type { Book } from '@/types';

export default function BookListDetail() {
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<UserList | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchListDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const listData = await collectionApi.getListDetail(id);
        setList(listData);
        
        if (listData.items && listData.items.length > 0) {
          const booksData = await Promise.all(
            listData.items.map(itemId => bookApi.getDetail(itemId).catch(() => null))
          );
          setBooks(booksData.filter(Boolean) as Book[]);
        }
      } catch (err) {
        console.error('Failed to load list:', err);
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchListDetail();
  }, [id]);

  const handleRemoveBook = async (bookId: string) => {
    if (!id) return;
    try {
      await collectionApi.removeFromList(id, bookId);
      setBooks(prev => prev.filter(b => b.id !== bookId));
      if (list) {
        setList({
          ...list,
          items: list.items.filter(itemId => itemId !== bookId)
        });
      }
    } catch (err) {
      console.error('Failed to remove book:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="h-20 bg-white/5 rounded-xl animate-pulse-soft mb-4" />
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse-soft" />)}</div>
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-6xl">📚</p>
        <p className="text-gray-400 text-lg">{error || '书单未找到'}</p>
        <Link to="/my-books" className="px-5 py-2.5 rounded-xl bg-cyan-500 text-white text-sm hover:bg-cyan-400 transition-colors">返回我的书架</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
      <Link to="/my-books" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm text-white hover:bg-white/20 transition-colors mb-6">
        <HiArrowLeft className="w-4 h-4" /> 返回
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <HiBookOpen className="w-6 h-6 text-cyan-400" />
          <h1 className="text-3xl font-bold text-white">{list.name}</h1>
        </div>
        {list.description && <p className="text-gray-400 text-sm ml-10">{list.description}</p>}
        <p className="text-xs text-gray-500 ml-10 mt-2">{books.length} 本 · 更新于 {new Date(list.updatedAt).toLocaleDateString('zh-CN')}</p>
      </motion.div>

      {books.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-gray-400">书单中暂无书籍</p>
        </div>
      ) : (
        <div className="space-y-3">
          {books.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 flex items-center gap-4 group hover:bg-white/5 transition-all"
            >
              {book.thumbnail && (
                <img src={book.thumbnail} alt={book.title} className="w-12 h-16 rounded-lg object-cover border border-white/10" />
              )}
              <div className="flex-1 min-w-0">
                <Link to={`/books/${book.id}`} className="text-white font-medium hover:text-cyan-300 transition-colors line-clamp-2">
                  {book.title}
                </Link>
                <p className="text-xs text-gray-500 mt-1 truncate">{book.authors?.join(' / ')}</p>
              </div>
              <button
                onClick={() => handleRemoveBook(book.id)}
                className="p-2 rounded-lg text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <HiXMark className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
