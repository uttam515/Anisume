import type { Anime } from './anime.js';

export type AnimeFormatPreference = 'tv' | 'movie' | 'both';

export type AnimeLengthPreference =
  | 'short'     // 1-12 episodes (or <= 90 mins)
  | 'medium'    // 13-26 episodes (or 90-140 mins)
  | 'long'      // 27-100 episodes
  | 'very_long' // >100 episodes
  | 'any';

export type AnimeEraPreference =
  | 'pre_2000'    // Before 2000
  | '2000_2009'   // 2000-2009
  | '2010_2019'   // 2010-2019
  | '2020_plus'   // 2020 onwards
  | 'any';

export type RecommendationCategory =
  | 'for_you'
  | 'because_you_liked'
  | 'hidden_gems'
  | 'top_rated'
  | 'continue_journey';

export interface UserPreferences {
  _id?: string;
  userId: string;
  favoriteGenres: string[];
  favoriteThemes: string[];
  negativeGenres: string[];
  negativeThemes: string[];
  preferredFormats: AnimeFormatPreference[];
  preferredLength: AnimeLengthPreference[];
  preferredEras: AnimeEraPreference[];
  favoriteAnimeIds: number[];
  dislikedAnimeIds?: number[];
  questionnaireCompleted: boolean;
  preferencesUpdatedAt: string;
}

export interface UpdatePreferencesDTO {
  favoriteGenres?: string[];
  favoriteThemes?: string[];
  negativeGenres?: string[];
  negativeThemes?: string[];
  preferredFormats?: AnimeFormatPreference[];
  preferredLength?: AnimeLengthPreference[];
  preferredEras?: AnimeEraPreference[];
  favoriteAnimeIds?: number[];
  dislikedAnimeIds?: number[];
  questionnaireCompleted?: boolean;
}

export interface RecommendationFeedbackDTO {
  mal_id: number;
  feedback: 'like' | 'dislike' | 'watched' | 'none';
  excludeIds?: number[];
}

export interface RecommendationExplanation {
  type: 'genre' | 'theme' | 'favorite' | 'format' | 'length' | 'era' | 'quality' | 'sequel' | 'library_match';
  label: string;
  matchedItems?: string[];
}

export interface RecommendedAnimeItem {
  anime: Anime;
  score: number; // 0-100 normalized recommendation score
  reasons: string[];
  explanations: RecommendationExplanation[];
  franchiseInfo?: {
    rootMalId: number;
    relationType: string;
    predecessorTitle?: string;
  };
  scoreBreakdown: {
    genreScore: number;
    themeScore: number;
    favoriteScore: number;
    libraryScore: number;
    formatScore: number;
    lengthScore: number;
    eraScore: number;
    qualityScore: number;
    negativePenalty: number;
  };
}

export interface RecommendationsResponse {
  data: RecommendedAnimeItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta: {
    questionnaireCompleted: boolean;
    category?: RecommendationCategory;
    preferencesSummary: {
      genresCount: number;
      themesCount: number;
      favoritesCount: number;
      negativeGenresCount: number;
    };
  };
}

export interface RecommendationSet {
  id: string;
  title: string;
  subtitle: string;
  type: 'anchor_anime' | 'genre' | 'continuation' | 'hidden_gems' | 'top_rated' | 'for_you';
  anchor?: {
    type: 'anime' | 'genre' | 'theme';
    name: string;
    mal_id?: number;
  };
  items: RecommendedAnimeItem[];
}

export interface CategorizedRecommendationsResponse {
  recommendedForYou: RecommendedAnimeItem[];
  becauseYouLiked: Array<{
    anchorMalId: number;
    anchorTitle: string;
    anchorScore: number | null;
    items: RecommendedAnimeItem[];
  }>;
  hiddenGems: RecommendedAnimeItem[];
  highlyRatedPicks: RecommendedAnimeItem[];
  continueYourJourney: Array<{
    predecessorMalId: number;
    predecessorTitle: string;
    item: RecommendedAnimeItem;
  }>;
  sets?: RecommendationSet[];
  meta: {
    questionnaireCompleted: boolean;
    eligibleContinuationsCount: number;
  };
}

export interface SimilarAnimeResponse {
  sourceAnime: {
    mal_id: number;
    title: string;
    image_url: string;
  };
  similar: Array<{
    anime: Anime;
    similarityScore: number;
    sharedGenres: string[];
    sharedThemes: string[];
    sharedDemographics: string[];
  }>;
}

export interface RecommendationProfileResponse {
  questionnaireCompleted: boolean;
  preferences: UserPreferences | null;
  favoriteAnimeDetails: Array<{
    mal_id: number;
    title: string;
    image_url: string;
    type: string;
    score: number | null;
  }>;
  topGenres: string[];
  topThemes: string[];
  negativeGenres: string[];
  negativeThemes: string[];
  positiveTasteSignals: string[];
  negativeTasteSignals: string[];
  libraryLearnedStats: {
    completedCount: number;
    watchingCount: number;
    droppedCount: number;
    averagePersonalScore: number | null;
    topCompletedGenres: string[];
  };
}
