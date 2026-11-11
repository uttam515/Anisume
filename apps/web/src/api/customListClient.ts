import type {
  CustomList,
  CreateCustomListDTO,
  UpdateCustomListDTO,
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
        errorMsg = `Request failed (${res.status} ${res.statusText})`;
      }
    }
    const error = new Error(errorMsg);
    (error as any).status = res.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

export const customListClient = {
  /**
   * Get all custom lists of the authenticated user
   */
  getLists: async (): Promise<CustomList[]> => {
    const res = await request<{ data: CustomList[] }>(`${API_BASE}/lists`);
    return res.data;
  },

  /**
   * Create a new custom list
   */
  createList: async (dto: CreateCustomListDTO): Promise<CustomList> => {
    const res = await request<{ data: CustomList }>(`${API_BASE}/lists`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return res.data;
  },

  /**
   * Get details and anime items of a single custom list
   */
  getListDetails: async (id: string): Promise<CustomList> => {
    const res = await request<{ data: CustomList }>(`${API_BASE}/lists/${id}`);
    return res.data;
  },

  /**
   * Update list metadata
   */
  updateList: async (id: string, dto: UpdateCustomListDTO): Promise<CustomList> => {
    const res = await request<{ data: CustomList }>(`${API_BASE}/lists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    return res.data;
  },

  /**
   * Delete a custom list
   */
  deleteList: async (id: string): Promise<void> => {
    await request<void>(`${API_BASE}/lists/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Check which lists contain a specific anime
   */
  checkAnimeInLists: async (mal_id: number): Promise<string[]> => {
    const res = await request<{ data: { containingListIds: string[] } }>(
      `${API_BASE}/lists/check/${mal_id}`
    );
    return res.data.containingListIds;
  },

  /**
   * Add anime to custom list
   */
  addAnimeToList: async (listId: string, mal_id: number): Promise<{ entriesCount: number }> => {
    const res = await request<{ data: { listId: string; entriesCount: number } }>(
      `${API_BASE}/lists/${listId}/anime`,
      {
        method: 'POST',
        body: JSON.stringify({ mal_id }),
      }
    );
    return res.data;
  },

  /**
   * Remove anime from custom list
   */
  removeAnimeFromList: async (listId: string, mal_id: number): Promise<{ entriesCount: number }> => {
    const res = await request<{ data: { listId: string; entriesCount: number } }>(
      `${API_BASE}/lists/${listId}/anime/${mal_id}`,
      {
        method: 'DELETE',
      }
    );
    return res.data;
  },
};

