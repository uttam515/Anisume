import { Router, type Request, type Response } from 'express';
import { UserPreferenceModel } from '../models/UserPreference.js';
import { UserModel } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import type {
  AnimeFormatPreference,
  AnimeLengthPreference,
  AnimeEraPreference,
} from '@anisume/shared';

const router: Router = Router();

const VALID_FORMATS: AnimeFormatPreference[] = ['tv', 'movie', 'both'];
const VALID_LENGTHS: AnimeLengthPreference[] = ['short', 'medium', 'long', 'very_long', 'any'];
const VALID_ERAS: AnimeEraPreference[] = ['pre_2000', '2000_2009', '2010_2019', '2020_plus', 'any'];

/**
 * GET /api/preferences
 * Retrieves the authenticated user's recommendation preferences.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;

    let prefs = await UserPreferenceModel.findOne({ userId }).lean();

    if (!prefs) {
      // Create initial empty preferences
      const created = await UserPreferenceModel.create({
        userId,
        favoriteGenres: req.user!.favoriteGenres || [],
        favoriteThemes: [],
        preferredFormats: ['both'],
        preferredLength: ['any'],
        preferredEras: ['any'],
        favoriteAnimeIds: [],
        questionnaireCompleted: false,
        preferencesUpdatedAt: new Date(),
      });
      prefs = created.toObject() as any;
    }

    if (!prefs) {
      res.status(500).json({ error: 'Failed to initialize preferences' });
      return;
    }

    res.json({
      data: {
        _id: prefs._id.toString(),
        userId: prefs.userId.toString(),
        favoriteGenres: prefs.favoriteGenres || [],
        favoriteThemes: prefs.favoriteThemes || [],
        negativeGenres: prefs.negativeGenres || [],
        negativeThemes: prefs.negativeThemes || [],
        preferredFormats: prefs.preferredFormats || ['both'],
        preferredLength: prefs.preferredLength || ['any'],
        preferredEras: prefs.preferredEras || ['any'],
        favoriteAnimeIds: prefs.favoriteAnimeIds || [],
        questionnaireCompleted: Boolean(prefs.questionnaireCompleted),
        preferencesUpdatedAt: prefs.preferencesUpdatedAt ? prefs.preferencesUpdatedAt.toISOString() : new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] GET /api/preferences error:', error);
    res.status(500).json({ error: 'Failed to retrieve preferences' });
  }
});

/**
 * PUT /api/preferences
 * Updates or completes the user's recommendation preferences.
 */
router.put('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const body = req.body || {};

    const updateData: Record<string, any> = {
      preferencesUpdatedAt: new Date(),
    };

    // 1. Validate favoriteGenres
    if (body.favoriteGenres !== undefined) {
      if (!Array.isArray(body.favoriteGenres)) {
        res.status(400).json({ error: 'favoriteGenres must be an array of strings' });
        return;
      }
      updateData.favoriteGenres = body.favoriteGenres
        .filter((g: any) => typeof g === 'string')
        .map((g: string) => g.trim())
        .filter(Boolean);

      // Keep user.favoriteGenres synced
      await UserModel.findByIdAndUpdate(userId, {
        favoriteGenres: updateData.favoriteGenres,
      });
    }

    // 2. Validate favoriteThemes
    if (body.favoriteThemes !== undefined) {
      if (!Array.isArray(body.favoriteThemes)) {
        res.status(400).json({ error: 'favoriteThemes must be an array of strings' });
        return;
      }
      updateData.favoriteThemes = body.favoriteThemes
        .filter((t: any) => typeof t === 'string')
        .map((t: string) => t.trim())
        .filter(Boolean);
    }

    // 2b. Validate negativeGenres (V2)
    if (body.negativeGenres !== undefined) {
      if (!Array.isArray(body.negativeGenres)) {
        res.status(400).json({ error: 'negativeGenres must be an array of strings' });
        return;
      }
      updateData.negativeGenres = body.negativeGenres
        .filter((g: any) => typeof g === 'string')
        .map((g: string) => g.trim())
        .filter(Boolean);
    }

    // 2c. Validate negativeThemes (V2)
    if (body.negativeThemes !== undefined) {
      if (!Array.isArray(body.negativeThemes)) {
        res.status(400).json({ error: 'negativeThemes must be an array of strings' });
        return;
      }
      updateData.negativeThemes = body.negativeThemes
        .filter((t: any) => typeof t === 'string')
        .map((t: string) => t.trim())
        .filter(Boolean);
    }

    // 3. Validate preferredFormats
    if (body.preferredFormats !== undefined) {
      if (!Array.isArray(body.preferredFormats)) {
        res.status(400).json({ error: 'preferredFormats must be an array' });
        return;
      }
      const valid = body.preferredFormats.filter((f: any) => VALID_FORMATS.includes(f));
      updateData.preferredFormats = valid.length > 0 ? valid : ['both'];
    }

    // 4. Validate preferredLength
    if (body.preferredLength !== undefined) {
      if (!Array.isArray(body.preferredLength)) {
        res.status(400).json({ error: 'preferredLength must be an array' });
        return;
      }
      const valid = body.preferredLength.filter((l: any) => VALID_LENGTHS.includes(l));
      updateData.preferredLength = valid.length > 0 ? valid : ['any'];
    }

    // 5. Validate preferredEras
    if (body.preferredEras !== undefined) {
      if (!Array.isArray(body.preferredEras)) {
        res.status(400).json({ error: 'preferredEras must be an array' });
        return;
      }
      const valid = body.preferredEras.filter((e: any) => VALID_ERAS.includes(e));
      updateData.preferredEras = valid.length > 0 ? valid : ['any'];
    }

    // 6. Validate favoriteAnimeIds
    if (body.favoriteAnimeIds !== undefined) {
      if (!Array.isArray(body.favoriteAnimeIds)) {
        res.status(400).json({ error: 'favoriteAnimeIds must be an array of numbers' });
        return;
      }
      updateData.favoriteAnimeIds = body.favoriteAnimeIds
        .map((id: any) => parseInt(id, 10))
        .filter((id: number) => !isNaN(id) && id > 0);
    }

    // 7. Validate questionnaireCompleted
    if (body.questionnaireCompleted !== undefined) {
      updateData.questionnaireCompleted = Boolean(body.questionnaireCompleted);
    }

    const updated = await UserPreferenceModel.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    ).lean();

    res.json({
      message: 'Preferences updated successfully',
      data: {
        _id: updated._id.toString(),
        userId: updated.userId.toString(),
        favoriteGenres: updated.favoriteGenres,
        favoriteThemes: updated.favoriteThemes,
        negativeGenres: updated.negativeGenres || [],
        negativeThemes: updated.negativeThemes || [],
        preferredFormats: updated.preferredFormats,
        preferredLength: updated.preferredLength,
        preferredEras: updated.preferredEras,
        favoriteAnimeIds: updated.favoriteAnimeIds,
        questionnaireCompleted: updated.questionnaireCompleted,
        preferencesUpdatedAt: updated.preferencesUpdatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] PUT /api/preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
