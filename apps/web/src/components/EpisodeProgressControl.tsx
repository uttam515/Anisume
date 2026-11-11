import { useState, useEffect } from 'react';
import { Plus, Minus, Film, CheckCircle2, Sliders } from 'lucide-react';

interface EpisodeProgressControlProps {
  episodesWatched: number;
  totalEpisodes: number | null;
  isMovie?: boolean;
  onChange: (newWatched: number) => Promise<void> | void;
  loading?: boolean;
  showSlider?: boolean;
}

export default function EpisodeProgressControl({
  episodesWatched,
  totalEpisodes,
  isMovie = false,
  onChange,
  loading = false,
  showSlider = true,
}: EpisodeProgressControlProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [sliderVal, setSliderVal] = useState(episodesWatched);
  const [inputVal, setInputVal] = useState(String(episodesWatched));

  useEffect(() => {
    setSliderVal(episodesWatched);
    setInputVal(String(episodesWatched));
  }, [episodesWatched]);

  if (isMovie) {
    return (
      <div className="flex items-center space-x-2 text-xs text-slate-400 bg-dark-900 border border-dark-800 px-3 py-1.5 rounded-xl">
        <Film className="w-3.5 h-3.5 text-brand-400" />
        <span>Feature Film</span>
      </div>
    );
  }

  const hasLimit = totalEpisodes !== null && totalEpisodes > 0;
  const maxEpisodes = hasLimit ? totalEpisodes! : 500;
  const percentage = hasLimit
    ? Math.min(100, Math.round((episodesWatched / totalEpisodes!) * 100))
    : null;

  const handleIncrement = (amount = 1) => {
    if (loading) return;
    const target = episodesWatched + amount;
    if (hasLimit && target > totalEpisodes!) {
      onChange(totalEpisodes!);
    } else {
      onChange(target);
    }
  };

  const handleDecrement = (amount = 1) => {
    if (loading) return;
    if (episodesWatched <= 0) return;
    onChange(Math.max(0, episodesWatched - amount));
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    let parsed = parseInt(inputVal, 10);
    if (isNaN(parsed) || parsed < 0) parsed = 0;
    if (hasLimit && parsed > totalEpisodes!) parsed = totalEpisodes!;
    onChange(parsed);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSliderVal(val);
  };

  const handleSliderCommit = () => {
    if (sliderVal !== episodesWatched && !loading) {
      onChange(sliderVal);
    }
  };

  return (
    <div className="space-y-2">
      {/* Top Controls: Stepper & Quick Input */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 shrink-0">
          {/* Decrement Button */}
          <button
            type="button"
            disabled={loading || episodesWatched <= 0}
            onClick={() => handleDecrement(1)}
            className="w-8 h-8 rounded-lg bg-[#1C2329] hover:bg-[#252E37] disabled:opacity-30 border border-[#252E37] text-slate-300 flex items-center justify-center transition-colors shadow-sm active:scale-95 shrink-0"
            title="Decrease by 1 episode"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Episode Display / Direct Edit */}
          {isEditing ? (
            <form onSubmit={handleDirectSubmit} className="inline-block">
              <input
                type="number"
                autoFocus
                min={0}
                max={hasLimit ? totalEpisodes! : 9999}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onBlur={handleDirectSubmit}
                className="w-16 px-1.5 py-1 text-center text-xs font-bold rounded-lg bg-[#101313] border border-brand-red text-white focus:outline-none"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 rounded-lg hover:bg-[#1C2329] text-xs font-bold text-slate-200 transition-colors flex items-center space-x-1.5 border border-[#252E37]/60 hover:border-[#2E3842]"
              title="Click to type exact episode number"
            >
              <span className="text-brand-yellow text-sm font-black">{episodesWatched}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-300 font-bold">
                {hasLimit ? totalEpisodes : '?'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium ml-0.5">eps</span>
            </button>
          )}

          {/* Increment Button */}
          <button
            type="button"
            disabled={loading || (hasLimit && episodesWatched >= totalEpisodes!)}
            onClick={() => handleIncrement(1)}
            className="w-8 h-8 rounded-lg bg-[#1C2329] hover:bg-[#252E37] disabled:opacity-30 border border-[#252E37] text-slate-300 flex items-center justify-center transition-colors shadow-sm active:scale-95 shrink-0"
            title="Increase by 1 episode"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick jump or completion badge */}
        {hasLimit && episodesWatched === totalEpisodes ? (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30 shrink-0 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        ) : hasLimit ? (
          <button
            type="button"
            onClick={() => onChange(totalEpisodes!)}
            disabled={loading}
            className="text-[11px] font-bold text-slate-400 hover:text-brand-yellow hover:underline transition-colors shrink-0 px-2.5 py-1 rounded bg-[#1C2329] border border-[#252E37]"
            title="Set to max episodes"
          >
            Mark all ({totalEpisodes})
          </button>
        ) : (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => handleIncrement(5)}
              disabled={loading}
              className="px-1.5 py-0.5 text-[10px] bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-slate-200 rounded border border-dark-750"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => handleIncrement(10)}
              disabled={loading}
              className="px-1.5 py-0.5 text-[10px] bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-slate-200 rounded border border-dark-750"
            >
              +10
            </button>
          </div>
        )}
      </div>

      {/* Interactive Range Slider (if series has limit or slider requested) */}
      {showSlider && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center space-x-2">
            <Sliders className="w-3 h-3 text-slate-500 shrink-0" />
            <input
              type="range"
              min={0}
              max={maxEpisodes}
              value={sliderVal}
              onChange={handleSliderChange}
              onMouseUp={handleSliderCommit}
              onTouchEnd={handleSliderCommit}
              disabled={loading}
              className="w-full h-1.5 bg-dark-900 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
              title={`Drag to jump to episode (${sliderVal}/${hasLimit ? totalEpisodes : '?'})`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-0.5">
            <span>Ep 0</span>
            {percentage !== null ? (
              <span className={percentage === 100 ? 'text-emerald-400 font-semibold' : 'text-brand-300'}>
                {percentage}% ({episodesWatched}/{totalEpisodes})
              </span>
            ) : (
              <span className="text-brand-300">Ep {episodesWatched}</span>
            )}
            <span>{hasLimit ? `Ep ${totalEpisodes}` : 'Ongoing'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
