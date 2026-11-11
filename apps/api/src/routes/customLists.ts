import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import { CustomListModel } from '../models/CustomList.js';
import { AnimeModel } from '../models/Anime.js';
import { requireAuth } from '../middleware/auth.js';

const router: Router = Router();

/**
 * GET /api/lists
 * Retrieves all custom lists created by the authenticated user.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;

    const lists = await CustomListModel.find({ userId }).sort({ updatedAt: -1 }).lean();

    // Fetch poster images for the first 4 items in each list for card preview
    const enhancedLists = await Promise.all(
      lists.map(async (list) => {
        const previewMalIds = (list.entries || []).slice(0, 4).map((e) => e.mal_id);
        const animeThumbnails = await AnimeModel.find({ mal_id: { $in: previewMalIds } })
          .select('mal_id images.jpg.image_url images.webp.image_url')
          .lean();

        const previewImages = previewMalIds
          .map((id) => {
            const match = animeThumbnails.find((a) => a.mal_id === id);
            return match?.images?.webp?.image_url || match?.images?.jpg?.image_url || '';
          })
          .filter(Boolean);

        return {
          _id: list._id.toString(),
          userId: list.userId.toString(),
          name: list.name,
          description: list.description,
          isPublic: list.isPublic,
          entriesCount: list.entries?.length || 0,
          previewImages,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        };
      })
    );

    res.json({ data: enhancedLists });
  } catch (error) {
    console.error('[API] GET /api/lists error:', error);
    res.status(500).json({ error: 'Failed to retrieve custom lists' });
  }
});

/**
 * POST /api/lists
 * Creates a new custom list.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const { name, description = '', isPublic = false } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'List name is required' });
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      res.status(400).json({ error: 'List name cannot exceed 100 characters' });
      return;
    }

    // Check for duplicate name for this user
    const existing = await CustomListModel.findOne({
      userId,
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      res.status(409).json({ error: 'You already have a list with this name' });
      return;
    }

    const newList = await CustomListModel.create({
      userId,
      name: trimmedName,
      description: typeof description === 'string' ? description.trim() : '',
      isPublic: Boolean(isPublic),
      entries: [],
    });

    res.status(201).json({
      message: 'Custom list created successfully',
      data: {
        _id: newList._id.toString(),
        userId: newList.userId.toString(),
        name: newList.name,
        description: newList.description,
        isPublic: newList.isPublic,
        entriesCount: 0,
        previewImages: [],
        createdAt: newList.createdAt,
        updatedAt: newList.updatedAt,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/lists error:', error);
    res.status(500).json({ error: 'Failed to create custom list' });
  }
});

/**
 * GET /api/lists/check/:mal_id
 * Returns array of list IDs that contain this anime.
 */
router.get('/check/:mal_id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const malIdStr = req.params.mal_id;
    if (!malIdStr) {
      res.status(400).json({ error: 'Missing mal_id' });
      return;
    }
    const malId = parseInt(malIdStr, 10);

    if (isNaN(malId)) {
      res.status(400).json({ error: 'Invalid mal_id' });
      return;
    }

    const lists = await CustomListModel.find(
      { userId, 'entries.mal_id': malId },
      { _id: 1, name: 1 }
    ).lean();

    res.json({
      data: {
        containingListIds: lists.map((l) => l._id.toString()),
      },
    });
  } catch (error) {
    console.error('[API] GET /api/lists/check error:', error);
    res.status(500).json({ error: 'Failed to check anime in lists' });
  }
});

/**
 * GET /api/lists/:id
 * Retrieves a single custom list with full anime details.
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const id = req.params.id;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid list ID' });
      return;
    }

    const list = await CustomListModel.findOne({ _id: id, userId }).lean();
    if (!list) {
      res.status(404).json({ error: 'Custom list not found' });
      return;
    }

    // Populate anime records
    const malIds = (list.entries || []).map((e) => e.mal_id);
    const animeDocs = await AnimeModel.find({ mal_id: { $in: malIds } }).lean();

    const populatedEntries = (list.entries || []).map((entry) => {
      const anime = animeDocs.find((a) => a.mal_id === entry.mal_id);
      return {
        mal_id: entry.mal_id,
        animeId: entry.animeId?.toString(),
        title: anime?.title_english || anime?.title || 'Unknown Title',
        image_url: anime?.images?.webp?.image_url || anime?.images?.jpg?.image_url || '',
        type: anime?.type || 'TV',
        score: anime?.score ?? null,
        episodes: anime?.episodes ?? null,
        addedAt: entry.addedAt ? entry.addedAt.toISOString() : new Date().toISOString(),
      };
    });

    res.json({
      data: {
        _id: list._id.toString(),
        userId: list.userId.toString(),
        name: list.name,
        description: list.description,
        isPublic: list.isPublic,
        entriesCount: populatedEntries.length,
        entries: populatedEntries,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/lists/:id error:', error);
    res.status(500).json({ error: 'Failed to retrieve custom list' });
  }
});

/**
 * PATCH /api/lists/:id
 * Updates list name, description, or visibility.
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const id = req.params.id;
    const { name, description, isPublic } = req.body || {};

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid list ID' });
      return;
    }

    const list = await CustomListModel.findOne({ _id: id, userId });
    if (!list) {
      res.status(404).json({ error: 'Custom list not found' });
      return;
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'List name cannot be empty' });
        return;
      }
      list.name = name.trim();
    }

    if (description !== undefined) {
      list.description = typeof description === 'string' ? description.trim() : '';
    }

    if (isPublic !== undefined) {
      list.isPublic = Boolean(isPublic);
    }

    await list.save();

    res.json({
      message: 'Custom list updated successfully',
      data: {
        _id: list._id.toString(),
        name: list.name,
        description: list.description,
        isPublic: list.isPublic,
        updatedAt: list.updatedAt,
      },
    });
  } catch (error) {
    console.error('[API] PATCH /api/lists/:id error:', error);
    res.status(500).json({ error: 'Failed to update custom list' });
  }
});

/**
 * DELETE /api/lists/:id
 * Deletes a custom list.
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const id = req.params.id;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid list ID' });
      return;
    }

    const result = await CustomListModel.findOneAndDelete({ _id: id, userId });
    if (!result) {
      res.status(404).json({ error: 'Custom list not found' });
      return;
    }

    res.json({ message: 'Custom list deleted successfully' });
  } catch (error) {
    console.error('[API] DELETE /api/lists/:id error:', error);
    res.status(500).json({ error: 'Failed to delete custom list' });
  }
});

/**
 * POST /api/lists/:id/anime
 * Adds an anime to the custom list.
 */
router.post('/:id/anime', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const id = req.params.id;
    const { mal_id } = req.body || {};

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid list ID' });
      return;
    }

    const malId = parseInt(mal_id, 10);
    if (isNaN(malId)) {
      res.status(400).json({ error: 'Valid mal_id is required' });
      return;
    }

    const list = await CustomListModel.findOne({ _id: id, userId });
    if (!list) {
      res.status(404).json({ error: 'Custom list not found' });
      return;
    }

    // Check if anime exists in DB
    const anime = await AnimeModel.findOne({ mal_id: malId });
    if (!anime) {
      res.status(404).json({ error: 'Anime not found' });
      return;
    }

    // Check if already in list
    const alreadyInList = list.entries.some((e) => e.mal_id === malId);
    if (alreadyInList) {
      res.status(409).json({ error: 'Anime is already in this list' });
      return;
    }

    list.entries.push({
      mal_id: malId,
      animeId: anime._id as Types.ObjectId,
      addedAt: new Date(),
    });

    await list.save();

    res.json({
      message: `Added "${anime.title_english || anime.title}" to "${list.name}"`,
      data: {
        listId: list._id.toString(),
        entriesCount: list.entries.length,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/lists/:id/anime error:', error);
    res.status(500).json({ error: 'Failed to add anime to custom list' });
  }
});

/**
 * DELETE /api/lists/:id/anime/:mal_id
 * Removes an anime from the custom list.
 */
router.delete('/:id/anime/:mal_id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const id = req.params.id;
    const malIdStr = req.params.mal_id;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid list ID' });
      return;
    }

    if (!malIdStr) {
      res.status(400).json({ error: 'Missing mal_id' });
      return;
    }

    const malId = parseInt(malIdStr, 10);
    if (isNaN(malId)) {
      res.status(400).json({ error: 'Valid mal_id is required' });
      return;
    }

    const list = await CustomListModel.findOne({ _id: id, userId });
    if (!list) {
      res.status(404).json({ error: 'Custom list not found' });
      return;
    }

    const initialLength = list.entries.length;
    list.entries = list.entries.filter((e) => e.mal_id !== malId);

    if (list.entries.length === initialLength) {
      res.status(404).json({ error: 'Anime not found in this list' });
      return;
    }

    await list.save();

    res.json({
      message: 'Anime removed from custom list',
      data: {
        listId: list._id.toString(),
        entriesCount: list.entries.length,
      },
    });
  } catch (error) {
    console.error('[API] DELETE /api/lists/:id/anime/:mal_id error:', error);
    res.status(500).json({ error: 'Failed to remove anime from custom list' });
  }
});

export default router;
