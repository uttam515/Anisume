import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import { UserAnimeListModel } from '../models/UserAnimeList.js';
import { AnimeModel } from '../models/Anime.js';
import { requireAuth } from '../middleware/auth.js';
import type { WatchStatus } from '@anisume/shared';

const router: Router = Router();

// Valid statuses
const VALID_STATUSES: WatchStatus[] = ['watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped'];

/**
 * POST /api/library
 * Adds an anime to the authenticated user's library.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const { mal_id, status = 'plan_to_watch', episodesWatched = 0, userScore = null, notes = null, startDate = null, finishDate = null } = req.body || {};

    if (!mal_id || isNaN(parseInt(mal_id, 10))) {
      res.status(400).json({ error: 'Valid mal_id is required', code: 'INVALID_MAL_ID' });
      return;
    }

    const malId = parseInt(mal_id, 10);

    // 1. Verify anime exists in database
    const anime = await AnimeModel.findOne({ mal_id: malId });
    if (!anime) {
      res.status(404).json({ error: 'Anime not found in database', code: 'ANIME_NOT_FOUND' });
      return;
    }

    // 2. Prevent duplicate entries
    const existing = await UserAnimeListModel.findOne({ userId, mal_id: malId });
    if (existing) {
      res.status(409).json({
        error: 'This anime is already in your library. Use PATCH to update it.',
        code: 'ALREADY_IN_LIBRARY',
        data: existing,
      });
      return;
    }

    // 3. Validate status
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS',
      });
      return;
    }

    // 4. Validate userScore
    let parsedScore: number | null = null;
    if (userScore !== null && userScore !== undefined && userScore !== '') {
      parsedScore = parseInt(userScore, 10);
      if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 10) {
        res.status(400).json({
          error: 'Personal score must be an integer between 1 and 10.',
          code: 'INVALID_SCORE',
        });
        return;
      }
    }

    // 5. Validate episodesWatched
    let finalEpisodes = Math.max(0, parseInt(episodesWatched, 10) || 0);

    if (anime.type === 'movie') {
      // Movies cannot have multiple episode progress
      if (finalEpisodes > 1) {
        res.status(400).json({
          error: 'Movies do not have episode progress. Progress must be 0 or 1.',
          code: 'INVALID_PROGRESS_MOVIE',
        });
        return;
      }
    } else if (anime.episodes && anime.episodes > 0) {
      if (finalEpisodes > anime.episodes) {
        res.status(400).json({
          error: `Episodes watched (${finalEpisodes}) cannot exceed total episodes (${anime.episodes}).`,
          code: 'EPISODE_LIMIT_EXCEEDED',
        });
        return;
      }
    }

    // If marked completed and episodesWatched was not specified, default to full count
    if (status === 'completed' && anime.episodes && anime.episodes > 0 && finalEpisodes === 0) {
      finalEpisodes = anime.episodes;
    }

    // 6. Create library entry
    const entry = await UserAnimeListModel.create({
      userId,
      animeId: anime._id,
      mal_id: malId,
      status,
      episodesWatched: finalEpisodes,
      userScore: parsedScore,
      notes: typeof notes === 'string' ? notes.slice(0, 1000) : null,
      startDate: startDate ? new Date(startDate) : null,
      finishDate: finishDate ? new Date(finishDate) : status === 'completed' ? new Date() : null,
    });

    const populated = await entry.populate('animeId');

    res.status(201).json({
      message: 'Anime added to your library successfully.',
      data: {
        ...populated.toObject(),
        anime: populated.animeId,
      },
    });
  } catch (error) {
    console.error('[Library API] POST / error:', error);
    res.status(500).json({ error: 'Failed to add anime to library', code: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/library/stats
 * Summary statistics of the authenticated user's library.
 */
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!._id);

    const statsAgg = await UserAnimeListModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          watching: { $sum: { $cond: [{ $eq: ['$status', 'watching'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          plan_to_watch: { $sum: { $cond: [{ $eq: ['$status', 'plan_to_watch'] }, 1, 0] } },
          on_hold: { $sum: { $cond: [{ $eq: ['$status', 'on_hold'] }, 1, 0] } },
          dropped: { $sum: { $cond: [{ $eq: ['$status', 'dropped'] }, 1, 0] } },
          totalEpisodesWatched: { $sum: '$episodesWatched' },
          scores: {
            $push: {
              $cond: [{ $ne: ['$userScore', null] }, '$userScore', '$$REMOVE'],
            },
          },
        },
      },
    ]);

    const result = statsAgg[0] || {
      total: 0,
      watching: 0,
      completed: 0,
      plan_to_watch: 0,
      on_hold: 0,
      dropped: 0,
      totalEpisodesWatched: 0,
      scores: [],
    };

    let meanScore: number | null = null;
    if (result.scores && result.scores.length > 0) {
      const sum = result.scores.reduce((a: number, b: number) => a + b, 0);
      meanScore = Math.round((sum / result.scores.length) * 10) / 10;
    }

    res.json({
      stats: {
        total: result.total,
        watching: result.watching,
        completed: result.completed,
        plan_to_watch: result.plan_to_watch,
        on_hold: result.on_hold,
        dropped: result.dropped,
        meanScore,
        totalEpisodesWatched: result.totalEpisodesWatched,
      },
    });
  } catch (error) {
    console.error('[Library API] GET /stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve library statistics', code: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/library
 * Paginated, filterable, and searchable list of authenticated user's library entries.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!._id);
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 24));
    const status = (req.query.status as string)?.trim().toLowerCase();
    const queryStr = ((req.query.q || req.query.search || '') as string).trim();
    const sort = ((req.query.sort as string) || 'updated').toLowerCase();

    // Aggregation pipeline for populated anime searching and sorting
    const pipeline: any[] = [{ $match: { userId } }];

    // 1. Status Filter
    if (status && status !== 'all' && VALID_STATUSES.includes(status as WatchStatus)) {
      pipeline.push({ $match: { status } });
    }

    // 2. Join Anime Collection
    pipeline.push(
      {
        $lookup: {
          from: 'anime',
          localField: 'animeId',
          foreignField: '_id',
          as: 'anime',
        },
      },
      { $unwind: '$anime' }
    );

    // 3. Search Query Filter across title, english title, synonyms
    if (queryStr) {
      const escaped = queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'anime.title': regex },
            { 'anime.title_english': regex },
            { 'anime.title_japanese': regex },
          ],
        },
      });
    }

    // 4. Sort Options
    let sortStage: Record<string, 1 | -1> = { updatedAt: -1 };
    switch (sort) {
      case 'title':
        sortStage = { 'anime.title': 1 };
        break;
      case 'rating':
        sortStage = { userScore: -1, updatedAt: -1 };
        break;
      case 'score':
        sortStage = { 'anime.score': -1, updatedAt: -1 };
        break;
      case 'updated':
      default:
        sortStage = { updatedAt: -1 };
        break;
    }

    // 5. Facet for pagination and total count
    pipeline.push({
      $facet: {
        data: [{ $sort: sortStage }, { $skip: (page - 1) * limit }, { $limit: limit }],
        totalCount: [{ $count: 'total' }],
      },
    });

    const [facetResult] = await UserAnimeListModel.aggregate(pipeline);
    const data = facetResult?.data || [];
    const total = facetResult?.totalCount?.[0]?.total || 0;

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('[Library API] GET / error:', error);
    res.status(500).json({ error: 'Failed to retrieve anime library', code: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/library/:mal_id
 * Returns a specific library entry by MAL ID for the authenticated user, or null if not saved.
 */
router.get('/:mal_id', requireAuth, async (req: Request, res: Response) => {
  try {
    const malIdStr = req.params.mal_id || '';
    const malId = parseInt(malIdStr, 10);
    if (!malIdStr || isNaN(malId)) {
      res.status(400).json({ error: 'Invalid mal_id parameter', code: 'INVALID_MAL_ID' });
      return;
    }

    const entry = await UserAnimeListModel.findOne({
      userId: req.user!._id,
      mal_id: malId,
    }).populate('animeId');

    if (!entry) {
      res.json({ data: null });
      return;
    }

    res.json({
      data: {
        ...entry.toObject(),
        anime: entry.animeId,
      },
    });
  } catch (error) {
    console.error('[Library API] GET /:mal_id error:', error);
    res.status(500).json({ error: 'Failed to retrieve library item', code: 'SERVER_ERROR' });
  }
});

/**
 * PATCH /api/library/:mal_id
 * Updates watch status, episode progress, personal rating, or notes for an anime.
 */
router.patch('/:mal_id', requireAuth, async (req: Request, res: Response) => {
  try {
    const malIdStr = req.params.mal_id || '';
    const malId = parseInt(malIdStr, 10);
    if (!malIdStr || isNaN(malId)) {
      res.status(400).json({ error: 'Invalid mal_id parameter', code: 'INVALID_MAL_ID' });
      return;
    }

    // 1. Verify ownership and existence
    const entry = await UserAnimeListModel.findOne({
      userId: req.user!._id,
      mal_id: malId,
    });

    if (!entry) {
      res.status(404).json({ error: 'Anime not found in your library', code: 'NOT_FOUND' });
      return;
    }

    // 2. Load anime document to validate limits
    const anime = await AnimeModel.findById(entry.animeId);
    if (!anime) {
      res.status(404).json({ error: 'Associated anime document not found', code: 'ANIME_NOT_FOUND' });
      return;
    }

    const { status, episodesWatched, userScore, notes, startDate, finishDate } = req.body || {};

    // 3. Status update
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        res.status(400).json({
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        });
        return;
      }
      entry.status = status;

      // When transitioning to completed, auto-set progress to total if available and finishDate
      if (status === 'completed') {
        if (anime.episodes && anime.episodes > 0 && episodesWatched === undefined) {
          entry.episodesWatched = anime.episodes;
        }
        if (!entry.finishDate && finishDate === undefined) {
          entry.finishDate = new Date();
        }
      }
    }

    // 4. Episodes watched update
    if (episodesWatched !== undefined) {
      const epNum = parseInt(episodesWatched, 10);
      if (isNaN(epNum) || epNum < 0) {
        res.status(400).json({
          error: 'Episodes watched must be a non-negative integer.',
          code: 'INVALID_PROGRESS',
        });
        return;
      }

      if (anime.type === 'movie') {
        if (epNum > 1) {
          res.status(400).json({
            error: 'Movies do not have episode progress. Progress must be 0 or 1.',
            code: 'INVALID_PROGRESS_MOVIE',
          });
          return;
        }
      } else if (anime.episodes && anime.episodes > 0) {
        if (epNum > anime.episodes) {
          res.status(400).json({
            error: `Episodes watched (${epNum}) cannot exceed total episodes (${anime.episodes}).`,
            code: 'EPISODE_LIMIT_EXCEEDED',
          });
          return;
        }
      }

      entry.episodesWatched = epNum;
    }

    // 5. Personal rating update (1-10 or null to remove)
    if (userScore !== undefined) {
      if (userScore === null || userScore === '') {
        entry.userScore = null;
      } else {
        const scoreNum = parseInt(userScore, 10);
        if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 10) {
          res.status(400).json({
            error: 'Personal score must be an integer between 1 and 10.',
            code: 'INVALID_SCORE',
          });
          return;
        }
        entry.userScore = scoreNum;
      }
    }

    // 6. Notes update
    if (notes !== undefined) {
      entry.notes = notes === null || notes === '' ? null : String(notes).slice(0, 1000);
    }

    // 7. Dates update
    if (startDate !== undefined) {
      entry.startDate = startDate ? new Date(startDate) : null;
    }
    if (finishDate !== undefined) {
      entry.finishDate = finishDate ? new Date(finishDate) : null;
    }

    await entry.save();
    const populated = await entry.populate('animeId');

    res.json({
      message: 'Library item updated successfully.',
      data: {
        ...populated.toObject(),
        anime: populated.animeId,
      },
    });
  } catch (error) {
    console.error('[Library API] PATCH /:mal_id error:', error);
    res.status(500).json({ error: 'Failed to update library item', code: 'SERVER_ERROR' });
  }
});

/**
 * DELETE /api/library/:mal_id
 * Removes an anime from the authenticated user's library.
 */
router.delete('/:mal_id', requireAuth, async (req: Request, res: Response) => {
  try {
    const malIdStr = req.params.mal_id || '';
    const malId = parseInt(malIdStr, 10);
    if (!malIdStr || isNaN(malId)) {
      res.status(400).json({ error: 'Invalid mal_id parameter', code: 'INVALID_MAL_ID' });
      return;
    }

    const deleted = await UserAnimeListModel.findOneAndDelete({
      userId: req.user!._id,
      mal_id: malId,
    });

    if (!deleted) {
      res.status(404).json({ error: 'Anime not found in your library', code: 'NOT_FOUND' });
      return;
    }

    res.json({
      message: 'Anime removed from your library successfully.',
      mal_id: malId,
    });
  } catch (error) {
    console.error('[Library API] DELETE /:mal_id error:', error);
    res.status(500).json({ error: 'Failed to remove anime from library', code: 'SERVER_ERROR' });
  }
});

export default router;
