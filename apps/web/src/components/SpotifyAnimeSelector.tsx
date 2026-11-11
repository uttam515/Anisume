import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Check,
  X,
  Flame,
  Loader2,
  Star,
} from 'lucide-react';
import { recommendationClient } from '../api/recommendationClient';
import { api } from '../api/client';
import type { Anime } from '@anisume/shared';

interface GridAnimeCard {
  anime: Anime;
  isInserted?: boolean;
  insertedForMalId?: number;
  insertIndex?: number;
  idKey: string;
}

interface SpotifyAnimeSelectorProps {
  selectedIds: number[];
  onChange: (newIds: number[]) => void;
  starters: Anime[];
}

// Deterministically vary the number of recommendations (2, 3, or 4) per anime
function getInsertCount(malId: number): number {
  return 2 + (Math.abs(malId * 7 + 1) % 3);
}

// Asynchronously warm image cache without blocking UI rendering
function warmImageCache(url: string) {
  if (!url) return;
  const img = new Image();
  img.src = url;
}

export default function SpotifyAnimeSelector({
  selectedIds,
  onChange,
  starters,
}: SpotifyAnimeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [searching, setSearching] = useState(false);
  const [gridCards, setGridCards] = useState<GridAnimeCard[]>([]);
  const [selectedAnimeMap, setSelectedAnimeMap] = useState<Map<number, { title: string; image: string }>>(new Map());

  // In-memory cache for instant 0ms responses
  const similarityCache = useRef<Map<number, Anime[]>>(new Map());

  // Initialize selected anime metadata map from starters
  useEffect(() => {
    const nextMap = new Map(selectedAnimeMap);
    starters.forEach((a) => {
      if (selectedIds.includes(a.mal_id) && !nextMap.has(a.mal_id)) {
        nextMap.set(a.mal_id, {
          title: a.title_english || a.title,
          image: a.images?.webp?.image_url || a.images?.jpg?.image_url || '',
        });
      }
    });
    setSelectedAnimeMap(nextMap);
  }, [starters, selectedIds]);

  // Aggressive background pre-fetch for starters for instant 0ms interactions
  useEffect(() => {
    if (!starters || starters.length === 0) return;
    const starterSlice = starters.slice(0, 18);
    starterSlice.forEach(async (anime) => {
      if (!similarityCache.current.has(anime.mal_id)) {
        try {
          const res = await recommendationClient.getSimilarAnime(anime.mal_id, 10);
          const list = res.similar.map((s: any) => s.anime);
          similarityCache.current.set(anime.mal_id, list);
          list.forEach((sim) => {
            const url = sim.images?.webp?.image_url || sim.images?.jpg?.image_url;
            if (url) warmImageCache(url);
          });
        } catch {
          // Silently ignore background prefetch errors
        }
      }
    });
  }, [starters]);

  // Sync gridCards when starters or searchResults change
  useEffect(() => {
    if (searchQuery.trim()) {
      setGridCards(
        searchResults.map((anime) => ({
          anime,
          idKey: `search-${anime.mal_id}`,
        }))
      );
    } else {
      setGridCards((prev) => {
        if (prev.length > 0 && !searchQuery.trim()) {
          return prev;
        }
        return starters.map((anime) => ({
          anime,
          idKey: `starter-${anime.mal_id}`,
        }));
      });
    }
  }, [starters, searchResults, searchQuery]);

  // Handle anime title search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.getAnimeList({ q: searchQuery.trim(), limit: 18 });
        setSearchResults(res.data);
      } catch (err) {
        console.error('Search error in taste onboarding:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle clicking an anime card in the grid
  const handleToggleSelect = async (anime: Anime) => {
    const malId = anime.mal_id;
    const isSelected = selectedIds.includes(malId);
    const animeTitle = anime.title_english || anime.title;

    if (isSelected) {
      // 1. DESELECT: Remove from selection and collapse inserted items
      const nextSelected = selectedIds.filter((id) => id !== malId);
      onChange(nextSelected);

      setSelectedAnimeMap((prev) => {
        const next = new Map(prev);
        next.delete(malId);
        return next;
      });

      // Remove inserted children from grid (unless explicitly selected by user)
      setGridCards((prev) =>
        prev.filter((card) => {
          if (card.insertedForMalId === malId) {
            return nextSelected.includes(card.anime.mal_id);
          }
          return true;
        })
      );
    } else {
      // 2. SELECT: Add to selection and insert variable similar anime inline
      if (selectedIds.length >= 20) {
        alert('You have reached the maximum of 20 favorite seed titles.');
        return;
      }

      const nextSelected = [...selectedIds, malId];
      onChange(nextSelected);

      setSelectedAnimeMap((prev) => {
        const next = new Map(prev);
        next.set(malId, {
          title: animeTitle,
          image: anime.images?.webp?.image_url || anime.images?.jpg?.image_url || '',
        });
        return next;
      });

      const countToInsert = getInsertCount(malId);

      // STRICT EXCLUSION:
      // Exclude all anime that are currently selected (including this newly selected one)
      // and all anime currently in the grid.
      const allExcludeSet = new Set<number>([
        ...nextSelected,
        ...gridCards.map((c) => c.anime.mal_id),
      ]);

      try {
        let candidateList: Anime[] = [];
        if (similarityCache.current.has(malId)) {
          const cached = similarityCache.current.get(malId)!;
          // Filter out any anime that are ALREADY SELECTED or already present in the grid
          candidateList = cached.filter((a) => !allExcludeSet.has(a.mal_id));
        }

        // If not enough cached candidates remain, fetch more from API
        if (candidateList.length < countToInsert) {
          const excludeArray = Array.from(allExcludeSet);
          const res = await recommendationClient.getSimilarAnime(
            malId,
            countToInsert + 6,
            excludeArray
          );
          const fetched = res.similar.map((s: any) => s.anime);
          
          // Save all fetched in cache
          const existing = similarityCache.current.get(malId) || [];
          similarityCache.current.set(malId, [...existing, ...fetched]);

          // Filter strictly: NEVER include already selected anime
          candidateList = fetched.filter((a) => !allExcludeSet.has(a.mal_id));
        }

        const toInsert = candidateList.slice(0, countToInsert);
        if (toInsert.length === 0) return;

        // Warm image cache asynchronously in background (non-blocking)
        toInsert.forEach((sim) => {
          const url = sim.images?.webp?.image_url || sim.images?.jpg?.image_url;
          if (url) warmImageCache(url);
        });

        const realCards: GridAnimeCard[] = toInsert.map((sim, i) => ({
          anime: sim,
          isInserted: true,
          insertedForMalId: malId,
          insertIndex: i,
          idKey: `inserted-${malId}-${sim.mal_id}`,
        }));

        // Immediately update gridCards — starts the spring animation with zero latency!
        setGridCards((current) => {
          const idx = current.findIndex((c) => c.anime.mal_id === malId);
          if (idx === -1) return current;

          // Remove any previous temporary insertions for this malId
          const filtered = current.filter((c) => c.insertedForMalId !== malId);
          const insertAt = filtered.findIndex((c) => c.anime.mal_id === malId) + 1;
          const updated = [...filtered];
          updated.splice(insertAt, 0, ...realCards);
          return updated;
        });
      } catch (err) {
        console.error('Error fetching similar anime inline:', err);
      }
    }
  };

  const handleRemoveSelection = (malId: number) => {
    const nextSelected = selectedIds.filter((id) => id !== malId);
    onChange(nextSelected);

    setSelectedAnimeMap((prev) => {
      const next = new Map(prev);
      next.delete(malId);
      return next;
    });

    setGridCards((prev) =>
      prev.filter((card) => {
        if (card.insertedForMalId === malId) {
          return nextSelected.includes(card.anime.mal_id);
        }
        return true;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Sticky Selected Anime Seeds Bar */}
      <div className="bg-dark-950/90 border border-brand-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md sticky top-4 z-20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-brand-orange" />
            <span className="text-xs font-bold text-white">Your Selected Anime Seeds</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30">
              {selectedIds.length} anime selected
            </span>
          </div>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onChange([]);
                setSelectedAnimeMap(new Map());
                setGridCards((prev) => prev.filter((c) => !c.isInserted));
              }}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {selectedIds.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            Select 5 or more anime you love. Whenever you select an anime, new similar anime will appear right beside it in the grid!
          </p>
        ) : (
          <motion.div layout className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {selectedIds.map((id) => {
                const info = selectedAnimeMap.get(id);
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-dark-850 border border-brand-500/40 text-slate-200 text-xs shrink-0"
                  >
                    {info?.image && (
                      <img
                        src={info.image}
                        alt=""
                        className="w-5 h-5 rounded-md object-cover"
                      />
                    )}
                    <span className="font-medium max-w-[140px] truncate text-slate-200">
                      {info?.title || `MAL #${id}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSelection(id)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any anime to select and reveal matching recommendations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-dark-750 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
          {searching && (
            <Loader2 className="w-4 h-4 text-brand-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-300">
            {searchQuery.trim()
              ? `Search Results for "${searchQuery}"`
              : 'Popular Anime to Start With (Click any to expand similar anime inline)'}
          </span>
          <span className="text-[11px] text-brand-400 font-medium">
            ✨ Inline Spotify-style expansion
          </span>
        </div>
      </div>

      {/* Unified Anime Grid with Spotify FLIP Layout & Spring Physics */}
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {gridCards.map((card) => {
            const { anime, isInserted, insertIndex = 0 } = card;
            const isSelected = selectedIds.includes(anime.mal_id);
            const title = anime.title_english || anime.title;
            const img =
              anime.images?.webp?.image_url ||
              anime.images?.jpg?.image_url ||
              '';

            return (
              <motion.button
                key={anime.mal_id}
                layout
                type="button"
                onClick={() => handleToggleSelect(anime)}
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.02 }}
                initial={isInserted ? { scale: 0.2, opacity: 0, y: 15 } : false}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.2, opacity: 0, transition: { duration: 0.18 } }}
                transition={{
                  layout: {
                    type: 'spring',
                    stiffness: 350,
                    damping: 28,
                  },
                  scale: {
                    type: 'spring',
                    stiffness: 420,
                    damping: 24,
                    delay: isInserted ? insertIndex * 0.05 : 0,
                  },
                  opacity: {
                    duration: 0.2,
                    delay: isInserted ? insertIndex * 0.05 : 0,
                  },
                }}
                className={`group relative text-left rounded-2xl overflow-hidden border p-2 flex flex-col justify-between transition-colors duration-200 ${
                  isSelected
                    ? 'bg-brand-500/20 border-brand-500 shadow-xl shadow-brand-500/30 ring-2 ring-brand-500/60'
                    : isInserted
                    ? 'bg-dark-900 border-brand-500/50 hover:border-brand-400 shadow-lg shadow-brand-500/10'
                    : 'bg-dark-900 hover:bg-dark-850 border-dark-800 hover:border-brand-500/40'
                }`}
              >
                <div className="space-y-2">
                  {/* Poster Container */}
                  <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-dark-950 relative">
                    {img ? (
                      <img
                        src={img}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="eager"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                        No Image
                      </div>
                    )}

                    {/* Selected Checkmark Overlay with Spotify Spring Pop */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="absolute inset-0 bg-indigo-600/60 backdrop-blur-[2px] flex items-center justify-center text-white"
                        >
                          <motion.div
                            initial={{ scale: 0, rotate: -25 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 25 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                            className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-lg"
                          >
                            <Check className="w-5 h-5 stroke-[3]" />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* MAL Score Badge */}
                    {anime.score && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-brand-yellow/30 text-[10px] font-black text-brand-yellow flex items-center space-x-1">
                        <Star className="w-2.5 h-2.5 fill-brand-yellow text-brand-yellow" />
                        <span>{anime.score.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Title and metadata */}
                  <div className="px-0.5 space-y-1">
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1 group-hover:text-brand-300 transition-colors">
                      {title}
                    </h4>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <span className="capitalize">{anime.type}</span>
                      {anime.year && (
                        <>
                          <span>•</span>
                          <span>{anime.year}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
