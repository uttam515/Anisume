import { Schema, model, type Document, type Model, Types } from 'mongoose';

export type TokenType = 'email_verification' | 'password_reset';

export interface TokenDocument extends Document {
  userId: Types.ObjectId;
  type: TokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

const TokenSchema = new Schema<TokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['email_verification', 'password_reset'],
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to auto-delete expired tokens
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: 'tokens',
  }
);

// Compound index to quickly find active unused tokens by hash and type
TokenSchema.index({ tokenHash: 1, type: 1, usedAt: 1 });

export const TokenModel: Model<TokenDocument> = model<TokenDocument>('Token', TokenSchema);
export default TokenModel;

