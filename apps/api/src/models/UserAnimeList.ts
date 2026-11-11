import { Schema, model, type Document, type Model, Types } from 'mongoose';
import type { WatchStatus } from '@anisume/shared';

export interface UserAnimeListDocument extends Document {
  userId: Types.ObjectId;
  animeId: Types.ObjectId;
  mal_id: number;
  status: WatchStatus;
  episodesWatched: number;
  userScore: number | null;
  startDate: Date | null;
  finishDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserAnimeListSchema = new Schema<UserAnimeListDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    animeId: {
      type: Schema.Types.ObjectId,
      ref: 'Anime',
      required: true,
      index: true,
    },
    mal_id: {
      type: Number,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped'],
      default: 'plan_to_watch',
      index: true,
    },
    episodesWatched: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    userScore: {
      type: Number,
      default: null,
      min: 1,
      max: 10,
    },
    startDate: {
      type: Date,
      default: null,
    },
    finishDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'useranimelists',
  }
);

// Compound Unique Index: A user can only have ONE entry per anime
UserAnimeListSchema.index({ userId: 1, mal_id: 1 }, { unique: true });

// Compound Query Index: For fast filtering and sorting by status/updatedAt
UserAnimeListSchema.index({ userId: 1, status: 1 });
UserAnimeListSchema.index({ userId: 1, updatedAt: -1 });

export const UserAnimeListModel: Model<UserAnimeListDocument> = model<UserAnimeListDocument>(
  'UserAnimeList',
  UserAnimeListSchema
);

export default UserAnimeListModel;

