import type {
  UserAnimeListItem,
  LibraryStats,
  AddToLibraryDTO,
  UpdateLibraryDTO,
  LibraryQueryParams,
  LibraryListResponse,
} from '@anisume/shared';
import { API_BASE, apiRequest as request } from './config.js';

export const libraryApi = {
  /**
   * Retrieves paginated, filtered, and searchable anime from the user's library.
   */
  getLibrary: async (params: LibraryQueryParams = {}): Promise<LibraryListResponse> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.q) query.set('q', params.q.trim());
    if (params.sort) query.set('sort', params.sort);

    const qs = query.toString();
    return request<LibraryListResponse>(`${API_BASE}/library${qs ? `?${qs}` : ''}`);
  },

  /**
   * Retrieves summary statistics for the authenticated user's library.
   */
  getLibraryStats: async (): Promise<{ stats: LibraryStats }> => {
    return request<{ stats: LibraryStats }>(`${API_BASE}/library/stats`);
  },

  /**
   * Retrieves a single library entry by MAL ID. Returns null if not in user's library.
   */
  getLibraryItem: async (malId: number | string): Promise<UserAnimeListItem | null> => {
    const res = await request<{ data: UserAnimeListItem | null }>(`${API_BASE}/library/${malId}`);
    return res.data;
  },

  /**
   * Adds an anime to the authenticated user's library.
   */
  addToLibrary: async (dto: AddToLibraryDTO): Promise<{ data: UserAnimeListItem; message: string }> => {
    return request<{ data: UserAnimeListItem; message: string }>(`${API_BASE}/library`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Updates an existing anime entry in the user's library.
   */
  updateLibraryItem: async (
    malId: number | string,
    dto: UpdateLibraryDTO
  ): Promise<{ data: UserAnimeListItem; message: string }> => {
    return request<{ data: UserAnimeListItem; message: string }>(`${API_BASE}/library/${malId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Removes an anime from the user's library.
   */
  removeFromLibrary: async (malId: number | string): Promise<{ message: string; mal_id: number }> => {
    return request<{ message: string; mal_id: number }>(`${API_BASE}/library/${malId}`, {
      method: 'DELETE',
    });
  },
};

