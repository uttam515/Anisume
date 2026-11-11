export type AnimeType = 'tv' | 'movie';

export type AnimeStatus = 'Finished Airing' | 'Currently Airing' | 'Not yet aired' | string;

export interface AnimeDatePropDetail {
  day: number | null;
  month: number | null;
  year: number | null;
}

export interface AnimeAiredProp {
  from: AnimeDatePropDetail;
  to: AnimeDatePropDetail;
}

export interface AnimeAired {
  from: string | null;
  to: string | null;
  prop: AnimeAiredProp;
  string: string | null;
}

export interface AnimeResourceItem {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface ImageDetail {
  image_url: string;
  small_image_url?: string;
  large_image_url?: string;
}

export interface AnimeImages {
  jpg: ImageDetail;
  webp?: ImageDetail;
}

export interface TrailerImages {
  image_url?: string | null;
  small_image_url?: string | null;
  medium_image_url?: string | null;
  large_image_url?: string | null;
  maximum_image_url?: string | null;
}

export interface AnimeTrailer {
  youtube_id: string | null;
  url: string | null;
  embed_url: string | null;
  images?: TrailerImages;
}

export interface AnimeRelationEntry {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface AnimeRelation {
  relation: string;
  entry: AnimeRelationEntry[];
}

export interface AnimeExternalLink {
  name: string;
  url: string;
}

export interface Anime {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: string[];
  type: AnimeType;
  source: string | null;
  episodes: number | null;
  status: AnimeStatus | null;
  airing: boolean;
  aired: AnimeAired;
  duration: string | null;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  season: string | null;
  year: number | null;
  studios: AnimeResourceItem[];
  genres: AnimeResourceItem[];
  explicit_genres: AnimeResourceItem[];
  themes: AnimeResourceItem[];
  demographics: AnimeResourceItem[];
  images: AnimeImages;
  trailer: AnimeTrailer;
  relations: AnimeRelation[];
  external_links: AnimeExternalLink[];
  createdAt?: Date;
  updatedAt?: Date;
}
