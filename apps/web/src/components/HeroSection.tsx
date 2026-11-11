import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Anime } from '@anisume/shared';
import { Star, Play, Compass, ChevronLeft, ChevronRight, Film, Tv } from 'lucide-react';

interface HeroSectionProps {
  featuredList: Anime[];
}

export default function HeroSection({ featuredList }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featuredList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredList.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [featuredList.length]);

  if (!featuredList || featuredList.length === 0) {
    return null;
  }

  const current = featuredList[currentIndex];
  if (!current) return null;

  const displayTitle = current.title_english || current.title;
  const originalTitle = current.title_english && current.title !== current.title_english ? current.title : current.title_japanese;
  const imageUrl = current.images?.jpg?.large_image_url || current.images?.jpg?.image_url;
  const isMovie = current.type === 'movie';

  return (
    <section className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-dark-900 border border-dark-800 shadow-2xl mb-12 sm:mb-16">
      {/* Background Banner with gradient overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={imageUrl}
          alt={displayTitle}
          className="w-full h-full object-cover object-center filter blur-xl scale-110 opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/80 to-dark-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/90 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-10 sm:py-16 md:py-20 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Left: Text & Actions */}
        <div className="flex-1 max-w-2xl space-y-4 sm:space-y-5 text-center md:text-left">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-md bg-brand-600/20 text-brand-300 border border-brand-500/30 flex items-center space-x-1.5 uppercase tracking-wider">
              {isMovie ? <Film className="w-3 h-3 text-fuchsia-400" /> : <Tv className="w-3 h-3 text-brand-400" />}
              <span>{isMovie ? 'Anime Movie' : 'TV Series'}</span>
            </span>

            {current.score && (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold">{current.score.toFixed(2)}</span>
              </span>
            )}

            {current.year && (
              <span className="px-2.5 py-1 rounded-md bg-dark-850 text-slate-300 border border-dark-800">
                {current.year}
              </span>
            )}

            {current.episodes && (
              <span className="px-2.5 py-1 rounded-md bg-dark-850 text-slate-300 border border-dark-800">
                {current.episodes} episodes
              </span>
            )}
          </div>

          {/* Titles */}
          <div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {displayTitle}
            </h1>
            {originalTitle && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium tracking-wide">
                {originalTitle}
              </p>
            )}
          </div>

          {/* Genre chips */}
          {current.genres && current.genres.length > 0 && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
              {current.genres.slice(0, 4).map((g) => (
                <Link
                  key={g.name}
                  to={`/discover?genres=${encodeURIComponent(g.name)}`}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-dark-800/80 hover:bg-brand-600/30 hover:text-brand-200 text-slate-300 border border-dark-700 transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {current.synopsis && (
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 sm:line-clamp-4 leading-relaxed font-normal">
              {current.synopsis}
            </p>
          )}

          {/* Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <Link
              to={`/anime/${current.mal_id}`}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>View Details</span>
            </Link>

            <Link
              to="/discover"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-dark-850 hover:bg-dark-800 text-slate-200 border border-dark-700/80 hover:border-slate-500/40 transition-colors"
            >
              <Compass className="w-4 h-4 text-brand-400" />
              <span>Explore Catalog</span>
            </Link>
          </div>
        </div>

        {/* Right: Crisp Poster Card */}
        <div className="shrink-0 relative hidden sm:block">
          <Link
            to={`/anime/${current.mal_id}`}
            className="block w-48 lg:w-60 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 hover:border-brand-500/60 transition-all duration-300 group"
          >
            <img
              src={imageUrl}
              alt={displayTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>
      </div>

      {/* Slider Indicator Dots & Controls */}
      {featuredList.length > 1 && (
        <div className="relative z-10 px-6 sm:px-10 pb-6 flex items-center justify-between">
          {/* Indicator dots */}
          <div className="flex items-center space-x-2">
            {featuredList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-8 bg-brand-500 shadow-glow'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Prev / Next buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length)}
              className="p-1.5 rounded-lg bg-dark-900/80 hover:bg-dark-800 text-slate-400 hover:text-white border border-dark-800 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredList.length)}
              className="p-1.5 rounded-lg bg-dark-900/80 hover:bg-dark-800 text-slate-400 hover:text-white border border-dark-800 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

