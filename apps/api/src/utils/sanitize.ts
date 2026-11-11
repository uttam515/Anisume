import type { User, PublicUserProfile } from '@anisume/shared';
import type { UserDocument } from '../models/User.js';

/**
 * Returns a sanitized User representation for the authenticated user themselves.
 * NEVER includes passwordHash or internal fields.
 */
export function sanitizeUser(doc: UserDocument | any): User {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    _id: obj._id?.toString() || '',
    username: obj.username,
    email: obj.email,
    avatar: obj.avatar || null,
    bio: obj.bio || '',
    favoriteGenres: Array.isArray(obj.favoriteGenres) ? obj.favoriteGenres : [],
    isEmailVerified: Boolean(obj.isEmailVerified),
    emailVerifiedAt: obj.emailVerifiedAt ? new Date(obj.emailVerifiedAt).toISOString() : null,
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * Returns a sanitized public user profile suitable for display to any visitor.
 * NEVER includes private email, verification status, or password hashes.
 */
export function sanitizePublicUser(doc: UserDocument | any): PublicUserProfile {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    username: obj.username,
    avatar: obj.avatar || null,
    bio: obj.bio || '',
    favoriteGenres: Array.isArray(obj.favoriteGenres) ? obj.favoriteGenres : [],
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
  };
}

