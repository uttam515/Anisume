import { Router, type Request, type Response } from 'express';
import { AnimeModel } from '../models/Anime.js';

const router: Router = Router();

// GET /api/anime/featured - Top cinematic anime for the homepage hero carousel
router.get('/featured', async (_req: Request, res: Response) => {
  try {
    const featured = await AnimeModel.find({
      score: { $gte: 8.0 },
      'images.jpg.image_url': { $exists: true, $ne: '' },
      synopsis: { $exists: true, $ne: null },
    })
      .sort({ members: -1, score: -1 })
      .limit(6)
      .lean();

    res.json({ data: featured });
  } catch (error) {
    console.error('[API] /featured error:', error);
    res.status(500).json({ error: 'Failed to fetch featured anime' });
  }
});

// GET /api/anime/trending - Popular/trending TV anime
router.get('/trending', async (_req: Request, res: Response) => {
  try {
    const trending = await AnimeModel.find({
      type: 'tv',
      score: { $gte: 7.0 },
    })
      .sort({ members: -1, popularity: 1 })
      .limit(16)
      .lean();

    res.json({ data: trending });
  } catch (error) {
    console.error('[API] /trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending anime' });
  }
});

// GET /api/anime/top-rated - Highest rated anime
router.get('/top-rated', async (_req: Request, res: Response) => {
  try {
    const topRated = await AnimeModel.find({
      score: { $gte: 8.0 },
    })
      .sort({ score: -1, scored_by: -1 })
      .limit(16)
      .lean();

    res.json({ data: topRated });
  } catch (error) {
    console.error('[API] /top-rated error:', error);
    res.status(500).json({ error: 'Failed to fetch top rated anime' });
  }
});

// GET /api/anime/recent - Recently released anime
router.get('/recent', async (_req: Request, res: Response) => {
  try {
    const recent = await AnimeModel.find({
      year: { $gte: 2022 },
      'images.jpg.image_url': { $exists: true, $ne: '' },
    })
      .sort({ year: -1, score: -1, members: -1 })
      .limit(16)
      .lean();

    res.json({ data: recent });
  } catch (error) {
    console.error('[API] /recent error:', error);
    res.status(500).json({ error: 'Failed to fetch recent anime' });
  }
});

// GET /api/anime/movies - Popular anime movies
router.get('/movies', async (_req: Request, res: Response) => {
  try {
    const movies = await AnimeModel.find({
      type: 'movie',
      score: { $gte: 6.5 },
    })
      .sort({ members: -1, score: -1 })
      .limit(16)
      .lean();

    res.json({ data: movies });
  } catch (error) {
    console.error('[API] /movies error:', error);
    res.status(500).json({ error: 'Failed to fetch anime movies' });
  }
});

// GET /api/anime/genres - List of available genres with counts
router.get('/genres', async (_req: Request, res: Response) => {
  try {
    const genres = await AnimeModel.aggregate([
      { $unwind: '$genres' },
      {
        $group: {
          _id: '$genres.name',
          mal_id: { $first: '$genres.mal_id' },
          count: { $sum: 1 },
        },
      },
      { $match: { _id: { $ne: '' } } },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          name: '$_id',
          mal_id: 1,
          count: 1,
        },
      },
    ]);

    res.json({ data: genres });
  } catch (error) {
    console.error('[API] /genres error:', error);
    res.status(500).json({ error: 'Failed to fetch anime genres' });
  }
});

// GET /api/anime - Paginated list of anime with filtering, search, and sorting
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 24));
    const type = req.query.type as string | undefined;
    const queryStr = ((req.query.q || req.query.search || '') as string).trim();
    const genresParam = req.query.genres as string | string[] | undefined;
    const minScore = parseFloat(req.query.minScore as string);
    const year = parseInt(req.query.year as string, 10);
    const status = (req.query.status as string | undefined)?.trim();
    const sort = ((req.query.sort as string) || 'popularity').toLowerCase();

    const query: Record<string, unknown> = {};

    // 1. Type filter
    if (type === 'tv' || type === 'movie') {
      query.type = type;
    }

    // 2. Search query (title, title_english, title_japanese, synonyms, studios, producers)
    if (queryStr) {
      const escaped = queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query.$or = [
        { title: regex },
        { title_english: regex },
        { title_japanese: regex },
        { title_synonyms: regex },
        { 'studios.name': regex },
        { 'producers.name': regex },
      ];
    }

    // 3. Genre filter
    if (genresParam) {
      const genreList = (Array.isArray(genresParam) ? genresParam.join(',') : genresParam)
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);

      if (genreList.length > 0) {
        const genreRegexes = genreList.map((g) => new RegExp(`^${g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
        query['genres.name'] = { $all: genreRegexes };
      }
    }

    // 4. Min Score filter
    if (!isNaN(minScore) && minScore > 0) {
      query.score = { $gte: minScore };
    }

    // 5. Year filter
    if (!isNaN(year) && year > 1950) {
      query.year = year;
    }

    // 6. Status filter
    if (status && status !== 'all') {
      query.status = new RegExp(`^${status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    }

    // 7. Sorting
    let sortOptions: Record<string, 1 | -1> = { members: -1, score: -1 };
    switch (sort) {
      case 'score':
      case 'highest_rated':
        sortOptions = { score: -1, scored_by: -1 };
        break;
      case 'newest':
        sortOptions = { year: -1, 'aired.from': -1, _id: -1 };
        break;
      case 'oldest':
        sortOptions = { year: 1, 'aired.from': 1 };
        break;
      case 'title':
      case 'alphabetical':
        sortOptions = { title: 1 };
        break;
      case 'popularity':
      default:
        sortOptions = { members: -1, score: -1 };
        break;
    }

    const [animeList, total] = await Promise.all([
      AnimeModel.find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AnimeModel.countDocuments(query),
    ]);

    res.json({
      data: animeList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API] /anime error:', error);
    res.status(500).json({ error: 'Failed to fetch anime list' });
  }
});

// GET /api/anime/:mal_id - Detail of a single anime
router.get('/:mal_id', async (req: Request, res: Response) => {
  try {
    const malIdStr = req.params.mal_id;
    if (!malIdStr) {
      res.status(400).json({ error: 'Missing mal_id parameter' });
      return;
    }

    const malId = parseInt(malIdStr, 10);
    if (isNaN(malId)) {
      res.status(400).json({ error: 'Invalid mal_id parameter' });
      return;
    }

    const anime = await AnimeModel.findOne({ mal_id: malId }).lean();
    if (!anime) {
      res.status(404).json({ error: 'Anime not found', message: 'Anime not found' });
      return;
    }

    // If anime has relations with entry mal_ids, attempt to fetch their posters and types
    let relatedAnimeList: Array<{ mal_id: number; title: string; image_url: string; type: string; relation: string }> = [];
    if (Array.isArray(anime.relations) && anime.relations.length > 0) {
      const relationEntries: Array<{ mal_id: number; relation: string }> = [];
      for (const rel of anime.relations) {
        if (Array.isArray(rel.entry)) {
          for (const ent of rel.entry) {
            if (ent.mal_id) {
              relationEntries.push({ mal_id: ent.mal_id, relation: rel.relation });
            }
          }
        }
      }

      if (relationEntries.length > 0) {
        const relatedIds = relationEntries.map((r) => r.mal_id);
        const matchedDocs = await AnimeModel.find({ mal_id: { $in: relatedIds } })
          .select('mal_id title title_english images type score year')
          .lean();

        const docMap = new Map<number, (typeof matchedDocs)[0]>();
        for (const doc of matchedDocs) {
          docMap.set(doc.mal_id, doc);
        }

        relatedAnimeList = relationEntries
          .map((rel) => {
            const doc = docMap.get(rel.mal_id);
            if (!doc) return null;
            return {
              mal_id: doc.mal_id,
              title: doc.title_english || doc.title,
              image_url: doc.images?.jpg?.image_url || '',
              type: doc.type,
              relation: rel.relation,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);
      }
    }

    res.json({
      data: {
        ...anime,
        related_anime: relatedAnimeList,
      },
    });
  } catch (error) {
    console.error('[API] /anime/:mal_id error:', error);
    res.status(500).json({ error: 'Failed to fetch anime details' });
  }
});

export default router;
