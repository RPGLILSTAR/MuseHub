import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiFilm, HiBookOpen, HiMusicalNote, HiArrowRight, HiStar, HiSparkles } from 'react-icons/hi2';
import { movieApi, bookApi } from '@/services/api';
import { musicFullApi } from '@/services/musicApi';
import { recommendApi, type RecommendItem } from '@/services/recommendApi';
import { useAuthStore } from '@/store/authStore';
import type { Movie, Book, Playlist } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newSongs, setNewSongs] = useState<any[]>([]);
  const [recMovies, setRecMovies] = useState<(RecommendItem & { title?: string; cover?: string })[]>([]);
  const [recBooks, setRecBooks] = useState<(RecommendItem & { title?: string; cover?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const errs: string[] = [];
      console.log('[Home] Starting data fetch...');

      const results = await Promise.allSettled([
        movieApi.getTrending('week'),
        movieApi.getTopRated(1),
        bookApi.getPopular(1, 'fiction'),
        musicFullApi.getTopPlaylists(18),
        musicFullApi.getNewSongs(),
      ]);

      results.forEach((r, i) => {
        const names = ['trendingMovies', 'topRatedMovies', 'books', 'playlists', 'newSongs'];
        if (r.status === 'rejected') {
          console.error(`[Home] ${names[i]} FAILED:`, r.reason);
          errs.push(`${names[i]}: ${r.reason?.message || 'unknown error'}`);
        } else {
          console.log(`[Home] ${names[i]} OK:`, Array.isArray(r.value) ? r.value.length : r.value);
        }
      });

      if (results[0].status === 'fulfilled') {
        const data = results[0].value as Movie[];
        setTrendingMovies(data.slice(0, 10));
      }
      if (results[1].status === 'fulfilled') {
        const data = results[1].value as any;
        setTopRatedMovies((data.data || data).slice(0, 10));
      }
      if (results[2].status === 'fulfilled') {
        const data = results[2].value as any;
        setBooks((data.data || data).slice(0, 9));
      }
      if (results[3].status === 'fulfilled') {
        setPlaylists((results[3].value as Playlist[]).slice(0, 12));
      }
      if (results[4].status === 'fulfilled') {
        setNewSongs((results[4].value as any[]).slice(0, 6));
      }

      setErrors(errs);
      setLoading(false);
      console.log('[Home] Fetch complete. Errors:', errs.length);

      if (isLoggedIn()) {
        try {
          const movieRecs = await recommendApi.getMovies(6);
          setRecMovies(movieRecs.slice(0, 6));
        } catch {}
        try {
          const bookRecs = await recommendApi.getBooks(6);
          setRecBooks(bookRecs.slice(0, 6));
        } catch {}
      }
    }
    fetchAll();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-muse-600/20 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center mx-auto mb-8 shadow-neon-purple"
          >
            <HiSparkles className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold leading-tight">
            <span className="gradient-text">Muse</span>
            <span className="text-white">Hub</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 mt-6 max-w-2xl mx-auto leading-relaxed">
            影视 · 书籍 · 音乐
            <br />
            <span className="text-gray-400">多维泛娱乐推荐平台，探索你的灵感缪斯</span>
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 mt-10"
          >
            {[
              { to: '/movies', label: '探索影视', icon: HiFilm, color: 'from-violet-500 to-purple-600' },
              { to: '/books', label: '浏览书籍', icon: HiBookOpen, color: 'from-cyan-500 to-blue-600' },
              { to: '/music', label: '聆听音乐', icon: HiMusicalNote, color: 'from-pink-500 to-rose-600' },
            ].map((btn) => (
              <Link
                key={btn.to}
                to={btn.to}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r ${btn.color} text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300`}
              >
                <btn.icon className="w-5 h-5" />
                {btn.label}
              </Link>
            ))}
          </motion.div>
        </motion.div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
          >
            <div className="w-1.5 h-3 rounded-full bg-white/40" />
          </motion.div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">系统能力概览</h2>
            <p className="text-sm text-gray-500 mt-1">答辩可直接展示：多源数据聚合、推荐算法、AI 助手、后台运营</p>
          </div>
          <Link to="/recommend" className="text-sm text-muse-400 hover:text-muse-300 transition-colors">
            查看推荐系统
          </Link>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            {
              title: '多源内容聚合',
              desc: 'TMDB + OpenLibrary + NeteaseCloudMusicApi 统一接入',
              badge: 'Data',
            },
            {
              title: '混合推荐引擎',
              desc: 'UserCF / ItemCF / 内容过滤 + 跨模块联动',
              badge: 'Recommend',
            },
            {
              title: 'AI 娱乐助手',
              desc: '基于用户画像生成影视、书籍、音乐建议',
              badge: 'AI',
            },
            {
              title: '管理后台',
              desc: '运营数据、审核、公告、推荐评估与权重调优',
              badge: 'Admin',
            },
          ].map((card) => (
            <div key={card.title} className="glass rounded-2xl border border-white/10 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muse-300">{card.badge}</p>
              <h3 className="text-white font-semibold mt-2">{card.title}</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 猜你喜欢 - 协同过滤推荐 */}
      {isLoggedIn() && (recMovies.length > 0 || recBooks.length > 0) && (
        <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center shadow-neon-purple">
                <HiSparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">猜你喜欢</h2>
                <p className="text-sm text-gray-500">基于协同过滤算法的个性化推荐</p>
              </div>
            </div>
            <Link to="/recommend" className="flex items-center gap-1 text-sm text-muse-400 hover:text-muse-300 transition-colors group">
              更多推荐 <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {recMovies.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2"><HiFilm className="w-4 h-4" /> 影视推荐</h3>
              <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {recMovies.map((rec) => (
                  <motion.div key={rec.itemId} variants={item}>
                    <Link to={`/movies/${rec.itemId}`} className="block group">
                      <div className="glass-card overflow-hidden">
                        <div className="relative overflow-hidden">
                          {rec.cover ? (
                            <img src={rec.cover} alt={rec.title} className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                          ) : (
                            <div className="w-full aspect-[2/3] bg-dark-800 flex items-center justify-center text-3xl">🎬</div>
                          )}
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-muse-500/80 backdrop-blur-sm text-[10px] text-white font-medium">AI推荐</div>
                        </div>
                        <div className="p-2.5">
                          <h4 className="text-xs font-medium text-white truncate group-hover:text-muse-300 transition-colors">{rec.title || rec.itemId}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 truncate">{rec.reasons?.[0]}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {recBooks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2"><HiBookOpen className="w-4 h-4" /> 书籍推荐</h3>
              <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recBooks.map((rec) => (
                  <motion.div key={rec.itemId} variants={item}>
                    <Link to={`/books/${rec.itemId}`} className="block group">
                      <div className="glass-card p-4 flex gap-4 h-full">
                        <div className="flex-shrink-0 w-16 relative">
                          {rec.cover ? (
                            <img src={rec.cover} alt={rec.title} className="w-full rounded-lg shadow-lg" loading="lazy" />
                          ) : (
                            <div className="w-full aspect-[2/3] rounded-lg bg-dark-800 flex items-center justify-center text-xl">📖</div>
                          )}
                          <div className="absolute -top-1 -left-1 px-1 py-0.5 rounded bg-muse-500/80 text-[9px] text-white font-medium">AI</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate group-hover:text-muse-300 transition-colors">{rec.title || rec.itemId}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rec.reasons?.[0]}</p>
                          <div className="text-[10px] text-muse-400 mt-2">推荐分: {rec.score.toFixed(2)}</div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </section>
      )}

      {/* Debug Errors (dev only) */}
      {errors.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
            <p className="font-semibold mb-1">API 加载错误 (F12 查看详情):</p>
            {errors.map((e, i) => <p key={i}>· {e}</p>)}
          </div>
        </div>
      )}

      {/* Trending Movies */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <HiFilm className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">本周趋势影视</h2>
              <p className="text-sm text-gray-500">全球热门影片，精彩不容错过</p>
            </div>
          </div>
          <Link to="/movies" className="flex items-center gap-1 text-sm text-muse-400 hover:text-muse-300 transition-colors group">
            查看更多 <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse-soft" />
            ))}
          </div>
        ) : trendingMovies.length > 0 ? (
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {trendingMovies.map((movie) => (
              <motion.div key={movie.id} variants={item}>
                <Link to={`/movies/${movie.id}`} className="block group">
                  <div className="glass-card overflow-hidden">
                    <div className="relative overflow-hidden">
                      {movie.posterPath ? (
                        <img src={movie.posterPath} alt={movie.title}
                          className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-dark-800 flex items-center justify-center text-4xl">🎬</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs">
                        <HiStar className="w-3 h-3 text-yellow-400" />
                        <span className="text-white font-medium">{movie.voteAverage.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-white truncate group-hover:text-muse-300 transition-colors">{movie.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{movie.releaseDate?.slice(0, 4)}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 glass rounded-2xl">
            <p className="text-4xl mb-3">🎬</p>
            <p className="text-gray-400">影视数据加载中，请确认后端服务已启动</p>
          </div>
        )}
      </section>

      {/* Top Rated Movies */}
      {topRatedMovies.length > 0 && (
        <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                <HiStar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">高分佳作</h2>
                <p className="text-sm text-gray-500">经典之作，口碑之选</p>
              </div>
            </div>
            <Link to="/movies" className="flex items-center gap-1 text-sm text-muse-400 hover:text-muse-300 transition-colors group">
              查看更多 <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {topRatedMovies.map((movie) => (
              <motion.div key={movie.id} variants={item}>
                <Link to={`/movies/${movie.id}`} className="block group">
                  <div className="glass-card overflow-hidden">
                    <div className="relative overflow-hidden">
                      {movie.posterPath ? (
                        <img src={movie.posterPath} alt={movie.title}
                          className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-dark-800 flex items-center justify-center text-4xl">🎬</div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs">
                        <HiStar className="w-3 h-3 text-yellow-400" />
                        <span className="text-white font-medium">{movie.voteAverage.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-white truncate group-hover:text-muse-300 transition-colors">{movie.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{movie.releaseDate?.slice(0, 4)}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Books */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <HiBookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">好书推荐</h2>
              <p className="text-sm text-gray-500">精选书籍，开启思想之旅</p>
            </div>
          </div>
          <Link to="/books" className="flex items-center gap-1 text-sm text-muse-400 hover:text-muse-300 transition-colors group">
            查看更多 <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse-soft" />
            ))}
          </div>
        ) : books.length > 0 ? (
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {books.map((book) => (
              <motion.div key={book.id} variants={item}>
                <Link to={`/books/${book.id}`} className="block group">
                  <div className="glass-card p-5 flex gap-5 h-full">
                    <div className="flex-shrink-0 w-20">
                      {book.thumbnail ? (
                        <img src={book.thumbnail} alt={book.title} className="w-full rounded-lg shadow-lg group-hover:shadow-neon-purple transition-shadow" loading="lazy" />
                      ) : (
                        <div className="w-full aspect-[2/3] rounded-lg bg-dark-800 flex items-center justify-center text-2xl">📖</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-muse-300 transition-colors">{book.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">{book.authors?.join(', ')}</p>
                      {book.averageRating && (
                        <div className="flex items-center gap-1 mt-2">
                          <HiStar className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-white">{book.averageRating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 glass rounded-2xl">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-gray-400">书籍数据加载中...</p>
          </div>
        )}
      </section>

      {/* Playlists */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <HiMusicalNote className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">热门歌单</h2>
              <p className="text-sm text-gray-500">精选歌单，聆听好音乐</p>
            </div>
          </div>
          <Link to="/music" className="flex items-center gap-1 text-sm text-muse-400 hover:text-muse-300 transition-colors group">
            查看更多 <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse-soft" />
            ))}
          </div>
        ) : playlists.length > 0 ? (
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {playlists.map((playlist) => (
              <motion.div key={playlist.id} variants={item}>
                <Link to={`/music/playlist/${playlist.id}`} className="block group">
                  <div className="glass-card overflow-hidden">
                    <div className="relative aspect-square overflow-hidden">
                      <img src={playlist.coverImgUrl} alt={playlist.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    <div className="p-3">
                      <h3 className="text-xs font-medium text-white line-clamp-2 group-hover:text-muse-300 transition-colors">{playlist.name}</h3>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 glass rounded-2xl">
            <p className="text-4xl mb-3">🎵</p>
            <p className="text-gray-400">音乐数据加载中...</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="text-center">
          <p className="gradient-text text-lg font-bold">MuseHub</p>
          <p className="text-gray-600 text-sm mt-2">基于协同过滤算法的多维泛娱乐推荐平台</p>
          <p className="text-gray-700 text-xs mt-4">&copy; {new Date().getFullYear()} MuseHub. 毕业设计作品.</p>
        </div>
      </footer>
    </div>
  );
}
