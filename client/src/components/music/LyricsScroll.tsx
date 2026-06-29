import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { LyricLine } from '@/types';

interface LyricsScrollProps {
  lyrics: LyricLine[];
  currentTime: number;
}

export default function LyricsScroll({ lyrics, currentTime }: LyricsScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const userScrolling = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();

  const activeIndex = lyrics.reduce((acc, line, i) => {
    return currentTime >= line.time ? i : acc;
  }, -1);

  const setLineRef = useCallback((el: HTMLDivElement | null, i: number) => {
    lineRefs.current[i] = el;
  }, []);

  useEffect(() => {
    if (activeIndex < 0 || userScrolling.current) return;
    const el = lineRefs.current[activeIndex];
    const container = containerRef.current;
    if (!el || !container) return;

    const containerH = container.clientHeight;
    const target = el.offsetTop - containerH / 2 + el.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [activeIndex]);

  const handleWheel = useCallback(() => {
    userScrolling.current = true;
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      userScrolling.current = false;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => clearTimeout(scrollTimer.current);
  }, []);

  if (lyrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-2xl">🎵</span>
          </div>
          <p className="text-gray-500 text-lg">暂无歌词</p>
          <p className="text-gray-600 text-sm mt-1">纯音乐，请欣赏</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchMove={handleWheel}
      className="h-full overflow-y-auto hide-scrollbar relative"
    >
      {/* Top spacer to allow first line to center */}
      <div className="h-[45%]" />

      <div className="flex flex-col items-center gap-5 px-4">
        {lyrics.map((line, i) => {
          const isActive = i === activeIndex;
          const dist = Math.abs(i - activeIndex);
          const opacity = isActive ? 1 : dist <= 2 ? 0.45 : dist <= 5 ? 0.2 : 0.1;

          return (
            <div
              key={`${i}-${line.time}`}
              ref={(el) => setLineRef(el, i)}
              className="text-center w-full cursor-default select-none"
            >
              <motion.p
                animate={{
                  scale: isActive ? 1.08 : 1,
                  opacity,
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={`leading-relaxed transition-colors duration-300 ${
                  isActive
                    ? 'text-xl sm:text-2xl font-bold text-white drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                    : 'text-base sm:text-lg text-gray-400 font-normal'
                }`}
              >
                {line.text}
              </motion.p>
            </div>
          );
        })}
      </div>

      {/* Bottom spacer to allow last line to center */}
      <div className="h-[45%]" />
    </div>
  );
}
