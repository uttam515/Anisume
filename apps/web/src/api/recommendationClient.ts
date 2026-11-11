import type {
  UserPreferences,
  UpdatePreferencesDTO,
  RecommendationsResponse,
  SimilarAnimeResponse,
  RecommendationProfileResponse,
  CategorizedRecommendationsResponse,
  RecommendationCategory,
  RecommendedAnimeItem,
  Anime,
} from '@anisume/shared';
import { API_BASE, apiRequest as request } from './config.js';

export const recommendationClient = {
  /**
   * Retrieves the current user's preferences
   */
  getPreferences: async (): Promise<UserPreferences> => {
    const res = await request<{ data: UserPreferences }>(`${API_BASE}/preferences`);
    return res.data;
  },

  /**
   * Updates or saves questionnaire preferences
   */
  updatePreferences: async (dto: UpdatePreferencesDTO): Promise<UserPreferences> => {
    const res = await request<{ data: UserPreferences }>(`${API_BASE}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    return res.data;
  },

  /**
   * Retrieves all 5 categorized recommendation sections for the user
   */
  getCategorizedRecommendations: async (): Promise<CategorizedRecommendationsResponse> => {
    const res = await request<{ data: CategorizedRecommendationsResponse }>(
      `${API_BASE}/recommendations/categorized`
    );
    return res.data;
  },

  /**
   * Retrieves personalized recommendations with optional category filter
   */
  getRecommendations: async (params: {
    page?: number;
    limit?: number;
    type?: 'all' | 'tv' | 'movie';
    category?: RecommendationCategory;
  } = {}): Promise<RecommendationsResponse> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.type && params.type !== 'all') query.set('type', params.type);
    if (params.category) query.set('category', params.category);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<RecommendationsResponse>(`${API_BASE}/recommendations${queryString}`);
  },

  /**
   * Retrieves similar anime for a given anime ID (Spotify-style taste expansion & details page)
   */
  getSimilarAnime: async (
    malId: number,
    limit = 4,
    exclude: number[] = []
  ): Promise<SimilarAnimeResponse> => {
    const query = new URLSearchParams();
    if (limit) query.set('limit', String(limit));
    if (exclude.length > 0) query.set('exclude', exclude.join(','));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request<{ data: SimilarAnimeResponse }>(
      `${API_BASE}/recommendations/similar/${malId}${queryString}`
    );
    return res.data;
  },

  /**
   * Retrieves user's recommendation profile
   */
  getProfile: async (): Promise<RecommendationProfileResponse> => {
    const res = await request<{ data: RecommendationProfileResponse }>(
      `${API_BASE}/recommendations/profile`
    );
    return res.data;
  },

  /**
   * Fetches metadata for questionnaire (genres, themes, starter anime)
   */
  getMetadata: async (): Promise<{
    genres: string[];
    themes: string[];
    starters: Anime[];
  }> => {
    const res = await request<{
      data: {
        genres: string[];
        themes: string[];
        starters: Anime[];
      };
    }>(`${API_BASE}/recommendations/metadata`);
    return res.data;
  },

  /**
   * Submits user feedback (heart / thumbs down / watched) for a recommended anime and receives a replacement item
   */
  sendFeedback: async (
    malId: number,
    feedback: 'like' | 'dislike' | 'watched' | 'none',
    excludeIds: number[] = []
  ): Promise<{
    mal_id: number;
    feedback: string;
    replacementItem: RecommendedAnimeItem | null;
  }> => {
    const res = await request<{
      data: {
        mal_id: number;
        feedback: string;
        replacementItem: RecommendedAnimeItem | null;
      };
    }>(`${API_BASE}/recommendations/feedback`, {
      method: 'POST',
      body: JSON.stringify({ mal_id: malId, feedback, excludeIds }),
    });
    return res.data;
  },
};
