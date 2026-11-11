import { Schema, model, type Document, type Model } from 'mongoose';
import type {
  Anime,
  AnimeAired,
  AnimeResourceItem,
  AnimeImages,
  AnimeTrailer,
  AnimeRelation,
  AnimeExternalLink,
} from '@anisume/shared';

export interface AnimeDocument extends Omit<Anime, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const ResourceItemSchema = new Schema<AnimeResourceItem>(
  {
    mal_id: { type: Number, required: true },
    type: { type: String, default: '' },
    name: { type: String, required: true },
    url: { type: String, default: '' },
  },
  { _id: false }
);

const DatePropDetailSchema = new Schema(
  {
    day: { type: Number, default: null },
    month: { type: Number, default: null },
    year: { type: Number, default: null },
  },
  { _id: false }
);

const AiredPropSchema = new Schema(
  {
    from: { type: DatePropDetailSchema, default: () => ({ day: null, month: null, year: null }) },
    to: { type: DatePropDetailSchema, default: () => ({ day: null, month: null, year: null }) },
  },
  { _id: false }
);

const AiredSchema = new Schema<AnimeAired>(
  {
    from: { type: String, default: null },
    to: { type: String, default: null },
    prop: AiredPropSchema,
    string: { type: String, default: null },
  },
  { _id: false }
);

const ImageDetailSchema = new Schema(
  {
    image_url: { type: String, default: '' },
    small_image_url: { type: String, default: '' },
    large_image_url: { type: String, default: '' },
  },
  { _id: false }
);

const ImagesSchema = new Schema<AnimeImages>(
  {
    jpg: { type: ImageDetailSchema, default: () => ({ image_url: '' }) },
    webp: { type: ImageDetailSchema, default: () => ({ image_url: '' }) },
  },
  { _id: false }
);

const TrailerImagesSchema = new Schema(
  {
    image_url: { type: String, default: null },
    small_image_url: { type: String, default: null },
    medium_image_url: { type: String, default: null },
    large_image_url: { type: String, default: null },
    maximum_image_url: { type: String, default: null },
  },
  { _id: false }
);

const TrailerSchema = new Schema<AnimeTrailer>(
  {
    youtube_id: { type: String, default: null },
    url: { type: String, default: null },
    embed_url: { type: String, default: null },
    images: { type: TrailerImagesSchema, default: () => ({}) },
  },
  { _id: false }
);

const RelationSchema = new Schema<AnimeRelation>(
  {
    relation: { type: String, required: true },
    entry: [ResourceItemSchema],
  },
  { _id: false }
);

const ExternalLinkSchema = new Schema<AnimeExternalLink>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const AnimeSchema = new Schema<AnimeDocument>(
  {
    mal_id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title_english: {
      type: String,
      default: null,
      trim: true,
    },
    title_japanese: {
      type: String,
      default: null,
      trim: true,
    },
    title_synonyms: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      required: true,
      enum: ['tv', 'movie'],
      index: true,
    },
    source: {
      type: String,
      default: null,
    },
    episodes: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      default: null,
    },
    airing: {
      type: Boolean,
      default: false,
    },
    aired: AiredSchema,
    duration: {
      type: String,
      default: null,
    },
    rating: {
      type: String,
      default: null,
    },
    score: {
      type: Number,
      default: null,
      index: true,
    },
    scored_by: {
      type: Number,
      default: null,
    },
    rank: {
      type: Number,
      default: null,
    },
    popularity: {
      type: Number,
      default: null,
      index: true,
    },
    members: {
      type: Number,
      default: null,
    },
    favorites: {
      type: Number,
      default: null,
    },
    synopsis: {
      type: String,
      default: null,
    },
    background: {
      type: String,
      default: null,
    },
    season: {
      type: String,
      default: null,
    },
    year: {
      type: Number,
      default: null,
    },
    studios: {
      type: [ResourceItemSchema],
      default: [],
    },
    genres: {
      type: [ResourceItemSchema],
      default: [],
    },
    explicit_genres: {
      type: [ResourceItemSchema],
      default: [],
    },
    themes: {
      type: [ResourceItemSchema],
      default: [],
    },
    demographics: {
      type: [ResourceItemSchema],
      default: [],
    },
    images: ImagesSchema,
    trailer: TrailerSchema,
    relations: {
      type: [RelationSchema],
      default: [],
    },
    external_links: {
      type: [ExternalLinkSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
// Compound index on type and score for catalog browsing
AnimeSchema.index({ type: 1, score: -1 });
// Compound index on type and popularity
AnimeSchema.index({ type: 1, popularity: 1 });
// Index on genres for filtering
AnimeSchema.index({ 'genres.mal_id': 1 });
AnimeSchema.index({ 'genres.name': 1 });
// Text index on titles for searching
AnimeSchema.index({
  title: 'text',
  title_english: 'text',
  title_japanese: 'text',
  title_synonyms: 'text',
});

export const AnimeModel: Model<AnimeDocument> = model<AnimeDocument>('Anime', AnimeSchema, 'anime');
export default AnimeModel;
