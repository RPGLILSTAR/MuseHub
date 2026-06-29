import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiBookOpen } from 'react-icons/hi2';
import BookCard from '@/components/book/BookCard';
import { BookCardSkeleton } from '@/components/common/Skeleton';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { bookApi } from '@/services/api';
import type { Book } from '@/types';

const categories = [
  { key: 'fiction', label: '小说' },
  { key: 'science', label: '科学' },
  { key: 'history', label: '历史' },
  { key: 'philosophy', label: '哲学' },
  { key: 'art', label: '艺术' },
  { key: 'technology', label: '科技' },
  { key: 'biography', label: '传记' },
  { key: 'poetry', label: '诗歌' },
];

export default function Books() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [activeCategory, setActiveCategory] = useState('fiction');
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBooks = useCallback(async (p: number, category: string, query: string, append = false) => {
    setIsLoading(true);
    try {
      const result = query
        ? await bookApi.search(query, p)
        : await bookApi.getByCategory(category, p);

      const items = Array.isArray(result) ? result : (result as any)?.data || [];
      const totalPages = (result as any)?.totalPages || 1;
      const currentPage = (result as any)?.page || p;

      if (!Array.isArray(items)) { setIsLoading(false); return; }

      setBooks(prev => append ? [...prev, ...items] : items);
      setHasMore(currentPage < totalPages);
    } catch (err) {
      console.error('[Books] Fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setBooks([]);
    setPage(1);
    setHasMore(true);
    fetchBooks(1, activeCategory, searchQuery);
  }, [activeCategory, searchQuery, fetchBooks]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBooks(nextPage, activeCategory, searchQuery, true);
  }, [page, activeCategory, searchQuery, fetchBooks]);

  const { sentinelRef } = useInfiniteScroll({ onLoadMore: loadMore, hasMore, isLoading });

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <HiBookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            {searchQuery ? (
              <>搜索 <span className="gradient-text">"{searchQuery}"</span></>
            ) : (
              <><span className="gradient-text">书籍</span> 海洋</>
            )}
          </h1>
        </div>
        <p className="text-gray-400 mt-2 ml-[52px]">
          {searchQuery ? `找到与 "${searchQuery}" 相关的书籍` : '徜徉书海，与思想共舞'}
        </p>
      </motion.div>

      {!searchQuery && (
        <div className="flex items-center gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                {cat.label}
                {isActive && (
                  <motion.div layoutId="book-tab" className="absolute inset-0 bg-white/10 rounded-xl border border-white/10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="waterfall-grid">
        {books.map((book, i) => (
          <BookCard key={`${book.id}-${i}`} book={book} index={i} />
        ))}
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="waterfall-item"><BookCardSkeleton /></div>
        ))}
      </div>

      {!isLoading && books.length === 0 && (
        <div className="text-center py-24">
          <p className="text-6xl mb-4">📚</p>
          <p className="text-gray-400 text-lg">暂无书籍数据</p>
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
