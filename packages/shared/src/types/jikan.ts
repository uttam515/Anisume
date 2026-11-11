export interface JikanPaginationItems {
  count: number;
  total: number;
  per_page: number;
}

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: JikanPaginationItems;
}

export interface JikanAnimeRaw {
  mal_id: number;
  url?: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url?: string;
      large_image_url?: string;
    };
    webp?: {
      image_url: string;
      small_image_url?: string;
      large_image_url?: string;
    };
  };
  trailer?: {
    youtube_id?: string | null;
    url?: string | null;
    embed_url?: string | null;
    images?: {
      image_url?: string | null;
      small_image_url?: string | null;
      medium_image_url?: string | null;
      large_image_url?: string | null;
      maximum_image_url?: string | null;
    };
  };
  approved?: boolean;
  titles?: Array<{ type: string; title: string }>;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  title_synonyms?: string[];
  type?: string | null;
  source?: string | null;
  episodes?: number | null;
  status?: string | null;
  airing?: boolean;
  aired?: {
    from?: string | null;
    to?: string | null;
    prop?: {
      from?: { day?: number | null; month?: number | null; year?: number | null };
      to?: { day?: number | null; month?: number | null; year?: number | null };
    };
    string?: string | null;
  };
  duration?: string | null;
  rating?: string | null;
  score?: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  members?: number | null;
  favorites?: number | null;
  synopsis?: string | null;
  background?: string | null;
  season?: string | null;
  year?: number | null;
  studios?: Array<{ mal_id: number; type: string; name: string; url: string }>;
  genres?: Array<{ mal_id: number; type: string; name: string; url: string }>;
  explicit_genres?: Array<{ mal_id: number; type: string; name: string; url: string }>;
  themes?: Array<{ mal_id: number; type: string; name: string; url: string }>;
  demographics?: Array<{ mal_id: number; type: string; name: string; url: string }>;
  relations?: Array<{
    relation: string;
    entry: Array<{ mal_id: number; type: string; name: string; url: string }>;
  }>;
  external?: Array<{ name: string; url: string }>;
}

export interface JikanAnimeListResponse {
  pagination: JikanPagination;
  data: JikanAnimeRaw[];
}
