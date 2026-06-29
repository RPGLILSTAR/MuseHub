import { useState } from 'react';
import { HiStar } from 'react-icons/hi2';

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const labels = ['', '很差', '较差', '一般', '推荐', '力荐'];

export default function StarRating({ value, onChange, readonly = false, size = 'md', showText = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = (hover || value) >= star;
        return (
          <button key={star} type="button" disabled={readonly}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => onChange?.(star === value ? 0 : star)}
            className={`transition-all duration-150 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          >
            <HiStar className={`${s} ${active ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.4)]' : 'text-gray-600'} transition-colors`} />
          </button>
        );
      })}
      {showText && (hover || value) > 0 && (
        <span className="text-xs text-yellow-400 ml-1 font-medium">{labels[hover || value]}</span>
      )}
    </div>
  );
}
