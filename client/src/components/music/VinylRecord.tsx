import { motion } from 'framer-motion';

interface VinylRecordProps {
  albumArt: string;
  isPlaying: boolean;
  size?: number;
}

export default function VinylRecord({ albumArt, isPlaying, size = 320 }: VinylRecordProps) {
  const grooveCount = 8;
  const innerRadius = size * 0.16;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={
          isPlaying
            ? { duration: 8, repeat: Infinity, ease: 'linear' }
            : { duration: 0 }
        }
        className="w-full h-full relative"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at center,
                transparent ${innerRadius}px,
                #111 ${innerRadius}px,
                #111 ${innerRadius + 2}px,
                #1a1a1a ${innerRadius + 2}px
              )
            `,
            boxShadow: `
              0 0 60px rgba(0, 0, 0, 0.8),
              inset 0 0 40px rgba(0, 0, 0, 0.5),
              0 0 100px rgba(132, 61, 255, 0.15)
            `,
          }}
        >
          {Array.from({ length: grooveCount }).map((_, i) => {
            const r = innerRadius + 20 + (i * (size / 2 - innerRadius - 30)) / grooveCount;
            return (
              <div
                key={i}
                className="absolute rounded-full border border-white/[0.03]"
                style={{
                  width: r * 2,
                  height: r * 2,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            );
          })}

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[0.8%] h-[0.8%] rounded-full bg-gray-600" />
        </div>

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden border-4 border-dark-800 shadow-glass"
          style={{ width: innerRadius * 2, height: innerRadius * 2 }}
        >
          <img
            src={albumArt}
            alt="Album"
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>

      {isPlaying && (
        <div
          className="absolute inset-0 rounded-full animate-glow pointer-events-none"
          style={{
            boxShadow: '0 0 40px rgba(132, 61, 255, 0.2), 0 0 80px rgba(132, 61, 255, 0.1)',
          }}
        />
      )}
    </div>
  );
}
