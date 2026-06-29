import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiStar, HiClock, HiCalendar, HiArrowLeft, HiPlay } from 'react-icons/hi2';
import { movieApi } from '@/services/api';
import { DetailPageSkeleton } from '@/components/common/Skeleton';
import MovieCard from '@/components/movie/MovieCard';
import MarkButton from '@/components/common/MarkButton';
import AddToListButton from '@/components/common/AddToListButton';
import ReviewSection from '@/components/common/ReviewSection';
import type { MovieDetail as MovieDetailType } from '@/types';

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    movieApi.getDetail(parseInt(id))
      .then((data) => {
        if (data && data.title) {
          setMovie(data);
        } else {
          setError('返回数据格式异常');
        }
      })
      .catch((err) => {
        console.error('MovieDetail fetch error:', err);
        setError(err?.message || '加载失败');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailPageSkeleton />;

  if (error || !movie) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-6xl">🎬</p>
        <p className="text-gray-400 text-lg">{error || '影片未找到'}</p>
        <Link to="/movies" className="px-5 py-2.5 rounded-xl bg-muse-500 text-white text-sm hover:bg-muse-400 transition-colors">返回影视列表</Link>
      </div>
    );
  }

  const genres = movie.genres || [];
  const cast = movie.credits?.cast || [];
  const crew = movie.credits?.crew || [];
  const videos = movie.videos || [];
  const similar = movie.similar || [];
  const director = crew.find((c) => c.job === 'Director');
  const trailer = videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube');

  return (
    <div className="min-h-screen pb-20">
      <div className="relative h-[65vh] overflow-hidden">
        {movie.backdropPath && <img src={movie.backdropPath} alt={movie.title} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-dark-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/80 to-transparent" />
        <div className="absolute top-24 left-6">
          <Link to="/movies" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm text-sm text-white hover:bg-white/20 transition-colors">
            <HiArrowLeft className="w-4 h-4" /> 返回影视
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-64 relative z-10">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 w-56 mx-auto md:mx-0">
            {movie.posterPath ? (
              <img src={movie.posterPath} alt={movie.title} className="w-full rounded-2xl shadow-glass border border-white/10" />
            ) : (
              <div className="w-full aspect-[2/3] rounded-2xl bg-dark-800 flex items-center justify-center border border-white/10"><span className="text-6xl">🎬</span></div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">{movie.title}</h1>
            {movie.tagline && <p className="text-lg text-muse-300 mt-2 italic">"{movie.tagline}"</p>}

            <div className="flex flex-wrap items-center gap-4 mt-5">
              {movie.voteAverage != null && (
                <div className="glass rounded-xl px-5 py-3 border border-white/10 text-center">
                  <div className="flex items-center gap-1.5">
                    <HiStar className="w-5 h-5 text-yellow-400" />
                    <span className="text-2xl font-bold text-yellow-400">{Number(movie.voteAverage).toFixed(1)}</span>
                    <span className="text-xs text-gray-400">/ 10</span>
                  </div>
                  {movie.voteCount != null && <p className="text-xs text-gray-500 mt-1">{movie.voteCount} 人评价</p>}
                </div>
              )}

              {movie.runtime != null && movie.runtime > 0 && (
                <span className="flex items-center gap-1.5 text-gray-300 text-sm"><HiClock className="w-4 h-4" />{movie.runtime} 分钟</span>
              )}
              {movie.releaseDate && (
                <span className="flex items-center gap-1.5 text-gray-300 text-sm"><HiCalendar className="w-4 h-4" />{movie.releaseDate}</span>
              )}
            </div>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {genres.map((g) => (
                  <span key={g.id} className="px-3 py-1 rounded-full text-xs font-medium bg-muse-500/10 text-muse-300 border border-muse-500/20">{g.name}</span>
                ))}
              </div>
            )}

            {director && <p className="text-sm text-gray-400 mt-4">导演：<span className="text-white">{director.name}</span></p>}

            <div className="flex flex-wrap gap-3 mt-6">
              <MarkButton itemType="movie" itemId={String(movie.id)} itemTitle={movie.title} itemCover={movie.posterPath || undefined} genres={genres.map((g: any) => typeof g === 'string' ? g : g.name)} />
              <AddToListButton itemType="movie" itemId={String(movie.id)} />
              {trailer && (
                <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-all">
                  <HiPlay className="w-4 h-4" /> 观看预告片
                </a>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-10 glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3">剧情简介</h2>
          <p className="text-gray-300 leading-relaxed text-sm">{movie.overview || '暂无简介'}</p>
        </motion.div>

        {cast.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10">
            <h2 className="text-xl font-bold text-white mb-6">演员阵容</h2>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
              {cast.slice(0, 15).map((m) => (
                <div key={m.id} className="flex-shrink-0 w-24 text-center group">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-2 border-white/10 group-hover:border-muse-500/50 transition-colors">
                    {m.profilePath ? <img src={m.profilePath} alt={m.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-dark-800 flex items-center justify-center text-2xl">👤</div>}
                  </div>
                  <p className="text-xs text-white mt-2 font-medium truncate">{m.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{m.character}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10">
          <ReviewSection itemType="movie" itemId={String(movie.id)} />
        </motion.div>

        {similar.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-10">
            <h2 className="text-xl font-bold text-white mb-6">相似推荐</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similar.map((m, i) => <MovieCard key={m.id} movie={m} index={i} />)}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
