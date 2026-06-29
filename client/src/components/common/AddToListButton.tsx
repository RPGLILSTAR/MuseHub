import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiPlus, HiXMark, HiQueueList, HiCheck } from 'react-icons/hi2';
import { collectionApi, type ItemType, type UserList } from '@/services/collectionApi';

interface AddToListButtonProps {
  itemType: ItemType;
  itemId: string;
}

export default function AddToListButton({ itemType, itemId }: AddToListButtonProps) {
  const [lists, setLists] = useState<UserList[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (open) collectionApi.getLists(itemType).then(setLists).catch(() => {});
  }, [open, itemType]);

  const handleAdd = async (listId: string) => {
    await collectionApi.addToList(listId, itemId).catch(() => {});
    collectionApi.getLists(itemType).then(setLists);
  };

  const handleRemove = async (listId: string) => {
    await collectionApi.removeFromList(listId, itemId).catch(() => {});
    collectionApi.getLists(itemType).then(setLists);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const list = await collectionApi.createList(itemType, newName.trim());
    await collectionApi.addToList(list.id, itemId);
    setNewName('');
    collectionApi.getLists(itemType).then(setLists);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-all">
        <HiQueueList className="w-4 h-4" />
        加入{itemType === 'book' ? '书单' : '片单'}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 mt-2 z-50 w-64 glass rounded-2xl border border-white/10 p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">选择{itemType === 'book' ? '书单' : '片单'}</span>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10"><HiXMark className="w-4 h-4 text-gray-400" /></button>
              </div>

              <div className="max-h-40 overflow-y-auto hide-scrollbar space-y-1 mb-3">
                {lists.map((list) => {
                  const inList = list.items.includes(itemId);
                  return (
                    <button key={list.id} onClick={() => inList ? handleRemove(list.id) : handleAdd(list.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all ${inList ? 'bg-muse-500/10 text-muse-300' : 'text-gray-300 hover:bg-white/5'}`}>
                      {inList ? <HiCheck className="w-4 h-4 text-muse-400" /> : <HiQueueList className="w-4 h-4 text-gray-500" />}
                      <span className="truncate">{list.name}</span>
                      <span className="text-xs text-gray-600 ml-auto">{list.items.length}</span>
                    </button>
                  );
                })}
                {lists.length === 0 && <p className="text-xs text-gray-600 text-center py-2">暂无{itemType === 'book' ? '书单' : '片单'}</p>}
              </div>

              <div className="flex gap-2">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="新建..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-muse-500/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
                <button onClick={handleCreate} className="p-2 rounded-xl bg-muse-500 text-white hover:bg-muse-400"><HiPlus className="w-4 h-4" /></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
