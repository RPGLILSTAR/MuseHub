import { useEffect } from 'react';
import { usePlayerStore } from '@/store/playerStore';

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export default function GlobalKeyboardShortcuts() {
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const volume = usePlayerStore((s) => s.volume);
  const toggleExpand = usePlayerStore((s) => s.toggleExpand);
  const isExpanded = usePlayerStore((s) => s.isExpanded);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!currentTrack) return;

      const el = e.target as HTMLElement;
      if (INPUT_TAGS.has(el.tagName) || el.isContentEditable) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            nextTrack();
          }
          break;
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            prevTrack();
          }
          break;
        case 'ArrowUp':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setVolume(Math.min(1, volume + 0.1));
          }
          break;
        case 'ArrowDown':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setVolume(Math.max(0, volume - 0.1));
          }
          break;
        case 'KeyL':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleExpand();
          }
          break;
        case 'Escape':
          if (isExpanded) {
            e.preventDefault();
            toggleExpand();
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentTrack, togglePlay, nextTrack, prevTrack, setVolume, volume, toggleExpand, isExpanded]);

  return null;
}
