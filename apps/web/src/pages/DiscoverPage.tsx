import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Anime } from '@anisume/shared';
import { api, type GenreItem } from '../api/client.js';
import AnimeGrid from '../components/AnimeGrid.js';
import Pagination from '../components/Pagination.js';
import { GridSkeleton } from '../components/LoadingSkeleton.js';
import { EmptyState, ErrorState } from '../components/EmptyState.js';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Star,
  Film,
  Tv,
  Check,
} from 'lucide-react';

interface DiscoverPageProps {
  initialType?: 'all' | 'tv' | 'movie';
}

export default function DiscoverPage({ initialType }: DiscoverPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state extraction
  const typeParam = (searchParams.get('type') || initialType || 'all') as 'all' | 'tv' | 'movie';
  const sortParam = (searchParams.get('sort') || 'popularity') as
    | 'popularity'
    | 'highest_rated'
    | 'newest'
    | 'alphabetical';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const minScoreParam = parseFloat(searchParams.get('minScore') || '0');
  const yearParam = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
  const statusParam = searchParams.get('status') || 'all';

  const selectedGenres = useMemo(() => {
    const raw = searchParams.get('genres');
    if (!raw) return [];
    return raw.split(',').map((g) => g.trim()).filter(Boolean);
  }, [searchParams]);

  // Data state
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [genresList, setGenresList] = useState<GenreItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load available genres
  useEffect(() => {
    api.getGenres()
      .then(setGenresList)
      .catch((err) => console.error('Failed to load genres:', err));
  }, [retryCount]);

  // Update query params helper
  const updateParams = (updates: Record<string, string | number | undefined | null>) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '' || val === 'all' || val === 0) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, val.toString());
      }
    });

    if (!('page' in updates)) {
      nextParams.delete('page');
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleGenreToggle = (genreName: string) => {
    const exists = selectedGenres.includes(genreName);
    const updated = exists
      ? selectedGenres.filter((g) => g !== genreName)
      : [...selectedGenres, genreName];

    updateParams({
      genres: updated.length > 0 ? updated.join(',') : undefined,
    });
  };

  const handleResetFilters = () => {
    const next = new URLSearchParams();
    if (initialType && initialType !== 'all') {
      next.set('type', initialType);
    }
    setSearchParams(next);
  };

  // Fetch anime list whenever search params change
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    api.getAnimeList({
      page: pageParam,
      limit: 24,
      type: typeParam,
      sort: sortParam,
      genres: selectedGenres,
      minScore: minScoreParam > 0 ? minScoreParam : undefined,
      year: yearParam,
      status: statusParam,
    })
      .then((res) => {
        if (!isCancelled) {
          setAnimeList(res.data);
          setTotalCount(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          const e = err as Error;
          setError(e.message || 'Failed to fetch anime catalog');
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [typeParam, sortParam, pageParam, minScoreParam, yearParam, statusParam, selectedGenres, retryCount]);

  const hasActiveFilters =
    (typeParam !== 'all' && typeParam !== initialType) ||
    selectedGenres.length > 0 ||
    minScoreParam > 0 ||
    yearParam !== undefined ||
    statusParam !== 'all' ||
    sortParam !== 'popularity';

  const yearsOptions = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2018, 2016, 2014, 2012, 2010, 2005, 2000, 1998];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-dark-800">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {initialType === 'movie' ? 'Feature Films & Theatrical Movies' : 'Discover Anime Universe'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            {loading ? 'Searching universe...' : `${totalCount.toLocaleString()} anime verified across seasons, genres & archives`}
          </p>
        </div>

        {/* Filter Toggle on Mobile + Sort Dropdown */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-dark-900 border border-dark-800 text-slate-200 text-xs font-bold hover:bg-dark-850 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            )}
          </button>

          {/* Sort selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 hidden sm:inline font-bold">Sort:</span>
            <select
              value={sortParam}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="bg-dark-900 border border-dark-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="popularity">Most Popular</option>
              <option value="highest_rated">Highest Rated</option>
              <option value="newest">Newest First</option>
              <option value="alphabetical">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 space-y-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar shadow-xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-dark-800">
              <div className="flex items-center space-x-2 text-sm font-black text-white">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Filters</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center space-x-1 text-[11px] font-bold text-indigo-400 hover:underline transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              )}
            </div>

            {/* Format / Type */}
            {!initialType && (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Format</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-dark-950 rounded-xl border border-dark-800">
                  <button
                    onClick={() => updateParams({ type: undefined })}
                    className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                      typeParam === 'all'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => updateParams({ type: 'tv' })}
                    className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1 ${
                      typeParam === 'tv'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Tv className="w-3 h-3" />
                    <span>TV</span>
                  </button>
                  <button
                    onClick={() => updateParams({ type: 'movie' })}
                    className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1 ${
                      typeParam === 'movie'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-3 h-3" />
                    <span>Movie</span>
                  </button>
                </div>
              </div>
            )}

            {/* Minimum Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-300 uppercase tracking-wider">Min Score</span>
                <span className="text-brand-yellow font-black">{minScoreParam > 0 ? `${minScoreParam}+` : 'Any'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 7.0, 8.0, 8.5].map((score) => (
                  <button
                    key={score}
                    onClick={() => updateParams({ minScore: score > 0 ? score : undefined })}
                    className={`py-2 rounded-xl text-xs font-black border transition-all flex items-center justify-center space-x-1 ${
                      minScoreParam === score
                        ? 'bg-brand-yellow/20 text-brand-yellow border-brand-yellow/40 shadow-sm'
                        : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {score > 0 && <Star className="w-3 h-3 fill-current" />}
                    <span>{score > 0 ? `${score}` : 'Any'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Release Year */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Release Year</label>
              <select
                value={yearParam || ''}
                onChange={(e) => updateParams({ year: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Broadcast Years</option>
                {yearsOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Airing Status */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Airing Status</label>
              <select
                value={statusParam}
                onChange={(e) => updateParams({ status: e.target.value })}
                className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="Finished Airing">Finished Airing</option>
                <option value="Currently Airing">Currently Airing</option>
                <option value="Not yet aired">Not Yet Aired</option>
              </select>
            </div>

            {/* Genres Multi-Select */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-300 uppercase tracking-wider">Genres & Themes</span>
                {selectedGenres.length > 0 && (
                  <span className="text-indigo-400 text-[11px] font-black">{selectedGenres.length} active</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
                {genresList.map((g) => {
                  const isSelected = selectedGenres.includes(g.name);
                  return (
                    <button
                      key={g.name}
                      onClick={() => handleGenreToggle(g.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25'
                          : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{g.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Filter Drawer Modal */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm"
              onClick={() => setMobileFilterOpen(false)}
            />

            {/* Slideout Panel */}
            <div className="relative ml-auto w-full max-w-xs h-full bg-dark-900 border-l border-dark-800 p-6 overflow-y-auto flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-dark-800">
                  <h3 className="font-black text-white text-base">Filter Catalog</h3>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Type */}
                {!initialType && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">Format</label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-dark-950 rounded-xl border border-dark-800">
                      <button
                        onClick={() => updateParams({ type: undefined })}
                        className={`py-2 text-xs font-bold rounded-lg ${
                          typeParam === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => updateParams({ type: 'tv' })}
                        className={`py-2 text-xs font-bold rounded-lg ${
                          typeParam === 'tv' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        TV
                      </button>
                      <button
                        onClick={() => updateParams({ type: 'movie' })}
                        className={`py-2 text-xs font-bold rounded-lg ${
                          typeParam === 'movie' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        Movie
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile Genres */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">Genres</label>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                    {genresList.map((g) => (
                      <button
                        key={g.name}
                        onClick={() => handleGenreToggle(g.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          selectedGenres.includes(g.name)
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-dark-950 border-dark-800 text-slate-400'
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Year */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">Release Year</label>
                  <select
                    value={yearParam || ''}
                    onChange={(e) => updateParams({ year: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-xs text-slate-200 font-bold"
                  >
                    <option value="">All Years</option>
                    {yearsOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="pt-6 border-t border-dark-800 space-y-2">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-3 rounded-xl font-black text-xs bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                >
                  Apply Filters
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      handleResetFilters();
                      setMobileFilterOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Anime Grid & Pagination Content Area */}
        <main className="lg:col-span-3">
          {error ? (
            <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
          ) : loading ? (
            <GridSkeleton count={18} />
          ) : animeList.length === 0 ? (
            <EmptyState
              title="No anime match your filters"
              description="Try relaxing your minimum score or clearing some genres to see more titles."
              onReset={handleResetFilters}
            />
          ) : (
            <>
              <AnimeGrid animeList={animeList} />

              <Pagination
                currentPage={pageParam}
                totalPages={totalPages}
                onPageChange={(p) => updateParams({ page: p })}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
