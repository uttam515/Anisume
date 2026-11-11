import type { Anime } from '@anisume/shared';
import { API_BASE, apiRequest } from './config.js';

export interface GenreItem {
  name: string;
  mal_id: number;
  count: number;
}

export interface RelatedAnimeItem {
  mal_id: number;
  title: string;
  image_url: string;
  type: string;
  relation: string;
}

export interface AnimeDetail extends Anime {
  related_anime?: RelatedAnimeItem[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AnimeListResponse {
  data: Anime[];
  pagination: PaginationMeta;
}

export interface AnimeQueryParams {
  page?: number;
  limit?: number;
  type?: 'all' | 'tv' | 'movie';
  q?: string;
  genres?: string[];
  minScore?: number;
  year?: number;
  status?: string;
  sort?: 'popularity' | 'highest_rated' | 'score' | 'newest' | 'oldest' | 'alphabetical';
}

async function fetchJson<T>(url: string): Promise<T> {
  return apiRequest<T>(url);
}

export const api = {
  // Homepage sections
  getFeatured: async (): Promise<Anime[]> => {
    const res = await fetchJson<{ data: Anime[] }>(`${API_BASE}/anime/featured`);
    return res.data;
  },

  getTrending: async (): Promise<Anime[]> => {
    const res = await fetchJson<{ data: Anime[] }>(`${API_BASE}/anime/trending`);
    return res.data;
  },

  getTopRated: async (): Promise<Anime[]> => {
    const res = await fetchJson<{ data: Anime[] }>(`${API_BASE}/anime/top-rated`);
    return res.data;
  },

  getRecent: async (): Promise<Anime[]> => {
    const res = await fetchJson<{ data: Anime[] }>(`${API_BASE}/anime/recent`);
    return res.data;
  },

  getMovies: async (): Promise<Anime[]> => {
    const res = await fetchJson<{ data: Anime[] }>(`${API_BASE}/anime/movies`);
    return res.data;
  },

  getGenres: async (): Promise<GenreItem[]> => {
    const res = await fetchJson<{ data: GenreItem[] }>(`${API_BASE}/anime/genres`);
    return res.data;
  },

  // Discover & Search
  getAnimeList: async (params: AnimeQueryParams = {}): Promise<AnimeListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.type && params.type !== 'all') searchParams.set('type', params.type);
    if (params.q) searchParams.set('q', params.q.trim());
    if (params.genres && params.genres.length > 0) {
      searchParams.set('genres', params.genres.join(','));
    }
    if (params.minScore) searchParams.set('minScore', params.minScore.toString());
    if (params.year) searchParams.set('year', params.year.toString());
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.sort) searchParams.set('sort', params.sort);

    const query = searchParams.toString();
    const url = `${API_BASE}/anime${query ? `?${query}` : ''}`;
    return fetchJson<AnimeListResponse>(url);
  },

  // Single detail
  getAnimeDetail: async (malId: number | string): Promise<AnimeDetail> => {
    const res = await fetchJson<{ data: AnimeDetail }>(`${API_BASE}/anime/${malId}`);
    return res.data;
  },
};

