import { Schema, model, type Document, type Model } from 'mongoose';

export interface RawRelationEntry {
  relation: string;
  targetMalId: number;
  targetTitle: string;
  targetType: string;
}

export interface FranchiseRelationDocument extends Document {
  mal_id: number;
  title: string;
  predecessorMalIds: number[];     // Direct required predecessors (e.g. immediate prequel)
  allPrerequisiteMalIds: number[]; // Transitive required prerequisites (e.g. S1, S2 for S3)
  directSequelMalIds: number[];    // Immediate sequels (e.g. S2 for S1)
  franchiseRootMalId: number;      // Root entry of the franchise chain
  franchiseTitle: string;
  relationType: 'standalone' | 'sequel' | 'spinoff' | 'side_story' | 'movie_continuation' | 'other';
  rawRelations: RawRelationEntry[];
  updatedAt: Date;
  createdAt: Date;
}

const RawRelationSchema = new Schema<RawRelationEntry>(
  {
    relation: { type: String, required: true },
    targetMalId: { type: Number, required: true },
    targetTitle: { type: String, default: '' },
    targetType: { type: String, default: 'anime' },
  },
  { _id: false }
);

const FranchiseRelationSchema = new Schema<FranchiseRelationDocument>(
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
    },
    predecessorMalIds: {
      type: [Number],
      default: [],
      index: true,
    },
    allPrerequisiteMalIds: {
      type: [Number],
      default: [],
      index: true,
    },
    directSequelMalIds: {
      type: [Number],
      default: [],
      index: true,
    },
    franchiseRootMalId: {
      type: Number,
      required: true,
      index: true,
    },
    franchiseTitle: {
      type: String,
      default: '',
    },
    relationType: {
      type: String,
      enum: ['standalone', 'sequel', 'spinoff', 'side_story', 'movie_continuation', 'other'],
      default: 'standalone',
      index: true,
    },
    rawRelations: {
      type: [RawRelationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'franchiserelations',
  }
);

// Compound indexes for fast prerequisite matching
FranchiseRelationSchema.index({ franchiseRootMalId: 1, mal_id: 1 });

export const FranchiseRelationModel: Model<FranchiseRelationDocument> =
  model<FranchiseRelationDocument>('FranchiseRelation', FranchiseRelationSchema);
