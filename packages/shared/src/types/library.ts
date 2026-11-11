import type { Anime } from './anime.js';

export type WatchStatus = 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';

export interface UserAnimeListItem {
  _id: string;
  userId: string;
  animeId: string;
  mal_id: number;
  status: WatchStatus;
  episodesWatched: number;
  userScore: number | null;
  startDate: string | null;
  finishDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  anime?: Anime;
}

export interface LibraryStats {
  total: number;
  watching: number;
  completed: number;
  plan_to_watch: number;
  on_hold: number;
  dropped: number;
  meanScore: number | null;
  totalEpisodesWatched: number;
}

export interface AddToLibraryDTO {
  mal_id: number;
  status?: WatchStatus;
  episodesWatched?: number;
  userScore?: number | null;
  notes?: string;
  startDate?: string | null;
  finishDate?: string | null;
}

export interface UpdateLibraryDTO {
  status?: WatchStatus;
  episodesWatched?: number;
  userScore?: number | null;
  notes?: string | null;
  startDate?: string | null;
  finishDate?: string | null;
}

export interface LibraryQueryParams {
  status?: WatchStatus | 'all';
  q?: string;
  sort?: 'updated' | 'title' | 'score' | 'rating';
  page?: number;
  limit?: number;
}

export interface LibraryListResponse {
  data: UserAnimeListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

