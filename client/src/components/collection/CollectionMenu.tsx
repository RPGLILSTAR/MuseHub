import { motion, AnimatePresence } from 'framer-motion';
import { HiPlus, HiCheck } from 'react-icons/hi2';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collectionApi, type UserList } from '@/services/collectionApi';

interface CollectionMenuProps {
  itemId: number;
  type: 'book' | 'movie';
  onAdded?: () => void;
  triggerClassName?: string;
}

export default function CollectionMenu({ itemId, type, onAdded, triggerClassName = '' }: CollectionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && lists.length === 0) {
      setLoading(true);
      collectionApi
        .getLists(type)
        .then(setLists)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, lists.length, type]);

  // 智能计算菜单位置
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const menuWidth = 224;
    const menuHeight = 300;
    const gap = 8;

    let top = 0;
    let left = 0;

    const spaceBelow = viewportHeight - (triggerRect.bottom + gap);
    const spaceAbove = triggerRect.top - gap;

    if (spaceBelow >= menuHeight) {
      top = triggerRect.bottom + gap;
    } else if (spaceAbove >= menuHeight) {
      top = triggerRect.top - menuHeight - gap;
    } else {
      top = spaceBelow > spaceAbove 
        ? triggerRect.bottom + gap
        : triggerRect.top - Math.min(menuHeight, spaceAbove) - gap;
    }

    const rightAlignedLeft = triggerRect.right - menuWidth;
    if (rightAlignedLeft < 8) {
      left = 8;
    } else if (triggerRect.right > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - menuWidth - 8);
    } else {
      left = rightAlignedLeft;
    }

    setMenuPosition({ top, left });
  }, [isOpen]);

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

  const handleAddToList = async (listId: string) => {
    try {
      await collectionApi.addToList(listId, String(itemId));
      setAddedIds((prev) => new Set([...prev, listId]));
      setTimeout(() => {
        setAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(listId);
          return next;
        });
        onAdded?.();
      }, 1500);
    } catch (err) {
      console.error('Failed to add to list:', err);
    }
  };

  const computedMaxHeight = 
    lists.length === 0 ? 'max-h-32' :
    lists.length <= 3 ? 'max-h-40' :
    lists.length <= 6 ? 'max-h-64' :
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
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">加入列表</p>
              </div>

              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">加载中...</div>
              ) : lists.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  <p>还没有创建列表</p>
                  <p className="text-xs text-gray-600 mt-1">先去创建吧</p>
                </div>
              ) : (
                <div className={`overflow-y-auto ${computedMaxHeight}`}>
                  {lists.map((l) => (
                    <motion.button
                      key={l.id}
                      onClick={() => handleAddToList(l.id)}
                      whileHover={{ backgroundColor: 'rgba(217, 119, 255, 0.1)' }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate flex-1">{l.name}</span>
                      {addedIds.has(l.id) && <HiCheck className="w-4 h-4 text-green-400 flex-shrink-0 ml-2" />}
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
