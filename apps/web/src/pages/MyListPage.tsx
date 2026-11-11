import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { UserAnimeListItem, LibraryStats as LibraryStatsType, WatchStatus } from '@anisume/shared';
import { libraryApi } from '../api/libraryClient.js';
import LibraryStats from '../components/LibraryStats.js';
import LibraryAnimeCard from '../components/LibraryAnimeCard.js';
import CustomListsView from '../components/CustomListsView.js';
import Pagination from '../components/Pagination.js';
import { EmptyState, ErrorState } from '../components/EmptyState.js';
import { GridSkeleton } from '../components/LoadingSkeleton.js';
import { WATCH_STATUS_CONFIG } from '../components/WatchStatusSelector.js';
import {
  Search,
  SlidersHorizontal,
  Compass,
  FolderPlus,
} from 'lucide-react';

export default function MyListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = (searchParams.get('status') || 'all') as WatchStatus | 'all';
  const queryParam = searchParams.get('q') || '';
  const sortParam = (searchParams.get('sort') || 'updated') as 'updated' | 'title' | 'rating' | 'score';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const isCustomListsTab = searchParams.get('tab') === 'custom_lists';

  const [items, setItems] = useState<UserAnimeListItem[]>([]);
  const [stats, setStats] = useState<LibraryStatsType | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(queryParam);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  // Load summary statistics
  const loadStats = async () => {
    try {
      const res = await libraryApi.getLibraryStats();
      setStats(res.stats);
    } catch (err) {
      console.error('Failed to load library stats:', err);
    }
  };

  // Load library items
  const loadLibrary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await libraryApi.getLibrary({
        status: statusParam,
        q: queryParam,
        sort: sortParam,
        page: pageParam,
        limit: 18,
      });
      setItems(res.data);
      setTotalCount(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load your anime library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [statusParam, queryParam, sortParam, pageParam]);

  const updateParams = (updates: Record<string, string | number | undefined | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '' || val === 'all') {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });

    if (!('page' in updates)) {
      next.delete('page');
    }

    setSearchParams(next, { replace: true });
  };

  const handleUpdateItem = async (
    malId: number,
    updates: { status?: WatchStatus; episodesWatched?: number; userScore?: number | null }
  ) => {
    try {
      const res = await libraryApi.updateLibraryItem(malId, updates);
      // Update local item
      setItems((prev) =>
        prev.map((it) => (it.mal_id === malId ? { ...it, ...res.data } : it))
      );
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to update library item.');
    }
  };

  const handleRemoveItem = async (malId: number) => {
    try {
      await libraryApi.removeFromLibrary(malId);
      setItems((prev) => prev.filter((it) => it.mal_id !== malId));
      setTotalCount((c) => Math.max(0, c - 1));
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to remove anime from library.');
    }
  };

  const statusTabs: Array<{ id: WatchStatus | 'all'; label: string; count?: number }> = useMemo(() => {
    return [
      { id: 'all', label: 'All Anime', count: stats?.total },
      { id: 'watching', label: 'Watching', count: stats?.watching },
      { id: 'completed', label: 'Completed', count: stats?.completed },
      { id: 'plan_to_watch', label: 'Plan to Watch', count: stats?.plan_to_watch },
      { id: 'on_hold', label: 'On Hold', count: stats?.on_hold },
      { id: 'dropped', label: 'Dropped', count: stats?.dropped },
    ];
  }, [stats]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#202825] pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center space-x-3">
            <span>My Anime Library</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Manage your anime watchlists, track episode progress, and assign personal ratings ({totalCount} {totalCount === 1 ? 'title' : 'titles'} in this view).
          </p>
        </div>

        <Link
          to="/discover"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <Compass className="w-4 h-4" />
          <span>Discover Anime</span>
        </Link>
      </div>

      {/* Summary Statistics */}
      {stats && <LibraryStats stats={stats} />}

      {/* Filter and Search Controls */}
      <div className="space-y-4">
        {/* Watch Status Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-[#202825] scrollbar-thin">
          {statusTabs.map((tab) => {
            const isActive = !isCustomListsTab && statusParam === tab.id;
            const tabConfig = tab.id !== 'all' ? WATCH_STATUS_CONFIG[tab.id as WatchStatus] : null;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => updateParams({ status: tab.id, tab: undefined })}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? tabConfig
                      ? `${tabConfig.bg} ${tabConfig.color} border ${tabConfig.border}`
                      : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-dark-900 border border-dark-800 text-slate-300 hover:text-white hover:bg-dark-850'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-dark-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="h-5 w-px bg-[#202825] mx-1 shrink-0" />

          {/* Custom Lists Tab */}
          <button
            type="button"
            onClick={() => updateParams({ tab: 'custom_lists' })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              isCustomListsTab
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-dark-900 border border-dark-800 text-slate-300 hover:text-white hover:bg-dark-850'
            }`}
          >
            <FolderPlus className={`w-3.5 h-3.5 ${isCustomListsTab ? 'text-white' : 'text-emerald-400'}`} />
            <span>Custom Collections</span>
          </button>
        </div>
      </div>

      {isCustomListsTab ? (
        <CustomListsView />
      ) : (
        <>
          {/* Search Bar + Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search inside library */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateParams({ q: searchInput });
              }}
              className="relative flex-1 max-w-md"
            >
              <Search className="w-4 h-4 text-[#646A67] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Filter by title within your library..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#171D1B] border border-[#202825] text-xs text-[#F3F0E8] placeholder:text-[#646A67] focus:outline-none focus:border-brand-500 transition-colors"
              />
            </form>

            {/* Sort dropdown */}
            <div className="flex items-center space-x-2 shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-[#A6A49F]" />
              <span className="text-xs text-[#A6A49F] font-bold">Sort:</span>
              <select
                value={sortParam}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="px-3 py-2 rounded-xl bg-[#171D1B] border border-[#202825] text-xs text-[#F3F0E8] font-bold focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
              >
                <option value="updated">Recently Updated</option>
                <option value="title">Title (A-Z)</option>
                <option value="rating">Highest Personal Rating</option>
                <option value="score">Highest MAL Score</option>
              </select>
            </div>
          </div>

          {/* Library Anime Grid */}
          {error ? (
            <ErrorState message={error} onRetry={loadLibrary} />
          ) : loading ? (
            <GridSkeleton count={8} />
          ) : items.length === 0 ? (
            <EmptyState
              title={
                queryParam
                  ? `No anime found matching "${queryParam}"`
                  : statusParam !== 'all'
                    ? `No anime in your "${WATCH_STATUS_CONFIG[statusParam as WatchStatus]?.label}" list`
                    : 'Your anime library is empty'
              }
              description={
                queryParam
                  ? 'Try searching with a different title or keyword.'
                  : 'Browse our catalog of thousands of verified anime series and movies to start building your personal watchlist.'
              }
              onReset={() => updateParams({ status: 'all', q: undefined })}
              resetLabel={queryParam ? 'Clear Search' : 'Browse All Anime'}
            />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {items.map((item) => (
                  <LibraryAnimeCard
                    key={item._id}
                    item={item}
                    onUpdate={handleUpdateItem}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={pageParam}
                totalPages={totalPages}
                onPageChange={(p) => {
                  updateParams({ page: p });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
