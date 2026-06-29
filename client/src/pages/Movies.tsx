import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiSparkles, HiFire, HiStar, HiFilm } from 'react-icons/hi2';
import MovieCard from '@/components/movie/MovieCard';
import { MovieCardSkeleton } from '@/components/common/Skeleton';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { movieApi } from '@/services/api';
import type { Movie, PaginatedResponse } from '@/types';

const tabs = [
  { key: 'popular', label: '热门', icon: HiFire },
  { key: 'top_rated', label: '高分', icon: HiStar },
  { key: 'now_playing', label: '正在上映', icon: HiFilm },
  { key: 'trending', label: '趋势', icon: HiSparkles },
] as const;

type TabKey = typeof tabs[number]['key'];

export default function Movies() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<TabKey>('popular');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMovies = useCallback(async (p: number, tab: TabKey, query: string, append = false) => {
    setIsLoading(true);
    try {
      if (query) {
        const result: PaginatedResponse<Movie> = await movieApi.search(query, p);
        setMovies(prev => append ? [...prev, ...result.data] : result.data);
        setHasMore(result.page < result.totalPages);
      } else if (tab === 'trending') {
        const data = await movieApi.getTrending();
        setMovies(data);
        setHasMore(false);
      } else {
        const fetcher = tab === 'popular' ? movieApi.getPopular
          : tab === 'top_rated' ? movieApi.getTopRated
          : movieApi.getNowPlaying;
        const result: PaginatedResponse<Movie> = await fetcher(p);
        setMovies(prev => append ? [...prev, ...result.data] : result.data);
        setHasMore(result.page < result.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    fetchMovies(1, activeTab, searchQuery);
  }, [activeTab, searchQuery, fetchMovies]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(nextPage, activeTab, searchQuery, true);
  }, [page, activeTab, searchQuery, fetchMovies]);

  const { sentinelRef } = useInfiniteScroll({ onLoadMore: loadMore, hasMore, isLoading });

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold">
          {searchQuery ? (
            <>搜索 <span className="gradient-text">"{searchQuery}"</span></>
          ) : (
            <><span className="gradient-text">影视</span> 世界</>
          )}
        </h1>
        <p className="text-gray-400 mt-2">
          {searchQuery ? `找到与 "${searchQuery}" 相关的影视` : '发现精彩影视内容，探索光影之美'}
        </p>
      </motion.div>

      {!searchQuery && (
        <div className="flex items-center gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="movie-tab"
                    className="absolute inset-0 bg-white/10 rounded-xl border border-white/10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="waterfall-grid">
        {movies.map((movie, i) => (
          <MovieCard key={`${movie.id}-${i}`} movie={movie} index={i} />
        ))}

        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="waterfall-item">
              <MovieCardSkeleton />
            </div>
          ))
        }
      </div>

      {!isLoading && movies.length === 0 && (
        <div className="text-center py-24">
          <p className="text-6xl mb-4">🎬</p>
          <p className="text-gray-400 text-lg">暂无影视数据</p>
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
