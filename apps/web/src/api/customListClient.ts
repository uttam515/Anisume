import type {
  CustomList,
  CreateCustomListDTO,
  UpdateCustomListDTO,
} from '@anisume/shared';
import { API_BASE, apiRequest as request } from './config.js';

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

