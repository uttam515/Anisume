import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Flame,
  RotateCw,
  Sliders,
  Tv,
  Film,
  Compass,
  PlayCircle,
  Heart,
  Gem,
  Award,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ThumbsUp,
  BookOpen,
  Layers,
} from 'lucide-react';
import { recommendationClient } from '../api/recommendationClient';
import RecommendationCard from '../components/RecommendationCard';
import Pagination from '../components/Pagination';
import { GridSkeleton } from '../components/LoadingSkeleton';
import { ErrorState, EmptyState } from '../components/EmptyState';
import type {
  RecommendedAnimeItem,
  RecommendationCategory,
  RecommendationProfileResponse,
  RecommendationSet,
} from '@anisume/shared';

export default function RecommendationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const typeParam = (searchParams.get('type') || 'all') as 'all' | 'tv' | 'movie';
  const categoryParam = (searchParams.get('category') || 'all_sets') as RecommendationCategory | 'all_sets';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const [items, setItems] = useState<RecommendedAnimeItem[]>([]);
  const [recommendationSets, setRecommendationSets] = useState<RecommendationSet[]>([]);
  const [profile, setProfile] = useState<RecommendationProfileResponse | null>(null);
  const [showTasteDrawer, setShowTasteDrawer] = useState(false);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(true);
  const [prefsSummary, setPrefsSummary] = useState<{
    genresCount: number;
    themesCount: number;
    favoritesCount: number;
    negativeGenresCount: number;
  }>({ genresCount: 0, themesCount: 0, favoritesCount: 0, negativeGenresCount: 0 });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recommendations
  const loadRecommendations = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      if (categoryParam === 'all_sets') {
        // Fetch all diverse sets in parallel (blazing fast)
        const catRes = await recommendationClient.getCategorizedRecommendations();
        setQuestionnaireCompleted(catRes.meta.questionnaireCompleted);
        setRecommendationSets(catRes.sets || []);
        setItems(catRes.recommendedForYou || []);
        setTotal(catRes.recommendedForYou?.length || 0);
        setTotalPages(1);
      } else if (categoryParam === 'continue_journey' || categoryParam === 'because_you_liked') {
        const catRes = await recommendationClient.getCategorizedRecommendations();
        setQuestionnaireCompleted(catRes.meta.questionnaireCompleted);

        if (categoryParam === 'continue_journey') {
          const journeyItems = catRes.continueYourJourney.map((c) => c.item);
          setItems(journeyItems);
          setTotal(journeyItems.length);
          setTotalPages(1);
        } else if (categoryParam === 'because_you_liked') {
          const likedItems = catRes.becauseYouLiked.flatMap((b) => b.items);
          setItems(likedItems);
          setTotal(likedItems.length);
          setTotalPages(1);
        }
      } else {
        const res = await recommendationClient.getRecommendations({
          type: typeParam,
          category: categoryParam,
          page: pageParam,
          limit: 18,
        });

        setItems(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setQuestionnaireCompleted(res.meta.questionnaireCompleted);
        setPrefsSummary(res.meta.preferencesSummary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load taste profile signals
  useEffect(() => {
    recommendationClient
      .getProfile()
      .then(setProfile)
      .catch((err) => console.error('Failed to load profile signals:', err));
  }, [refreshing]);

  useEffect(() => {
    loadRecommendations();
  }, [typeParam, categoryParam, pageParam]);

  const updateCategory = (newCat: RecommendationCategory | 'all_sets') => {
    const next = new URLSearchParams(searchParams);
    if (newCat === 'all_sets') next.delete('category');
    else next.set('category', newCat);
    next.delete('page');
    setSearchParams(next);
  };

  const updateType = (newType: 'all' | 'tv' | 'movie') => {
    const next = new URLSearchParams(searchParams);
    if (newType === 'all') next.delete('type');
    else next.set('type', newType);
    next.delete('page');
    setSearchParams(next);
  };

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getOnScreenMalIds = (): number[] => {
    const ids = new Set<number>();
    items.forEach((it) => ids.add(it.anime.mal_id));
    recommendationSets.forEach((s) => s.items.forEach((it) => ids.add(it.anime.mal_id)));
    return Array.from(ids);
  };

  const handleAnimeReviewed = (
    malId: number,
    _action: 'like' | 'dislike' | 'watched',
    replacementItem: RecommendedAnimeItem | null
  ) => {
    // 1. Update flat items list with replacement or filter out
    setItems((prev) => {
      if (replacementItem) {
        return prev.map((item) => (item.anime.mal_id === malId ? replacementItem : item));
      }
      return prev.filter((item) => item.anime.mal_id !== malId);
    });

    if (!replacementItem) {
      setTotal((prev) => Math.max(0, prev - 1));
    }

    // 2. Update recommendation sets (diverse rows)
    setRecommendationSets((prevSets) =>
      prevSets
        .map((set) => {
          const hasItem = set.items.some((i) => i.anime.mal_id === malId);
          if (!hasItem) return set;
          if (replacementItem) {
            return {
              ...set,
              items: set.items.map((i) => (i.anime.mal_id === malId ? replacementItem : i)),
            };
          }
          return {
            ...set,
            items: set.items.filter((i) => i.anime.mal_id !== malId),
          };
        })
        .filter((set) => set.items.length > 0)
    );
  };

  const categories: Array<{ id: RecommendationCategory | 'all_sets'; label: string; icon: any }> = [
    { id: 'all_sets', label: 'All Sets & Feeds', icon: Layers },
    { id: 'for_you', label: 'Recommended For You', icon: Compass },
    { id: 'continue_journey', label: 'Continue Your Journey', icon: PlayCircle },
    { id: 'because_you_liked', label: 'Because You Liked', icon: Heart },
    { id: 'hidden_gems', label: 'Hidden Gems', icon: Gem },
    { id: 'top_rated', label: 'Masterpieces', icon: Award },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-800 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-red/15 text-brand-red border border-brand-red/30 text-xs font-black uppercase tracking-wider mb-2">
            <Flame className="w-3.5 h-3.5 text-brand-yellow" />
            <span>推薦 • Sensory Taste Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center space-x-3">
            <span>Personalized For You</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            {questionnaireCompleted ? (
              <span>
                Continuous scoring calibrated across{' '}
                <strong className="text-slate-200">{prefsSummary.genresCount || profile?.topGenres.length || 0} genres</strong>,{' '}
                <strong className="text-slate-200">{prefsSummary.themesCount || profile?.topThemes.length || 0} themes</strong>
                {(prefsSummary.negativeGenresCount > 0 || (profile?.negativeGenres && profile.negativeGenres.length > 0)) && (
                  <span>
                    , with <strong className="text-brand-red">{prefsSummary.negativeGenresCount || profile?.negativeGenres.length} avoided</strong>
                  </span>
                )}
                . React to evolve in real-time.
              </span>
            ) : (
              <span>Curated recommendation algorithm matching your taste and discovery signals.</span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowTasteDrawer((v) => !v)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-dark-900 hover:bg-dark-850 border border-dark-800 text-slate-300 hover:text-white flex items-center space-x-2 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-brand-sky" />
            <span>Signals & Penalties</span>
            {showTasteDrawer ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </button>

          <button
            type="button"
            onClick={() => loadRecommendations(true)}
            disabled={loading || refreshing}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-dark-900 hover:bg-dark-850 border border-dark-800 text-slate-300 hover:text-white flex items-center space-x-2 transition cursor-pointer"
            title="Refresh recommendation calculations"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-red' : ''}`} />
            <span>Recalculate</span>
          </button>

          <Link
            to="/questionnaire"
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-brand-red hover:bg-red-700 text-white shadow-md shadow-brand-red/20 flex items-center space-x-2 transition cursor-pointer"
          >
            <span>Retake Quiz</span>
          </Link>
        </div>
      </div>

      {/* Taste & Negative Signals Drawer */}
      {showTasteDrawer && profile && (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-dark-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-brand-400" />
              <span>Learned Recommendation Profile & Signals</span>
            </h3>
            <span className="text-xs text-slate-500">Updated in real-time</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Positive Taste Signals */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Positive Taste Signals</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.positiveTasteSignals?.length > 0 ? (
                  profile.positiveTasteSignals.map((signal, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                    >
                      {signal}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Rate anime 8-10★ or pick favorite genres</span>
                )}
              </div>
            </div>

            {/* Negative Taste Signals & Penalties */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Negative Signals (Penalized/Avoided)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.negativeTasteSignals?.length > 0 ? (
                  profile.negativeTasteSignals.map((signal, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-800/40"
                    >
                      {signal}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">No negative signals recorded yet</span>
                )}
              </div>
            </div>

            {/* Library Learned Stats */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-brand-400 uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Library Watch Learning</span>
              </div>
              <div className="bg-dark-950/60 rounded-xl p-3 border border-dark-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed Titles:</span>
                  <span className="font-bold text-white">{profile.libraryLearnedStats?.completedCount ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dropped (Penalized):</span>
                  <span className="font-bold text-rose-400">{profile.libraryLearnedStats?.droppedCount ?? 0}</span>
                </div>
                {profile.libraryLearnedStats?.averagePersonalScore && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Average Rating:</span>
                    <span className="font-bold text-amber-400">{profile.libraryLearnedStats.averagePersonalScore}★</span>
                  </div>
                )}
                {profile.libraryLearnedStats?.topCompletedGenres?.length > 0 && (
                  <div className="pt-1 border-t border-dark-800/60 flex justify-between">
                    <span className="text-slate-400">Top Genres:</span>
                    <span className="text-slate-200">
                      {profile.libraryLearnedStats.topCompletedGenres.slice(0, 3).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Notice Banner (if questionnaire not completed) */}
      {!questionnaireCompleted && (
        <div className="bg-gradient-to-r from-brand-900/40 via-dark-900 to-dark-900 border border-brand-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-brand-300 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4" />
              <span>Taste Questionnaire Available</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Fine-tune your recommendations in 1 minute
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Answer quick questions, pick seeds, and avoid unwanted genres to unlock hyper-personalized recommendations.
            </p>
          </div>

          <Link
            to="/questionnaire"
            className="px-5 py-2.5 rounded-xl bg-brand-red hover:bg-red-700 text-white text-xs font-black transition shadow-md shadow-brand-red/20 shrink-0 self-start sm:self-auto"
          >
            Start Questionnaire
          </Link>
        </div>
      )}

      {/* Category Navigation Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = categoryParam === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateCategory(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-red text-white shadow-md shadow-brand-red/25 ring-2 ring-brand-red/40'
                  : 'bg-dark-900 border border-dark-800 text-slate-300 hover:text-white hover:bg-dark-850'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar (Format TV / Movie) for standard single-feed categories */}
      {categoryParam !== 'all_sets' && categoryParam !== 'continue_journey' && categoryParam !== 'because_you_liked' && (
        <div className="flex items-center space-x-2 border-b border-dark-800 pb-3">
          <button
            type="button"
            onClick={() => updateType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              typeParam === 'all'
                ? 'bg-dark-800 text-white border border-brand-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Formats ({total})
          </button>

          <button
            type="button"
            onClick={() => updateType('tv')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              typeParam === 'tv'
                ? 'bg-dark-800 text-white border border-brand-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV Series</span>
          </button>

          <button
            type="button"
            onClick={() => updateType('movie')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              typeParam === 'movie'
                ? 'bg-dark-800 text-white border border-brand-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Feature Movies</span>
          </button>
        </div>
      )}

      {/* Recommendations Display */}
      {error ? (
        <ErrorState message={error} onRetry={() => loadRecommendations()} />
      ) : loading ? (
        <GridSkeleton count={12} />
      ) : categoryParam === 'all_sets' ? (
        /* DIVERSE MULTI-SET EXPERIENCE (e.g. "Because You Liked Death Note", "Because You Love Shounen", etc.) */
        <div className="space-y-12">
          {recommendationSets.length === 0 ? (
            <EmptyState
              title="No recommendations generated"
              description="Complete the onboarding questionnaire to unlock personalized sets."
              onReset={() => updateCategory('for_you')}
              resetLabel="Show All Recommendations"
            />
          ) : (
            recommendationSets.map((set) => (
              <div key={set.id} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 border-b border-dark-800/80 pb-2.5">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
                      <span>{set.title}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{set.subtitle}</p>
                  </div>

                  <span className="text-[11px] text-slate-500 font-semibold shrink-0">
                    {set.items.length} titles
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {set.items.map((rec) => (
                    <RecommendationCard
                      key={rec.anime.mal_id}
                      item={rec}
                      onAddedToLibrary={() => {}}
                      onReviewed={handleAnimeReviewed}
                      getOnScreenMalIds={getOnScreenMalIds}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={
            categoryParam === 'continue_journey'
              ? 'No eligible sequels right now'
              : categoryParam === 'because_you_liked'
              ? 'No library anchors yet'
              : 'No recommendations found'
          }
          description={
            categoryParam === 'continue_journey'
              ? 'Mark previous seasons as "Completed" in your watchlist to unlock their sequels and movies here.'
              : categoryParam === 'because_you_liked'
              ? 'Rate anime 8★ or higher in your library to see targeted recommendations based on your favorite shows.'
              : 'Try relaxing your filters or updating your questionnaire preferences to discover more anime.'
          }
          onReset={() => updateCategory('all_sets')}
          resetLabel="Show All Recommendation Sets"
        />
      ) : (
        /* SINGLE CATEGORY GRID VIEW */
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {items.map((rec) => (
              <RecommendationCard
                key={rec.anime.mal_id}
                item={rec}
                onAddedToLibrary={() => {}}
                onReviewed={handleAnimeReviewed}
                getOnScreenMalIds={getOnScreenMalIds}
              />
            ))}
          </div>

          {/* Pagination for Paginated views */}
          {categoryParam !== 'continue_journey' && categoryParam !== 'because_you_liked' && (
            <Pagination
              currentPage={pageParam}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
