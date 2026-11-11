import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { UserAnimeListItem, WatchStatus } from '@anisume/shared';
import WatchStatusSelector from './WatchStatusSelector.js';
import EpisodeProgressControl from './EpisodeProgressControl.js';
import PersonalRating from './PersonalRating.js';
import { Trash2, Star, Calendar, Film, Tv } from 'lucide-react';

interface LibraryAnimeCardProps {
  item: UserAnimeListItem;
  onUpdate: (
    malId: number,
    updates: { status?: WatchStatus; episodesWatched?: number; userScore?: number | null }
  ) => Promise<void>;
  onRemove: (malId: number) => Promise<void>;
}

export default function LibraryAnimeCard({ item, onUpdate, onRemove }: LibraryAnimeCardProps) {
  const [loading, setLoading] = useState(false);
  const anime = item.anime;

  if (!anime) return null;

  const displayTitle = anime.title_english || anime.title;
  const imageUrl = anime.images?.webp?.image_url || anime.images?.jpg?.image_url || '';
  const isMovie = anime.type?.toLowerCase() === 'movie';

  const handleStatusChange = async (newStatus: WatchStatus) => {
    setLoading(true);
    try {
      await onUpdate(item.mal_id, { status: newStatus });
    } finally {
      setLoading(false);
    }
  };

  const handleProgressChange = async (newWatched: number) => {
    setLoading(true);
    try {
      await onUpdate(item.mal_id, { episodesWatched: newWatched });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = async (newScore: number | null) => {
    setLoading(true);
    try {
      await onUpdate(item.mal_id, { userScore: newScore });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (window.confirm(`Remove "${displayTitle}" from your library?`)) {
      setLoading(true);
      try {
        await onRemove(item.mal_id);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-[#14191D] border border-[#252E37] hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col sm:flex-row group">
      {/* Anime Poster Thumbnail */}
      <Link
        to={`/anime/${item.mal_id}`}
        className="w-full sm:w-36 md:w-44 shrink-0 relative overflow-hidden bg-[#0D100F] block self-stretch"
      >
        <img
          src={imageUrl}
          alt={displayTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 min-h-[220px] sm:min-h-full"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14191D]/80 via-transparent to-transparent sm:hidden" />

        {/* Format Badge */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/85 backdrop-blur-md text-white border border-white/10 flex items-center space-x-1 shadow-md">
          {isMovie ? <Film className="w-3 h-3 text-brand-pink" /> : <Tv className="w-3 h-3 text-brand-sky" />}
          <span>{isMovie ? 'Movie' : anime.type || 'TV'}</span>
        </div>
      </Link>

      {/* Card Body & Controls */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        {/* Top Header: Title, Score & Remove */}
        <div>
          <div className="flex items-start justify-between gap-2.5">
            <Link
              to={`/anime/${item.mal_id}`}
              className="text-sm sm:text-base font-extrabold text-[#FAF3E0] hover:text-indigo-400 line-clamp-1 transition-colors leading-snug"
              title={displayTitle}
            >
              {displayTitle}
            </Link>

            <button
              type="button"
              disabled={loading}
              onClick={handleRemove}
              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-[#1C2329] transition-colors shrink-0"
              title="Remove from Library"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Subtitle / Metadata Row */}
          <div className="flex items-center space-x-2.5 text-[11px] text-slate-400 mt-1">
            {anime.score && (
              <span className="flex items-center space-x-1 text-brand-yellow font-black">
                <Star className="w-3 h-3 fill-brand-yellow" />
                <span>{anime.score.toFixed(1)}</span>
              </span>
            )}
            <span>•</span>
            <span>{anime.year || (anime.aired?.from ? anime.aired.from.slice(0, 4) : 'TV')}</span>
            <span>•</span>
            <span>{anime.episodes ? `${anime.episodes} eps` : 'Feature Film'}</span>
          </div>
        </div>

        {/* Middle Deck: Watch Status (Full width) */}
        <div className="pt-2.5 border-t border-[#252E37] space-y-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            Watch Status
          </span>
          <WatchStatusSelector
            currentStatus={item.status}
            onSelect={handleStatusChange}
            loading={loading}
            size="sm"
            className="w-full"
          />
        </div>

        {/* Episode Progress (Full width so stepper and badge never overflow) */}
        <div className="pt-2.5 border-t border-[#252E37] space-y-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            {isMovie ? 'Format' : 'Progress'}
          </span>
          <EpisodeProgressControl
            episodesWatched={item.episodesWatched}
            totalEpisodes={anime.episodes || null}
            isMovie={isMovie}
            onChange={handleProgressChange}
            loading={loading}
            showSlider={false}
          />
        </div>

        {/* Bottom Tier: Personal Rating & Updated Timestamp */}
        <div className="pt-2.5 border-t border-[#252E37] space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              My Rating
            </span>
            <div className="text-[10px] text-slate-500 flex items-center space-x-1 shrink-0">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <PersonalRating
            score={item.userScore}
            onChange={handleScoreChange}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
