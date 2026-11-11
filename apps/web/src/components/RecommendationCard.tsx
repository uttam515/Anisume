import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Info, Heart, ThumbsDown, Check } from 'lucide-react';
import { libraryApi } from '../api/libraryClient';
import { recommendationClient } from '../api/recommendationClient';
import WatchStatusSelector from './WatchStatusSelector';
import type { RecommendedAnimeItem, WatchStatus } from '@anisume/shared';

interface RecommendationCardProps {
  item: RecommendedAnimeItem;
  onAddedToLibrary?: (malId: number, status: WatchStatus) => void;
  onReviewed?: (
    malId: number,
    action: 'like' | 'dislike' | 'watched',
    replacementItem: RecommendedAnimeItem | null
  ) => void;
  getOnScreenMalIds?: () => number[];
}

export default function RecommendationCard({
  item,
  onAddedToLibrary,
  onReviewed,
  getOnScreenMalIds,
}: RecommendationCardProps) {
  const { anime, scoreBreakdown } = item;
  const navigate = useNavigate();

  const [libraryStatus, setLibraryStatus] = useState<WatchStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [reviewedAction, setReviewedAction] = useState<'like' | 'dislike' | 'watched' | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const displayTitle = anime.title_english || anime.title;
  const imageUrl = anime.images?.webp?.image_url || anime.images?.jpg?.image_url || '';

  const handleCardClick = () => {
    navigate(`/anime/${anime.mal_id}`);
  };

  const handleStatusChange = async (newStatus: WatchStatus | null) => {
    if (!newStatus || loading) return;
    setLoading(true);
    try {
      await libraryApi.addToLibrary({
        mal_id: anime.mal_id,
        status: newStatus,
      });
      setLibraryStatus(newStatus);
      if (onAddedToLibrary) {
        onAddedToLibrary(anime.mal_id, newStatus);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add to watchlist');
    } finally {
      setLoading(false);
    }
  };

  // 1. Heart: Loved it -> record like, learn taste, and replace card
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionLoading || isExiting) return;
    setActionLoading(true);
    setReviewedAction('like');
    setIsExiting(true);

    const onScreenIds = getOnScreenMalIds ? getOnScreenMalIds() : [];
    let replacement: RecommendedAnimeItem | null = null;
    try {
      const res = await recommendationClient.sendFeedback(anime.mal_id, 'like', onScreenIds);
      replacement = res.replacementItem;
    } catch (err) {
      console.error('Failed to submit like feedback:', err);
    }

    setTimeout(() => {
      onReviewed?.(anime.mal_id, 'like', replacement);
    }, 280);
  };

  // 2. Thumbs Down: Dislike -> record dislike, penalize traits, and replace card
  const handleDislike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionLoading || isExiting) return;
    setActionLoading(true);
    setReviewedAction('dislike');
    setIsExiting(true);

    const onScreenIds = getOnScreenMalIds ? getOnScreenMalIds() : [];
    let replacement: RecommendedAnimeItem | null = null;
    try {
      const res = await recommendationClient.sendFeedback(anime.mal_id, 'dislike', onScreenIds);
      replacement = res.replacementItem;
    } catch (err) {
      console.error('Failed to submit dislike feedback:', err);
    }

    setTimeout(() => {
      onReviewed?.(anime.mal_id, 'dislike', replacement);
    }, 280);
  };

  // 3. Tick: Watched -> mark as completed in library, learn taste, and replace card
  const handleWatched = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionLoading || isExiting) return;
    setActionLoading(true);
    setReviewedAction('watched');
    setIsExiting(true);

    const onScreenIds = getOnScreenMalIds ? getOnScreenMalIds() : [];
    let replacement: RecommendedAnimeItem | null = null;
    try {
      const res = await recommendationClient.sendFeedback(anime.mal_id, 'watched', onScreenIds);
      replacement = res.replacementItem;
      onAddedToLibrary?.(anime.mal_id, 'completed');
    } catch (err) {
      console.error('Failed to mark anime as watched:', err);
    }

    setTimeout(() => {
      onReviewed?.(anime.mal_id, 'watched', replacement);
    }, 280);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group bg-dark-900 border border-dark-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between cursor-pointer hover:shadow-indigo-500/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in zoom-in-95 ${
        isExiting ? 'scale-90 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
      }`}
    >
      <div>
        {/* Poster & Top Badges */}
        <div className="aspect-[2/3] w-full relative overflow-hidden bg-dark-950">
          <img
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Top overlay badges */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
            {/* Format badge */}
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-dark-950/85 backdrop-blur-md text-white border border-white/10 shadow-md">
              {anime.type || 'TV'}
            </span>

            {/* Score */}
            {anime.score && (
              <div className="px-2 py-0.5 rounded-md bg-dark-950/85 backdrop-blur-md border border-brand-yellow/30 text-[11px] font-black text-brand-yellow flex items-center space-x-1 shadow-md">
                <Star className="w-3 h-3 fill-brand-yellow text-brand-yellow" />
                <span>{anime.score.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Franchise Continuation Pill (if sequel) */}
          {item.franchiseInfo?.predecessorTitle && (
            <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-xl bg-dark-950/90 backdrop-blur-md border border-indigo-500/40 text-[11px] text-white line-clamp-1 shadow-md">
              <span className="text-indigo-400 font-bold mr-1">Next:</span>
              <span>After {item.franchiseInfo.predecessorTitle}</span>
            </div>
          )}
        </div>

        {/* Content Section - Zero synopsis clutter */}
        <div className="p-3.5 space-y-1.5">
          <h3 className="block text-sm font-extrabold text-white group-hover:text-indigo-400 line-clamp-2 transition-colors leading-snug">
            {displayTitle}
          </h3>

          {/* Metadata Row */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
            <span className="capitalize font-bold text-slate-300">{anime.type || 'Anime'}</span>
            <span>•</span>
            <span>{anime.episodes ? `${anime.episodes} eps` : 'Feature Film'}</span>
            {anime.year && (
              <>
                <span>•</span>
                <span>{anime.year}</span>
              </>
            )}
          </div>

          {/* Genre Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(anime.genres || []).slice(0, 3).map((g) => (
              <span
                key={g.name}
                className="text-[10px] px-2 py-0.5 rounded-md bg-dark-850 text-slate-300 border border-dark-750 font-semibold"
              >
                {g.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer - Structured without any overlapping elements */}
      <div className="p-3.5 pt-0 space-y-2.5" onClick={(e) => e.stopPropagation()}>
        {/* Watch Status Selector - Clean full width bar */}
        <div className="w-full">
          <WatchStatusSelector
            currentStatus={libraryStatus}
            onSelect={handleStatusChange}
            loading={loading}
            size="sm"
            className="w-full"
          />
        </div>

        {/* Feedback Toolbar: Heart (Loved), Thumbs Down (Dislike), Watched (Tick) & Signals */}
        <div className="flex items-center justify-between pt-0.5 border-t border-dark-800/80">
          {/* Feedback Trio */}
          <div className="flex items-center space-x-1.5">
            {/* 1. Loved it (Heart) */}
            <button
              type="button"
              title="Loved it (Learn taste & replace)"
              onClick={handleLike}
              className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                reviewedAction === 'like'
                  ? 'bg-brand-pink/20 border-brand-pink text-brand-pink ring-1 ring-brand-pink/50 shadow-sm'
                  : 'bg-dark-850 hover:bg-dark-800 border-dark-750 text-slate-400 hover:text-brand-pink hover:border-brand-pink/50'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform ${
                  reviewedAction === 'like' ? 'fill-brand-pink text-brand-pink scale-110' : ''
                }`}
              />
            </button>

            {/* 2. Dislike (Thumbs Down) */}
            <button
              type="button"
              title="Dislike (Exclude & replace)"
              onClick={handleDislike}
              className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                reviewedAction === 'dislike'
                  ? 'bg-brand-orange/20 border-brand-orange text-brand-orange ring-1 ring-brand-orange/50 shadow-sm'
                  : 'bg-dark-850 hover:bg-dark-800 border-dark-750 text-slate-400 hover:text-brand-orange hover:border-brand-orange/50'
              }`}
            >
              <ThumbsDown
                className={`w-3.5 h-3.5 transition-transform ${
                  reviewedAction === 'dislike' ? 'fill-brand-orange text-brand-orange scale-110' : ''
                }`}
              />
            </button>

            {/* 3. Watched (Tick) */}
            <button
              type="button"
              title="Watched (Mark completed & replace)"
              onClick={handleWatched}
              className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                reviewedAction === 'watched'
                  ? 'bg-brand-emerald/20 border-brand-emerald text-brand-emerald ring-1 ring-brand-emerald/50 shadow-sm'
                  : 'bg-dark-850 hover:bg-dark-800 border-dark-750 text-slate-400 hover:text-brand-emerald hover:border-brand-emerald/50'
              }`}
            >
              <Check
                className={`w-3.5 h-3.5 transition-transform ${
                  reviewedAction === 'watched' ? 'stroke-[3] scale-110 text-brand-emerald' : ''
                }`}
              />
            </button>
          </div>

          {/* Match Signals Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowBreakdown((v) => !v);
            }}
            className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center space-x-1 py-1.5 px-2 rounded-lg hover:bg-dark-850 transition-colors cursor-pointer"
          >
            <Info className="w-3 h-3 text-brand-sky" />
            <span>{showBreakdown ? 'Hide' : 'Signals'}</span>
          </button>
        </div>

        {/* Score breakdown toggle panel */}
        {showBreakdown && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-3 rounded-xl bg-dark-950 border border-dark-800 text-[10px] space-y-1.5 text-slate-300 animate-in fade-in duration-150"
          >
            <div className="flex justify-between font-medium">
              <span className="text-slate-400">Genre Match:</span>
              <span className="text-indigo-400 font-bold">{scoreBreakdown.genreScore}%</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-400">Theme Match:</span>
              <span className="text-brand-orange font-bold">{scoreBreakdown.themeScore}%</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-400">Favorite Seeds Match:</span>
              <span className="text-brand-yellow font-bold">{scoreBreakdown.favoriteScore}%</span>
            </div>
            {scoreBreakdown.libraryScore !== undefined && scoreBreakdown.libraryScore > 0 && (
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Library Affinity:</span>
                <span className="text-brand-emerald font-bold">+{scoreBreakdown.libraryScore}%</span>
              </div>
            )}
            {scoreBreakdown.negativePenalty !== undefined && scoreBreakdown.negativePenalty > 0 && (
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Avoidance Penalty:</span>
                <span className="text-indigo-400 font-bold">-{scoreBreakdown.negativePenalty}%</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-1 border-t border-dark-800">
              <span className="text-slate-400">Format & Length:</span>
              <span className="text-slate-200">{scoreBreakdown.formatScore}% / {scoreBreakdown.lengthScore}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
