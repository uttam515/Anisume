import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Anime } from '@anisume/shared';
import { api } from '../api/client.js';
import AnimeGrid from '../components/AnimeGrid.js';
import Pagination from '../components/Pagination.js';
import { GridSkeleton } from '../components/LoadingSkeleton.js';
import { EmptyState, ErrorState } from '../components/EmptyState.js';
import { Search, X, Film, Tv, Flame } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const typeParam = (searchParams.get('type') || 'all') as 'all' | 'tv' | 'movie';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const [inputVal, setInputVal] = useState(queryParam);
  const [results, setResults] = useState<Anime[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync input value if URL changes externally
  useEffect(() => {
    setInputVal(queryParam);
  }, [queryParam]);

  // Handle typing with debounce
  const handleInputChange = (val: string) => {
    setInputVal(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (val.trim()) {
        next.set('q', val.trim());
      } else {
        next.delete('q');
      }
      next.delete('page');
      setSearchParams(next, { replace: true });
    }, 350);
  };

  const handleClear = () => {
    setInputVal('');
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    next.delete('page');
    setSearchParams(next);
  };

  const handleTypeChange = (type: 'all' | 'tv' | 'movie') => {
    const next = new URLSearchParams(searchParams);
    if (type === 'all') {
      next.delete('type');
    } else {
      next.set('type', type);
    }
    next.delete('page');
    setSearchParams(next);
  };

  // Execute search API request
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    api.getAnimeList({
      q: queryParam,
      type: typeParam,
      page: pageParam,
      limit: 24,
      sort: queryParam ? undefined : 'popularity',
    })
      .then((res) => {
        if (!isCancelled) {
          setResults(res.data);
          setTotalCount(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          const e = err as Error;
          setError(e.message || 'Search failed');
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [queryParam, typeParam, pageParam]);

  const quickSearchTags = [
    'One Piece',
    'MAPPA',
    'Jujutsu Kaisen',
    'Demon Slayer',
    'ufotable',
    'Attack on Titan',
    'Bleach',
    'Monster',
    'Death Note',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Search Header and Input */}
      <div className="max-w-3xl mx-auto text-center space-y-5">
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Find Any Anime in Seconds
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto font-medium">
          Instant multi-field indexing across English, Japanese romaji, kanji titles, and character franchises.
        </p>

        {/* Large Search Input */}
        <div className="relative pt-2">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            autoFocus
            placeholder="Search anime title, studio, or genre..."
            value={inputVal}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full bg-dark-900 border border-dark-800 rounded-2xl pl-12 pr-12 py-4 text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xl transition-all font-medium"
          />
          {inputVal && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white rounded-full transition"
              aria-label="Clear search input"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter chips: All / TV / Movie */}
        <div className="flex items-center justify-center space-x-2 pt-1">
          <button
            onClick={() => handleTypeChange('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
              typeParam === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-dark-900 text-slate-300 hover:text-white border border-dark-800'
            }`}
          >
            All Formats
          </button>
          <button
            onClick={() => handleTypeChange('tv')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black transition-colors ${
              typeParam === 'tv'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-dark-900 text-slate-300 hover:text-white border border-dark-800'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV Series</span>
          </button>
          <button
            onClick={() => handleTypeChange('movie')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black transition-colors ${
              typeParam === 'movie'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-dark-900 text-slate-300 hover:text-white border border-dark-800'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Theatrical Movies</span>
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-bold text-slate-300 mr-1">
            <Flame className="w-3.5 h-3.5 text-brand-orange" />
            Popular:
          </span>
          {quickSearchTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleInputChange(tag)}
              className="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-brand-yellow border border-dark-750 transition-colors font-medium text-[11px]"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#A6A49F] border-b border-[#202825] pb-3 font-medium">
        <span className="font-bold">
          {queryParam ? (
            <>
              Search results for <span className="text-white font-black">"{queryParam}"</span>
            </>
          ) : (
            'Popular Series & Films'
          )}
        </span>
        <span className="font-bold text-indigo-400">{totalCount.toLocaleString()} anime found</span>
      </div>

      {/* Results View */}
      {error ? (
        <ErrorState message={error} onRetry={() => handleInputChange(inputVal)} />
      ) : loading ? (
        <GridSkeleton count={18} />
      ) : results.length === 0 ? (
        <EmptyState
          title={`No anime found matching "${queryParam}"`}
          description="Check your spelling or try searching for another title, studio, or synonym."
          onReset={handleClear}
          resetLabel="Clear Search"
        />
      ) : (
        <div className="space-y-8">
          <AnimeGrid animeList={results} />

          <Pagination
            currentPage={pageParam}
            totalPages={totalPages}
            onPageChange={(p) => {
              const next = new URLSearchParams(searchParams);
              next.set('page', p.toString());
              setSearchParams(next);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}
    </div>
  );
}
