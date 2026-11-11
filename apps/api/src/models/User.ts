import { Schema, model, type Document, type Model } from 'mongoose';

export interface UserDocument extends Document {
  username: string;
  email: string;
  passwordHash: string;
  avatar: string | null;
  bio: string;
  favoriteGenres: string[];
  isEmailVerified: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address format'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never return password hash in regular queries
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    favoriteGenres: {
      type: [String],
      default: [],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'users',
  }
);

export const UserModel: Model<UserDocument> = model<UserDocument>('User', UserSchema);
export default UserModel;
