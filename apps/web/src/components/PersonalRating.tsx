import { useState } from 'react';
import { Star, X } from 'lucide-react';

const SCORE_LABELS: Record<number, string> = {
  10: 'Masterpiece',
  9: 'Great',
  8: 'Very Good',
  7: 'Good',
  6: 'Fine',
  5: 'Average',
  4: 'Bad',
  3: 'Very Bad',
  2: 'Horrible',
  1: 'Appalling',
};

interface PersonalRatingProps {
  score: number | null;
  onChange: (newScore: number | null) => Promise<void> | void;
  loading?: boolean;
}

export default function PersonalRating({ score, onChange, loading = false }: PersonalRatingProps) {
  const [hoverScore, setHoverScore] = useState<number | null>(null);

  const activeScore = hoverScore !== null ? hoverScore : score;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center space-x-0.5 sm:space-x-1 flex-nowrap">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starNum) => {
          const isFilled = activeScore !== null && starNum <= activeScore;

          return (
            <button
              key={starNum}
              type="button"
              disabled={loading}
              onMouseEnter={() => setHoverScore(starNum)}
              onMouseLeave={() => setHoverScore(null)}
              onClick={() => onChange(score === starNum ? null : starNum)}
              className="p-0.5 rounded transition-transform hover:scale-115 disabled:opacity-50 shrink-0"
              title={`${starNum}/10 - ${SCORE_LABELS[starNum]}`}
            >
              <Star
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                  isFilled
                    ? 'text-brand-yellow fill-brand-yellow'
                    : 'text-dark-700 hover:text-brand-yellow/60'
                }`}
              />
            </button>
          );
        })}

        {score !== null && (
          <button
            type="button"
            disabled={loading}
            onClick={() => onChange(null)}
            className="ml-1 p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-dark-850 transition-colors shrink-0"
            title="Clear rating"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="text-[10px] sm:text-[11px] text-slate-400 h-4 truncate">
        {activeScore !== null ? (
          <span>
            <strong className="text-brand-yellow font-extrabold">{activeScore}/10</strong>{' '}
            <span className="text-slate-400">— {SCORE_LABELS[activeScore]}</span>
          </span>
        ) : (
          <span className="text-slate-500">Tap star to rate</span>
        )}
      </div>
    </div>
  );
}

