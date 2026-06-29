import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiPlay } from 'react-icons/hi2';
import type { Playlist } from '@/types';

function formatCount(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toString();
}

interface PlaylistCardProps {
  playlist: Playlist;
  index?: number;
}

export default function PlaylistCard({ playlist, index = 0 }: PlaylistCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/music/playlist/${playlist.id}`} className="block group">
        <div className="glass-card overflow-hidden">
          <div className="relative aspect-square overflow-hidden">
            <img
              src={playlist.coverImgUrl}
              alt={playlist.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs text-white">
              <HiPlay className="w-3 h-3" />
              <span>{formatCount(playlist.playCount)}</span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex justify-end">
                <button className="w-10 h-10 rounded-full bg-muse-500 flex items-center justify-center shadow-neon-purple hover:scale-110 transition-transform">
                  <HiPlay className="w-5 h-5 text-white ml-0.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-3.5">
            <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug group-hover:text-muse-300 transition-colors duration-300">
              {playlist.name}
            </h3>
            {playlist.tags && playlist.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {playlist.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
