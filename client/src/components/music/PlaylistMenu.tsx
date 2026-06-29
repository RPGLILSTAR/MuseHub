import { motion, AnimatePresence } from 'framer-motion';
import { HiPlus, HiCheck } from 'react-icons/hi2';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { musicFullApi } from '@/services/musicApi';
import type { UserPlaylist } from '@/types/music';

interface PlaylistMenuProps {
  songId: number;
  onAdded?: () => void;
  triggerClassName?: string;
}

export default function PlaylistMenu({ songId, onAdded, triggerClassName = '' }: PlaylistMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && playlists.length === 0) {
      setLoading(true);
      musicFullApi
        .getUserPlaylists()
        .then(setPlaylists)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, playlists.length]);

  // 智能计算菜单位置，根据不同场景调整
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const menuWidth = 224; // w-56 = 14rem = 224px
    const menuHeight = 300; // 估算菜单最大高度
    const gap = 8; // 菜单与触发按钮之间的距离

    let top = 0;
    let left = 0;

    // 判断菜单应该显示在触发按钮的哪一侧
    // 优先考虑下方，如果下方空间不足则考虑上方
    const spaceBelow = viewportHeight - (triggerRect.bottom + gap);
    const spaceAbove = triggerRect.top - gap;

    if (spaceBelow >= menuHeight) {
      // 下方有足够空间
      top = triggerRect.bottom + gap;
    } else if (spaceAbove >= menuHeight) {
      // 上方有足够空间
      top = triggerRect.top - menuHeight - gap;
    } else {
      // 两边都不够，选择空间更大的一边
      top = spaceBelow > spaceAbove 
        ? triggerRect.bottom + gap
        : triggerRect.top - Math.min(menuHeight, spaceAbove) - gap;
    }

    // 水平位置：优先右对齐，如果超出视口则左对齐
    const rightAlignedLeft = triggerRect.right - menuWidth;
    if (rightAlignedLeft < 8) {
      // 右对齐会超出左边界
      left = 8; // 留8px边距
    } else if (triggerRect.right > viewportWidth - 8) {
      // 触发按钮本身靠近右边界
      left = Math.max(8, viewportWidth - menuWidth - 8);
    } else {
      // 默认右对齐
      left = rightAlignedLeft;
    }

    setMenuPosition({ top, left });
  }, [isOpen]);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      await musicFullApi.addToPlaylist(playlistId, songId);
      setAddedIds((prev) => new Set([...prev, playlistId]));
      setTimeout(() => {
        setAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(playlistId);
          return next;
        });
        onAdded?.();
      }, 1500);
    } catch (err) {
      console.error('Failed to add to playlist:', err);
    }
  };

  // 动态计算菜单尺寸
  const computedMaxHeight = 
    playlists.length === 0 ? 'max-h-32' :
    playlists.length <= 3 ? 'max-h-40' :
    playlists.length <= 6 ? 'max-h-64' :
    'max-h-96';

  return (
    <>
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={triggerClassName || 'p-1.5 rounded-lg transition-colors text-gray-600 hover:text-muse-400 opacity-0 group-hover:opacity-100'}
      >
        <HiPlus className="w-4 h-4" />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                zIndex: 9999,
              }}
              className="w-56 bg-dark-900 border border-white/10 rounded-lg shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-white/5 flex-shrink-0">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">加入歌单</p>
              </div>

              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">加载中...</div>
              ) : playlists.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  <p>还没有创建歌单</p>
                  <p className="text-xs text-gray-600 mt-1">先去"我的音乐"创建吧</p>
                </div>
              ) : (
                <div className={`overflow-y-auto ${computedMaxHeight}`}>
                  {playlists.map((pl) => (
                    <motion.button
                      key={pl.id}
                      onClick={() => handleAddToPlaylist(pl.id)}
                      whileHover={{ backgroundColor: 'rgba(217, 119, 255, 0.1)' }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate flex-1">{pl.name}</span>
                      {addedIds.has(pl.id) && <HiCheck className="w-4 h-4 text-green-400 flex-shrink-0 ml-2" />}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
