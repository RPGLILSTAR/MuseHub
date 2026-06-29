import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiStar, HiArrowLeft, HiBookOpen, HiGlobeAlt, HiUserGroup, HiTag } from 'react-icons/hi2';
import { bookApi } from '@/services/api';
import { DetailPageSkeleton } from '@/components/common/Skeleton';
import MarkButton from '@/components/common/MarkButton';
import AddToListButton from '@/components/common/AddToListButton';
import ReviewSection from '@/components/common/ReviewSection';
import type { Book } from '@/types';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    bookApi.getDetail(id)
      .then((data) => {
        if (data && data.title) {
          setBook(data);
        } else {
          setError('返回数据格式异常');
        }
      })
      .catch((err) => {
        console.error('BookDetail fetch error:', err);
        setError(err?.message || '加载失败');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailPageSkeleton />;

  if (error || !book) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-6xl">📖</p>
        <p className="text-gray-400 text-lg">{error || '书籍未找到'}</p>
        <Link to="/books" className="px-5 py-2.5 rounded-xl bg-muse-500 text-white text-sm hover:bg-muse-400 transition-colors">返回书籍列表</Link>
      </div>
    );
  }

  const authors = Array.isArray(book.authors) ? book.authors : [];
  const categories = Array.isArray(book.categories) ? book.categories : [];
  const ratingDisplay = book.averageRating ? (book.averageRating * 2).toFixed(1) : null;
  const desc = book.description || '';

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          {book.thumbnail && <img src={book.thumbnail} alt="" className="w-full h-full object-cover opacity-10 blur-3xl scale-125" />}
          <div className="absolute inset-0 bg-dark-950/80" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <Link to="/books" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors mb-8">
            <HiArrowLeft className="w-4 h-4" /> 返回书籍
          </Link>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-10">
            <div className="flex-shrink-0 mx-auto md:mx-0">
              {book.thumbnail ? (
                <img src={book.thumbnail} alt={book.title} className="w-48 sm:w-56 rounded-xl shadow-glass border border-white/10" />
              ) : (
                <div className="w-48 sm:w-56 aspect-[2/3] rounded-xl bg-gradient-to-br from-muse-600/30 to-pink-600/20 flex items-center justify-center border border-white/10">
                  <span className="text-6xl">📖</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{book.title}</h1>
              {book.subtitle && <p className="text-lg text-gray-400 mt-2">{book.subtitle}</p>}
              {authors.length > 0 && <p className="text-muse-300 mt-3 text-lg">{authors.join(' · ')}</p>}

              {ratingDisplay && (
                <div className="flex items-center gap-4 mt-5">
                  <div className="glass rounded-xl px-5 py-3 border border-white/10 text-center">
                    <div className="flex items-center gap-1.5">
                      <HiStar className="w-5 h-5 text-yellow-400" />
                      <span className="text-2xl font-bold text-yellow-400">{ratingDisplay}</span>
                    </div>
                    {book.ratingsCount != null && <p className="text-xs text-gray-500 mt-1">{book.ratingsCount} 人评价</p>}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-sm text-gray-400">
                {book.publisher && <span className="flex items-center gap-1.5"><HiUserGroup className="w-4 h-4 text-gray-500" />{book.publisher}</span>}
                {book.publishedDate && <span className="flex items-center gap-1.5"><HiBookOpen className="w-4 h-4 text-gray-500" />{book.publishedDate}</span>}
                {book.pageCount && <span>{book.pageCount} 页</span>}
                {book.language && <span className="flex items-center gap-1.5"><HiGlobeAlt className="w-4 h-4 text-gray-500" />{book.language.toUpperCase()}</span>}
              </div>

              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <HiTag className="w-4 h-4 text-gray-500 mt-0.5" />
                  {categories.map((cat) => (
                    <span key={cat} className="px-3 py-1 rounded-full text-xs font-medium bg-muse-500/10 text-muse-300 border border-muse-500/20">{cat}</span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                <MarkButton itemType="book" itemId={book.id} itemTitle={book.title} itemCover={book.thumbnail} genres={categories} />
                <AddToListButton itemType="book" itemId={book.id} />
                {book.previewLink && (
                  <a href={book.previewLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-all">
                    <HiGlobeAlt className="w-4 h-4" /> 在线阅读
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 mt-8">
        {desc && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HiBookOpen className="w-5 h-5 text-muse-400" /> 内容简介
            </h2>
            <div className={`text-gray-300 leading-relaxed text-sm ${!descExpanded ? 'line-clamp-6' : ''}`}
              dangerouslySetInnerHTML={{ __html: desc }} />
            {desc.length > 300 && (
              <button onClick={() => setDescExpanded(!descExpanded)} className="text-muse-400 text-sm mt-3 hover:text-muse-300 transition-colors">
                {descExpanded ? '收起' : '展开全部'}
              </button>
            )}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ReviewSection itemType="book" itemId={book.id} />
        </motion.div>
      </div>
    </div>
  );
}
