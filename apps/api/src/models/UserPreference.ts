import { Schema, model, type Document, type Model, Types } from 'mongoose';
import type {
  AnimeFormatPreference,
  AnimeLengthPreference,
  AnimeEraPreference,
} from '@anisume/shared';

export interface UserPreferenceDocument extends Document {
  userId: Types.ObjectId;
  favoriteGenres: string[];
  favoriteThemes: string[];
  negativeGenres: string[];
  negativeThemes: string[];
  preferredFormats: AnimeFormatPreference[];
  preferredLength: AnimeLengthPreference[];
  preferredEras: AnimeEraPreference[];
  favoriteAnimeIds: number[];
  dislikedAnimeIds: number[];
  questionnaireCompleted: boolean;
  preferencesUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferenceSchema = new Schema<UserPreferenceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    favoriteGenres: {
      type: [String],
      default: [],
    },
    favoriteThemes: {
      type: [String],
      default: [],
    },
    negativeGenres: {
      type: [String],
      default: [],
    },
    negativeThemes: {
      type: [String],
      default: [],
    },
    preferredFormats: {
      type: [String],
      enum: ['tv', 'movie', 'both'],
      default: ['both'],
    },
    preferredLength: {
      type: [String],
      enum: ['short', 'medium', 'long', 'very_long', 'any'],
      default: ['any'],
    },
    preferredEras: {
      type: [String],
      enum: ['pre_2000', '2000_2009', '2010_2019', '2020_plus', 'any'],
      default: ['any'],
    },
    favoriteAnimeIds: {
      type: [Number],
      default: [],
    },
    dislikedAnimeIds: {
      type: [Number],
      default: [],
    },
    questionnaireCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    preferencesUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'userpreferences',
  }
);

export const UserPreferenceModel: Model<UserPreferenceDocument> =
  model<UserPreferenceDocument>('UserPreference', UserPreferenceSchema);

