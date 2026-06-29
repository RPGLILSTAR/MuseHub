import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiStar } from 'react-icons/hi2';
import type { Movie } from '@/types';

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export default function MovieCard({ movie, index = 0 }: MovieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="waterfall-item"
    >
      <Link to={`/movies/${movie.id}`} className="block group">
        <div className="glass-card overflow-hidden">
          <div className="relative overflow-hidden">
            {movie.posterPath ? (
              <img
                src={movie.posterPath}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-dark-800 flex items-center justify-center">
                <span className="text-gray-600 text-4xl">🎬</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
              <HiStar className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-sm font-semibold text-white">{movie.voteAverage != null ? Number(movie.voteAverage).toFixed(1) : 'N/A'}</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
              <p className="text-sm text-gray-200 line-clamp-3">{movie.overview || '暂无简介'}</p>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-white text-base leading-tight line-clamp-2 group-hover:text-muse-300 transition-colors duration-300">
              {movie.title}
            </h3>
            {movie.originalTitle !== movie.title && (
              <p className="text-xs text-gray-500 mt-1 truncate">{movie.originalTitle}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              {movie.releaseDate && <span>{movie.releaseDate.slice(0, 4)}</span>}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
