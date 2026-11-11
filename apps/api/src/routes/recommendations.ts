import { Router, type Request, type Response } from 'express';
import { recommendationEngine } from '../services/recommendationEngine.js';
import { UserPreferenceModel } from '../models/UserPreference.js';
import { UserAnimeListModel } from '../models/UserAnimeList.js';
import { AnimeModel } from '../models/Anime.js';
import { requireAuth } from '../middleware/auth.js';
import type { RecommendationCategory } from '@anisume/shared';

const router: Router = Router();

/**
 * GET /api/recommendations/categorized
 * Returns all 5 distinct recommendation categories (Recommended For You, Because You Liked,
 * Hidden Gems, Highly Rated Picks, Continue Your Journey).
 */
router.get('/categorized', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const categorized = await recommendationEngine.getCategorizedRecommendations(userId);
    res.json({ data: categorized });
  } catch (error) {
    console.error('[API] GET /api/recommendations/categorized error:', error);
    res.status(500).json({ error: 'Failed to generate categorized recommendations' });
  }
});

/**
 * GET /api/recommendations
 * Generates personalized anime recommendations for the authenticated user with pagination and optional category filter.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit as string, 10) || 18));
    const typeParam = req.query.type as string | undefined;
    const categoryParam = req.query.category as string | undefined;

    let targetType: 'all' | 'tv' | 'movie' = 'all';
    if (typeParam === 'tv' || typeParam === 'movie') {
      targetType = typeParam;
    }

    let targetCategory: RecommendationCategory | undefined;
    if (
      categoryParam === 'for_you' ||
      categoryParam === 'hidden_gems' ||
      categoryParam === 'top_rated' ||
      categoryParam === 'continue_journey' ||
      categoryParam === 'because_you_liked'
    ) {
      targetCategory = categoryParam;
    }

    const result = await recommendationEngine.getRecommendationsForUser(userId, {
      type: targetType,
      category: targetCategory,
      page,
      limit,
    });

    res.json({
      data: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      meta: {
        questionnaireCompleted: result.questionnaireCompleted,
        category: targetCategory,
        preferencesSummary: result.preferencesSummary,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * GET /api/recommendations/similar/:mal_id
 * Returns similar anime for dynamic onboarding taste selection & anime details.
 */
router.get('/similar/:mal_id', requireAuth, async (req: Request, res: Response) => {
  try {
    const malIdStr = req.params.mal_id;
    if (!malIdStr) {
      res.status(400).json({ error: 'Missing mal_id parameter' });
      return;
    }

    const malId = parseInt(malIdStr, 10);
    if (isNaN(malId)) {
      res.status(400).json({ error: 'Invalid mal_id' });
      return;
    }

    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string, 10) || 4));

    // Exclude IDs passed in query (e.g. ?exclude=1,2,3)
    const excludeStr = req.query.exclude as string | undefined;
    const excludeIds: number[] = excludeStr
      ? excludeStr
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id))
      : [];

    const sourceAnime = await AnimeModel.findOne({ mal_id: malId })
      .select('mal_id title title_english images')
      .lean();

    if (!sourceAnime) {
      res.status(404).json({ error: 'Source anime not found' });
      return;
    }

    const similar = await recommendationEngine.getSimilarAnime(malId, limit, excludeIds);

    res.json({
      data: {
        sourceAnime: {
          mal_id: sourceAnime.mal_id,
          title: sourceAnime.title_english || sourceAnime.title,
          image_url:
            sourceAnime.images?.webp?.image_url ||
            sourceAnime.images?.jpg?.image_url ||
            '',
        },
        similar,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/recommendations/similar error:', error);
    res.status(500).json({ error: 'Failed to find similar anime' });
  }
});

/**
 * GET /api/recommendations/profile
 * Returns a summary of the user's computed recommendation profile.
 */
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;

    const prefs = await UserPreferenceModel.findOne({ userId }).lean();

    const favoriteIds = prefs?.favoriteAnimeIds || [];
    let favoriteAnimeDetails: any[] = [];

    if (favoriteIds.length > 0) {
      const favorites = await AnimeModel.find({ mal_id: { $in: favoriteIds } })
        .select('mal_id title title_english images type score')
        .lean();

      favoriteAnimeDetails = favorites.map((a) => ({
        mal_id: a.mal_id,
        title: a.title_english || a.title,
        image_url: a.images?.webp?.image_url || a.images?.jpg?.image_url || '',
        type: a.type,
        score: a.score,
      }));
    }

    const signals = await recommendationEngine.getTasteProfileSignals(userId);

    res.json({
      data: {
        questionnaireCompleted: Boolean(prefs?.questionnaireCompleted),
        preferences: prefs
          ? {
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
              questionnaireCompleted: prefs.questionnaireCompleted,
              preferencesUpdatedAt: prefs.preferencesUpdatedAt?.toISOString(),
            }
          : null,
        favoriteAnimeDetails,
        topGenres: prefs?.favoriteGenres || [],
        topThemes: prefs?.favoriteThemes || [],
        negativeGenres: signals.negativeGenres,
        negativeThemes: signals.negativeThemes,
        positiveTasteSignals: signals.positiveTasteSignals,
        negativeTasteSignals: signals.negativeTasteSignals,
        libraryLearnedStats: signals.libraryLearnedStats,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/recommendations/profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve recommendation profile' });
  }
});

/**
 * GET /api/recommendations/metadata
 * Returns available genres, themes, and curated starter anime for questionnaire.
 */
router.get('/metadata', async (_req: Request, res: Response) => {
  try {
    // 1. Get top genres with counts
    const genres = await AnimeModel.aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres.name', count: { $sum: 1 } } },
      { $match: { _id: { $ne: '' } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);

    // 2. Get top themes with counts
    const themes = await AnimeModel.aggregate([
      { $unwind: '$themes' },
      { $group: { _id: '$themes.name', count: { $sum: 1 } } },
      { $match: { _id: { $ne: '' } } },
      { $sort: { count: -1 } },
      { $limit: 30 },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);

    // 3. Get starter anime for the Spotify-style taste questionnaire
    const starters = await AnimeModel.find({
      score: { $gte: 7.8 },
      members: { $gte: 150000 },
      'images.jpg.image_url': { $exists: true, $ne: '' },
    })
      .sort({ members: -1 })
      .limit(30)
      .select('mal_id title title_english type year score images genres themes')
      .lean();

    res.json({
      data: {
        genres: genres.map((g) => g.name),
        themes: themes.map((t) => t.name),
        starters,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/recommendations/metadata error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendation metadata' });
  }
});

/**
 * POST /api/recommendations/feedback
 * Records user feedback on a recommendation: loved it ('like'), disliked ('dislike'), or watched ('watched').
 * Immediately applies taste signals to preferences and returns a fresh replacement recommendation.
 */
router.post('/feedback', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const { mal_id, feedback, excludeIds } = req.body;

    if (!mal_id || typeof mal_id !== 'number') {
      res.status(400).json({ error: 'Valid numeric mal_id is required' });
      return;
    }

    if (!['like', 'dislike', 'watched', 'none'].includes(feedback)) {
      res.status(400).json({ error: 'Feedback must be "like", "dislike", "watched", or "none"' });
      return;
    }

    let prefs = await UserPreferenceModel.findOne({ userId });
    if (!prefs) {
      prefs = new UserPreferenceModel({ userId });
    }

    const currentFavorites = new Set(prefs.favoriteAnimeIds || []);
    const currentDislikes = new Set((prefs as any).dislikedAnimeIds || []);

    const animeDoc = await AnimeModel.findOne({ mal_id }).lean();

    if (feedback === 'like') {
      currentFavorites.add(mal_id);
      currentDislikes.delete(mal_id);

      // Learn user taste: incorporate genres and themes into preferences
      if (animeDoc) {
        const currentFavGenres = new Set(prefs.favoriteGenres || []);
        (animeDoc.genres || []).forEach((g) => currentFavGenres.add(g.name));
        prefs.favoriteGenres = Array.from(currentFavGenres);

        const currentFavThemes = new Set(prefs.favoriteThemes || []);
        (animeDoc.themes || []).forEach((t) => currentFavThemes.add(t.name));
        prefs.favoriteThemes = Array.from(currentFavThemes);
      }
    } else if (feedback === 'dislike') {
      currentDislikes.add(mal_id);
      currentFavorites.delete(mal_id);
    } else if (feedback === 'watched') {
      currentFavorites.add(mal_id);
      currentDislikes.delete(mal_id);

      // Save to user library as completed
      if (animeDoc) {
        await UserAnimeListModel.findOneAndUpdate(
          { userId, mal_id },
          {
            $set: {
              userId,
              animeId: animeDoc._id,
              mal_id,
              status: 'completed',
              finishDate: new Date(),
            },
          },
          { upsert: true, new: true }
        );
      }
    } else {
      currentFavorites.delete(mal_id);
      currentDislikes.delete(mal_id);
    }

    prefs.favoriteAnimeIds = Array.from(currentFavorites);
    (prefs as any).dislikedAnimeIds = Array.from(currentDislikes);
    prefs.preferencesUpdatedAt = new Date();
    await prefs.save();

    // Fetch fresh replacement recommendation
    const parsedExclude = Array.isArray(excludeIds)
      ? excludeIds.map((id) => Number(id)).filter((id) => !isNaN(id))
      : [];

    const replacementItem = await recommendationEngine.getSingleReplacementRecommendation(
      userId,
      parsedExclude,
      feedback,
      mal_id
    );

    res.json({
      data: {
        mal_id,
        feedback,
        favoriteAnimeIds: prefs.favoriteAnimeIds,
        dislikedAnimeIds: (prefs as any).dislikedAnimeIds,
        replacementItem,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/recommendations/feedback error:', error);
    res.status(500).json({ error: 'Failed to save recommendation feedback' });
  }
});

export default router;

