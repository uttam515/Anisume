import { Schema, model, type Document, type Model, Types } from 'mongoose';

export interface SessionDocument extends Document {
  sessionId: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  lastActiveAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<SessionDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to auto-delete expired sessions
    },
    userAgent: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: 'sessions',
  }
);

export const SessionModel: Model<SessionDocument> = model<SessionDocument>('Session', SessionSchema);
export default SessionModel;

