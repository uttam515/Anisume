import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { api, type AnimeDetail } from '../api/client.js';
import { libraryApi } from '../api/libraryClient.js';
import { recommendationClient } from '../api/recommendationClient.js';
import { useAuth } from '../context/AuthContext.js';
import type { UserAnimeListItem, WatchStatus } from '@anisume/shared';
import WatchStatusSelector from '../components/WatchStatusSelector.js';
import EpisodeProgressControl from '../components/EpisodeProgressControl.js';
import PersonalRating from '../components/PersonalRating.js';
import AddToListModal from '../components/AddToListModal.js';
import { ErrorState } from '../components/EmptyState.js';
import {
  Star,
  Film,
  Tv,
  Award,
  TrendingUp,
  ExternalLink,
  ChevronLeft,
  BookOpen,
  Compass,
  Users,
  Video,
  Bookmark,
  Trash2,
  LogIn,
  FolderPlus,
} from 'lucide-react';

export default function AnimeDetailPage() {
  const { mal_id } = useParams<{ mal_id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [similarAnime, setSimilarAnime] = useState<any[]>([]);
  const [libraryItem, setLibraryItem] = useState<UserAnimeListItem | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mal_id) return;
    setLoading(true);
    setError(null);

    api.getAnimeDetail(mal_id)
      .then((data) => {
        setAnime(data);
        window.scrollTo({ top: 0, behavior: 'instant' });
      })
      .catch((err: unknown) => {
        const e = err as Error;
        setError(e.message || 'Anime not found');
      })
      .finally(() => {
        setLoading(false);
      });

    recommendationClient
      .getSimilarAnime(parseInt(mal_id, 10), 6)
      .then((res) => setSimilarAnime(res.similar || []))
      .catch(() => setSimilarAnime([]));
  }, [mal_id]);

  // Load user's library record for this anime
  useEffect(() => {
    if (!mal_id || !user) {
      setLibraryItem(null);
      return;
    }

    libraryApi.getLibraryItem(mal_id).then((item) => {
      setLibraryItem(item);
    }).catch(() => {
      setLibraryItem(null);
    });
  }, [mal_id, user]);

  const handleAddOrUpdateStatus = async (status: WatchStatus) => {
    if (!mal_id) return;
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    setLibraryLoading(true);
    try {
      if (libraryItem) {
        const res = await libraryApi.updateLibraryItem(mal_id, { status });
        setLibraryItem(res.data);
      } else {
        const res = await libraryApi.addToLibrary({ mal_id: parseInt(mal_id, 10), status });
        setLibraryItem(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update watch status.');
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleProgressChange = async (episodesWatched: number) => {
    if (!mal_id || !libraryItem) return;
    setLibraryLoading(true);
    try {
      const res = await libraryApi.updateLibraryItem(mal_id, { episodesWatched });
      setLibraryItem(res.data);
    } catch (err: any) {
      alert(err.message || 'Failed to update progress.');
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleRatingChange = async (userScore: number | null) => {
    if (!mal_id) return;
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    setLibraryLoading(true);
    try {
      if (libraryItem) {
        const res = await libraryApi.updateLibraryItem(mal_id, { userScore });
        setLibraryItem(res.data);
      } else {
        const res = await libraryApi.addToLibrary({
          mal_id: parseInt(mal_id, 10),
          status: 'plan_to_watch',
          userScore,
        });
        setLibraryItem(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update rating.');
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleRemoveFromLibrary = async () => {
    if (!mal_id || !libraryItem) return;
    if (window.confirm('Remove this anime from your library?')) {
      setLibraryLoading(true);
      try {
        await libraryApi.removeFromLibrary(mal_id);
        setLibraryItem(null);
      } catch (err: any) {
        alert(err.message || 'Failed to remove from library.');
      } finally {
        setLibraryLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-6 w-32 bg-dark-850 rounded" />
        <div className="w-full h-80 bg-dark-850 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-96 bg-dark-850 rounded-2xl" />
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-dark-850 rounded w-2/3" />
            <div className="h-4 bg-dark-850 rounded w-1/3" />
            <div className="h-32 bg-dark-850 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ErrorState
          message={`Could not load anime details (MAL ID: ${mal_id}). It may not exist in our catalog.`}
        />
        <Link
          to="/discover"
          className="inline-flex items-center space-x-2 px-5 py-2.5 mt-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Discover</span>
        </Link>
      </div>
    );
  }

  const displayTitle = anime.title_english || anime.title;
  const originalTitle = anime.title_english && anime.title !== anime.title_english ? anime.title : anime.title_japanese;
  const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const isMovie = anime.type === 'movie';
  const malUrl = `https://myanimelist.net/anime/${anime.mal_id}`;

  const trailerEmbedUrl =
    anime.trailer?.embed_url ||
    (anime.trailer?.youtube_id
      ? `https://www.youtube-nocookie.com/embed/${anime.trailer.youtube_id}`
      : null);

  return (
    <div className="min-h-screen pb-20">
      {/* 1. Backdrop Banner Header */}
      <div className="relative w-full h-72 sm:h-96 md:h-[420px] overflow-hidden bg-dark-950">
        <img
          src={imageUrl}
          alt={displayTitle}
          className="w-full h-full object-cover object-center filter blur-2xl opacity-30 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/70 to-transparent" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-dark-950/90" />

        {/* Back navigation button */}
        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-950/80 hover:bg-dark-900 text-slate-300 hover:text-white border border-dark-800 backdrop-blur-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* 2. Main Detail Card Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 sm:-mt-52 md:-mt-64 relative z-20">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          {/* Left Column: Poster + Quick Stats */}
          <div className="w-full md:w-64 lg:w-72 shrink-0 space-y-4 mx-auto md:mx-0 max-w-xs">
            {/* Poster Card */}
            <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl border border-dark-700/80 bg-dark-900 relative group">
              <img
                src={imageUrl}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Personal Anime Library Action Card */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                  <span>My Library</span>
                </span>
                {libraryItem && (
                  <button
                    type="button"
                    disabled={libraryLoading}
                    onClick={handleRemoveFromLibrary}
                    className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors flex items-center space-x-1"
                    title="Remove from My List"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {user ? (
                <div className="space-y-3.5">
                  {/* Status Selector */}
                  <div className="w-full">
                    <WatchStatusSelector
                      currentStatus={libraryItem?.status || null}
                      onSelect={handleAddOrUpdateStatus}
                      loading={libraryLoading}
                      size="md"
                    />
                  </div>

                  {/* Episode Progress (for TV anime) */}
                  {libraryItem && !isMovie && (
                    <div className="pt-2 border-t border-dark-800">
                      <div className="text-[11px] font-semibold text-slate-400 mb-1">
                        Episodes Watched
                      </div>
                      <EpisodeProgressControl
                        episodesWatched={libraryItem.episodesWatched}
                        totalEpisodes={anime.episodes}
                        isMovie={isMovie}
                        onChange={handleProgressChange}
                        loading={libraryLoading}
                      />
                    </div>
                  )}

                  {/* Personal Rating */}
                  <div className="pt-2 border-t border-dark-800">
                    <div className="text-[11px] font-semibold text-slate-400 mb-1">
                      Your Rating
                    </div>
                    <PersonalRating
                      score={libraryItem?.userScore ?? null}
                      onChange={handleRatingChange}
                      loading={libraryLoading}
                    />
                  </div>

                  {/* Add to Custom List button */}
                  <div className="pt-2 border-t border-dark-800">
                    <button
                      type="button"
                      onClick={() => setIsAddToListOpen(true)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-dark-850 hover:bg-dark-800 text-slate-200 hover:text-white border border-dark-750 hover:border-emerald-400 flex items-center justify-center space-x-2 transition-all shadow-sm"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Add to Custom List...</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 space-y-2">
                  <p className="text-xs text-slate-400">
                    Sign in to track progress, assign personal ratings, and build your watchlist.
                  </p>
                  <Link
                    to="/login"
                    state={{ from: location }}
                    className="w-full inline-flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Track</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Action: MAL External Link */}
            <a
              href={malUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-dark-900 hover:bg-dark-850 text-slate-200 border border-dark-800 flex items-center justify-center space-x-2 transition-colors"
            >
              <span>View on MyAnimeList</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            {/* Metadata Box Sidebar */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 space-y-3.5 text-xs">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider pb-2 border-b border-dark-800">
                Information
              </h4>

              <div className="flex justify-between py-1 border-b border-dark-850">
                <span className="text-slate-400">Format</span>
                <span className="font-semibold text-white uppercase">{anime.type}</span>
              </div>

              {anime.episodes !== null && (
                <div className="flex justify-between py-1 border-b border-dark-850">
                  <span className="text-slate-400">Episodes</span>
                  <span className="font-semibold text-white">{anime.episodes}</span>
                </div>
              )}

              {anime.duration && (
                <div className="flex justify-between py-1 border-b border-dark-850">
                  <span className="text-slate-400">Duration</span>
                  <span className="font-semibold text-white">{anime.duration}</span>
                </div>
              )}

              {anime.status && (
                <div className="flex justify-between py-1 border-b border-dark-850">
                  <span className="text-slate-400">Status</span>
                  <span className="font-semibold text-emerald-400">{anime.status}</span>
                </div>
              )}

              {anime.aired?.string && (
                <div className="flex justify-between py-1 border-b border-dark-850">
                  <span className="text-slate-400">Aired</span>
                  <span className="font-semibold text-white text-right max-w-[150px] truncate" title={anime.aired.string}>
                    {anime.aired.string}
                  </span>
                </div>
              )}

              {anime.season && (
                <div className="flex justify-between py-1 border-b border-dark-850">
                  <span className="text-slate-400">Season</span>
                  <span className="font-semibold text-white capitalize">{anime.season} {anime.year}</span>
                </div>
              )}

              {anime.rating && (
                <div className="flex justify-between py-1 border-b border-dark-850">
                  <span className="text-slate-400">Age Rating</span>
                  <span className="font-semibold text-white text-right max-w-[150px] truncate" title={anime.rating}>
                    {anime.rating}
                  </span>
                </div>
              )}

              {anime.source && (
                <div className="flex justify-between py-1 border-b border-dark-850">
                  <span className="text-slate-400">Source</span>
                  <span className="font-semibold text-white">{anime.source}</span>
                </div>
              )}

              {/* Studios */}
              {anime.studios && anime.studios.length > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Studios</span>
                  <span className="font-bold text-emerald-400 text-right">
                    {anime.studios.map((s) => s.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Titles, Stats, Synopsis, Trailer, Relations */}
          <div className="flex-1 space-y-6 sm:space-y-8">
            {/* Header Title Area */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  {isMovie ? <Film className="w-3.5 h-3.5 text-brand-pink" /> : <Tv className="w-3.5 h-3.5 text-brand-sky" />}
                  <span>{isMovie ? 'Movie' : 'TV Series'}</span>
                </span>

                {anime.year && (
                  <span className="px-2.5 py-1 rounded-md bg-dark-900 border border-dark-800 text-slate-300 text-xs font-semibold">
                    {anime.year}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {displayTitle}
              </h1>

              {originalTitle && (
                <p className="text-sm sm:text-base text-slate-400 font-medium">
                  {originalTitle}
                </p>
              )}

              {anime.title_synonyms && anime.title_synonyms.length > 0 && (
                <p className="text-xs text-slate-500">
                  <span className="text-slate-400">Synonyms: </span>
                  {anime.title_synonyms.join(' • ')}
                </p>
              )}
            </div>

            {/* Score & Ranking Stat Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-dark-900 border border-dark-800 rounded-2xl p-4">
              {/* Score */}
              <div className="flex items-center space-x-3 p-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">Score</div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {anime.score ? anime.score.toFixed(2) : 'N/A'}
                  </div>
                  {anime.scored_by && (
                    <div className="text-[10px] text-slate-500">{anime.scored_by.toLocaleString()} votes</div>
                  )}
                </div>
              </div>

              {/* Rank */}
              <div className="flex items-center space-x-3 p-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">Ranked</div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {anime.rank ? `#${anime.rank}` : '—'}
                  </div>
                </div>
              </div>

              {/* Popularity */}
              <div className="flex items-center space-x-3 p-2">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">Popularity</div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {anime.popularity ? `#${anime.popularity}` : '—'}
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className="flex items-center space-x-3 p-2">
                <div className="w-10 h-10 rounded-xl bg-brand-sky/10 border border-brand-sky/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-brand-sky" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">Members</div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {anime.members ? anime.members.toLocaleString() : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Genres & Themes Chips */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Genres & Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {anime.genres &&
                  anime.genres.map((g) => (
                    <Link
                      key={g.name}
                      to={`/discover?genres=${encodeURIComponent(g.name)}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all"
                    >
                      {g.name}
                    </Link>
                  ))}

                {anime.themes &&
                  anime.themes.map((t) => (
                    <span
                      key={t.name}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-900 text-slate-300 border border-dark-800"
                    >
                      {t.name}
                    </span>
                  ))}

                {anime.demographics &&
                  anime.demographics.map((d) => (
                    <span
                      key={d.name}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-dark-850 text-brand-yellow border border-brand-yellow/30"
                    >
                      {d.name}
                    </span>
                  ))}
              </div>
            </div>

            {/* Synopsis */}
            <div className="space-y-3 bg-dark-900/70 border border-dark-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Synopsis</span>
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                {anime.synopsis || 'No synopsis available for this title.'}
              </p>
            </div>

            {/* Background info if present */}
            {anime.background && (
              <div className="space-y-2 bg-dark-900/40 border border-dark-800 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Background Information
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {anime.background}
                </p>
              </div>
            )}

            {/* Trailer Video Player */}
            {trailerEmbedUrl && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>Official Trailer</span>
                </h3>
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-dark-950 border border-dark-800 shadow-xl">
                  <iframe
                    src={trailerEmbedUrl}
                    title={`${displayTitle} Trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            )}

            {/* Similar Anime Recommendations */}
            {similarAnime && similarAnime.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-dark-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span>Similar Anime You Might Like</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Based on genres, themes & format</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {similarAnime.map(({ anime: sim, similarityScore }) => (
                    <Link
                      key={sim.mal_id}
                      to={`/anime/${sim.mal_id}`}
                      className="group p-2.5 rounded-xl bg-dark-900 border border-dark-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-dark-950 mb-2 relative">
                          <img
                            src={sim.images?.webp?.image_url || sim.images?.jpg?.image_url || ''}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-dark-950/90 text-[10px] font-black text-brand-yellow border border-brand-yellow/30">
                            {similarityScore}% match
                          </div>
                        </div>
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 line-clamp-2 transition-colors">
                          {sim.title_english || sim.title}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1 border-t border-dark-800/80">
                        <span className="capitalize font-semibold">{sim.type}</span>
                        {sim.score && (
                          <span className="flex items-center space-x-0.5 text-brand-yellow font-black">
                            <Star className="w-2.5 h-2.5 fill-brand-yellow" />
                            <span>{sim.score.toFixed(1)}</span>
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add To Custom List Modal */}
      {anime && (
        <AddToListModal
          isOpen={isAddToListOpen}
          onClose={() => setIsAddToListOpen(false)}
          malId={anime.mal_id}
          animeTitle={displayTitle}
        />
      )}
    </div>
  );
}
