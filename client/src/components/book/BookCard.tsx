import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiStar } from 'react-icons/hi2';
import type { Book } from '@/types';

interface BookCardProps {
  book: Book;
  index?: number;
}

export default function BookCard({ book, index = 0 }: BookCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="waterfall-item"
    >
      <Link to={`/books/${book.id}`} className="block group">
        <div className="glass-card overflow-hidden p-5">
          <div className="flex gap-5">
            <div className="flex-shrink-0 w-28 relative">
              {book.thumbnail ? (
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  className="w-full rounded-lg shadow-lg transition-transform duration-500 group-hover:scale-105 group-hover:shadow-neon-purple"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[2/3] rounded-lg bg-gradient-to-br from-muse-600/30 to-pink-600/20 flex items-center justify-center border border-white/10">
                  <span className="text-3xl">📖</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-white text-base leading-tight line-clamp-2 group-hover:text-muse-300 transition-colors duration-300">
                  {book.title}
                </h3>
                {book.subtitle && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{book.subtitle}</p>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  {Array.isArray(book.authors) ? book.authors.join(', ') : '未知作者'}
                </p>
                {book.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                    {book.description.replace(/<[^>]*>/g, '')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 mt-3">
                {book.averageRating && (
                  <div className="flex items-center gap-1">
                    <HiStar className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-sm font-medium text-white">{book.averageRating}</span>
                  </div>
                )}
                {book.publishedDate && (
                  <span className="text-xs text-gray-500">{book.publishedDate.slice(0, 4)}</span>
                )}
                {book.categories?.[0] && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muse-500/15 text-muse-300 border border-muse-500/20">
                    {book.categories[0]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
