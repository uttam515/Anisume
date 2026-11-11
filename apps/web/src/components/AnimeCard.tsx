import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Anime } from '@anisume/shared';
import { Star, Film, Tv, ImageOff } from 'lucide-react';

interface AnimeCardProps {
  anime: Anime;
  priority?: boolean;
}

export default function AnimeCard({ anime, priority = false }: AnimeCardProps) {
  const [imageError, setImageError] = useState(false);

  const displayTitle = anime.title_english || anime.title;
  const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const isMovie = anime.type === 'movie';

  // Format score with 1 or 2 decimals
  const formattedScore = typeof anime.score === 'number' && anime.score > 0 ? anime.score.toFixed(2) : null;

  return (
    <Link
      to={`/anime/${anime.mal_id}`}
      className="group relative flex flex-col bg-dark-900 rounded-2xl overflow-hidden border border-dark-800 hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:-translate-y-1"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full bg-dark-950 overflow-hidden">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={displayTitle}
            loading={priority ? 'eager' : 'lazy'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-600 bg-dark-850">
            <ImageOff className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-[11px] text-center font-medium line-clamp-2">{displayTitle}</span>
          </div>
        )}

        {/* Top Badges: Type & Score */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none">
          {/* Format Badge */}
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-dark-950/85 backdrop-blur-md text-slate-100 border border-white/10 flex items-center space-x-1 shadow-md">
            {isMovie ? <Film className="w-2.5 h-2.5 text-brand-pink mr-1" /> : <Tv className="w-2.5 h-2.5 text-brand-sky mr-1" />}
            {isMovie ? 'Movie' : 'TV'}
          </span>

          {/* Score Badge */}
          {formattedScore && (
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-black flex items-center space-x-1 shadow-md backdrop-blur-md ${
                Number(formattedScore) >= 8.0
                  ? 'bg-brand-emerald text-dark-950 font-black'
                  : Number(formattedScore) >= 7.0
                  ? 'bg-brand-yellow text-dark-950 font-black'
                  : 'bg-dark-950/85 text-slate-200 border border-white/10'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              <span>{formattedScore}</span>
            </span>
          )}
        </div>

        {/* Subtle hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <span className="text-xs text-indigo-400 font-bold tracking-wide">
            View Details →
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between bg-dark-900 border-t border-dark-800/60">
        <div>
          <h3
            title={displayTitle}
            className="text-xs font-bold text-slate-100 line-clamp-2 group-hover:text-indigo-400 transition-colors leading-tight"
          >
            {displayTitle}
          </h3>
        </div>

        <div className="mt-2.5 pt-2 border-t border-dark-800/60 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>{anime.year || (anime.aired?.from ? anime.aired.from.slice(0, 4) : '—')}</span>
          <span className="truncate max-w-[100px] text-right text-slate-300 font-semibold">
            {anime.episodes ? `${anime.episodes} eps` : anime.duration || ''}
          </span>
        </div>
      </div>
    </Link>
  );
}
