import { Router, type Request, type Response } from 'express';
import { UserModel } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { sanitizeUser, sanitizePublicUser } from '../utils/sanitize.js';

const router: Router = Router();

/**
 * GET /api/users/me
 * Retrieves current authenticated user's profile.
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: sanitizeUser(req.user!) });
});

/**
 * PATCH /api/users/me
 * Updates authenticated user's own profile fields (bio, avatar, favoriteGenres).
 * Cannot modify another user's account.
 */
router.patch('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { avatar, bio, favoriteGenres } = req.body || {};

    if (avatar !== undefined) {
      if (avatar === null || avatar === '') {
        user.avatar = null;
      } else if (typeof avatar === 'string' && avatar.length <= 500) {
        user.avatar = avatar.trim();
      } else {
        res.status(400).json({ error: 'Avatar URL must be a valid string up to 500 characters.' });
        return;
      }
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 500) {
        res.status(400).json({ error: 'Bio must be a string up to 500 characters.' });
        return;
      }
      user.bio = bio.trim();
    }

    if (favoriteGenres !== undefined) {
      if (!Array.isArray(favoriteGenres)) {
        res.status(400).json({ error: 'favoriteGenres must be an array of genre names.' });
        return;
      }
      // Sanitize genre names: strings only, max 50 items
      const sanitized = favoriteGenres
        .filter((g): g is string => typeof g === 'string')
        .map((g) => g.trim())
        .filter(Boolean)
        .slice(0, 50);

      user.favoriteGenres = Array.from(new Set(sanitized));
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('[Users] PATCH /me error:', error);
    res.status(500).json({ error: 'Failed to update user profile', code: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/users/:username
 * Public user profile retrieval.
 * Strict privacy guarantee: Never exposes private email, verification status, or password hashes.
 */
router.get('/:username', async (req: Request, res: Response) => {
  try {
    const usernameParam = (req.params.username || '').trim().toLowerCase();

    if (!usernameParam) {
      res.status(400).json({ error: 'Username parameter is required.' });
      return;
    }

    const user = await UserModel.findOne({ username: usernameParam });
    if (!user) {
      res.status(404).json({ error: 'User not found.', code: 'USER_NOT_FOUND' });
      return;
    }

    res.json({
      user: sanitizePublicUser(user),
    });
  } catch (error) {
    console.error('[Users] GET /:username error:', error);
    res.status(500).json({ error: 'Failed to fetch public profile', code: 'SERVER_ERROR' });
  }
});

export default router;

