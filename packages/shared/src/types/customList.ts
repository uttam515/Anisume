export interface CustomListAnimeEntry {
  mal_id: number;
  animeId?: string;
  title?: string;
  image_url?: string;
  type?: string;
  score?: number | null;
  episodes?: number | null;
  addedAt: string;
}

export interface CustomList {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  entriesCount: number;
  previewImages: string[];
  entries?: CustomListAnimeEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomListDTO {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateCustomListDTO {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface AddAnimeToListDTO {
  mal_id: number;
}

