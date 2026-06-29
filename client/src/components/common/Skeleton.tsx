import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
  count?: number;
}

function SkeletonBase({ className = '', width, height, variant = 'rect' }: Omit<SkeletonProps, 'count'>) {
  const baseClass = variant === 'circle' ? 'rounded-full' : variant === 'text' ? 'rounded-md' : 'rounded-xl';

  return (
    <motion.div
      className={`bg-white/5 ${baseClass} ${className}`}
      style={{ width, height }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export function Skeleton({ count = 1, ...props }: SkeletonProps) {
  if (count === 1) return <SkeletonBase {...props} />;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBase key={i} {...props} />
      ))}
    </>
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <Skeleton className="w-full aspect-[2/3]" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" variant="text" />
          <Skeleton className="h-4 w-20" variant="text" />
        </div>
      </div>
    </div>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex p-4 gap-4">
        <Skeleton className="w-24 h-36 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-full" variant="text" />
          <Skeleton className="h-4 w-2/3" variant="text" />
          <Skeleton className="h-4 w-1/2" variant="text" />
          <Skeleton className="h-3 w-full" variant="text" />
          <Skeleton className="h-3 w-4/5" variant="text" />
        </div>
      </div>
    </div>
  );
}

export function PlaylistCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <Skeleton className="w-full aspect-square" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-3 w-1/2" variant="text" />
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="min-h-screen pt-20">
      <Skeleton className="w-full h-[60vh] rounded-none" />
      <div className="max-w-7xl mx-auto px-6 -mt-40 relative z-10 space-y-6">
        <div className="glass rounded-2xl p-8 space-y-4">
          <Skeleton className="h-10 w-1/2" variant="text" />
          <Skeleton className="h-5 w-1/3" variant="text" />
          <Skeleton className="h-4 w-full" variant="text" count={4} />
        </div>
      </div>
    </div>
  );
}
