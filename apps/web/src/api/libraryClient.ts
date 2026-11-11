import type {
  UserAnimeListItem,
  LibraryStats,
  AddToLibraryDTO,
  UpdateLibraryDTO,
  LibraryQueryParams,
  LibraryListResponse,
} from '@anisume/shared';

const API_BASE = '/api';

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)anisume_csrf=([^;]*)'));
  return match && match[2] ? decodeURIComponent(match[2]) : '';
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  let data: any = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    let errorMsg = data?.error || data?.message;
    if (!errorMsg) {
      if (res.status === 500 || res.status === 502 || res.status === 504) {
        errorMsg = 'Cannot reach backend server. Please verify the API server is running on port 4000.';
      } else {
        errorMsg = `API error ${res.status}: ${res.statusText}`;
      }
    }
    const error = new Error(errorMsg);
    (error as any).code = data?.code;
    (error as any).status = res.status;
    throw error;
  }

  return data as T;
}

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

