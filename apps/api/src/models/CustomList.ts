import { Schema, model, type Document, type Model, Types } from 'mongoose';

export interface CustomListEntrySubdoc {
  mal_id: number;
  animeId: Types.ObjectId;
  addedAt: Date;
}

export interface CustomListDocument extends Document {
  userId: Types.ObjectId;
  name: string;
  description: string;
  isPublic: boolean;
  entries: CustomListEntrySubdoc[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomListEntrySchema = new Schema<CustomListEntrySubdoc>(
  {
    mal_id: {
      type: Number,
      required: true,
    },
    animeId: {
      type: Schema.Types.ObjectId,
      ref: 'Anime',
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const CustomListSchema = new Schema<CustomListDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    entries: {
      type: [CustomListEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'customlists',
  }
);

// Prevent duplicate list names for the same user
CustomListSchema.index({ userId: 1, name: 1 }, { unique: true });

export const CustomListModel: Model<CustomListDocument> =
  model<CustomListDocument>('CustomList', CustomListSchema);

