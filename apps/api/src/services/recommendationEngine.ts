import { Types } from 'mongoose';
import { AnimeModel, type AnimeDocument } from '../models/Anime.js';
import { UserAnimeListModel } from '../models/UserAnimeList.js';
import { UserPreferenceModel } from '../models/UserPreference.js';
import { franchiseService } from './franchiseService.js';
import type {
  Anime,
  RecommendedAnimeItem,
  RecommendationExplanation,
  RecommendationCategory,
  AnimeLengthPreference,
  AnimeEraPreference,
  CategorizedRecommendationsResponse,
  RecommendationSet,
} from '@anisume/shared';

export interface RecommendationWeights {
  genre: number;
  theme: number;
  favorite: number;
  library: number;
  format: number;
  length: number;
  era: number;
  quality: number;
}

export const DEFAULT_WEIGHTS: RecommendationWeights = {
  genre: 0.25,
  theme: 0.20,
  favorite: 0.20,
  library: 0.15,
  format: 0.08,
  length: 0.04,
  era: 0.04,
  quality: 0.04,
};

interface SeedProfile {
  genres: Map<string, number>;
  themes: Map<string, number>;
  demographics: Set<string>;
  studios: Set<string>;
  types: Set<string>;
  seedTitles: string[];
}

interface LibraryProfile {
  completedMalIds: Set<number>;
  allLibraryMalIds: Set<number>;
  highRatedTitles: Array<{ mal_id: number; title: string; score: number }>;
  likedGenres: Map<string, number>;
  likedThemes: Map<string, number>;
  dislikedGenres: Map<string, number>;
  dislikedThemes: Map<string, number>;
  droppedAnimeMalIds: Set<number>;
}

/**
 * Checks if anime matches length preference
 */
function matchesLengthPreference(anime: AnimeDocument, prefs: AnimeLengthPreference[]): boolean {
  if (prefs.length === 0 || prefs.includes('any')) return true;

  const isMovie = anime.type === 'movie';
  const eps = anime.episodes ?? 1;

  for (const pref of prefs) {
    if (pref === 'short') {
      if (!isMovie && eps >= 1 && eps <= 12) return true;
      if (isMovie) return true;
    } else if (pref === 'medium') {
      if (!isMovie && eps >= 13 && eps <= 26) return true;
      if (isMovie) return true;
    } else if (pref === 'long') {
      if (!isMovie && eps >= 27 && eps <= 100) return true;
    } else if (pref === 'very_long') {
      if (!isMovie && eps > 100) return true;
    }
  }
  return false;
}

/**
 * Checks if anime matches release era preference
 */
function matchesEraPreference(anime: AnimeDocument, prefs: AnimeEraPreference[]): boolean {
  if (prefs.length === 0 || prefs.includes('any')) return true;

  const year = anime.year || (anime.aired?.prop?.from?.year ?? null);
  if (!year) return false;

  for (const pref of prefs) {
    if (pref === 'pre_2000' && year < 2000) return true;
    if (pref === '2000_2009' && year >= 2000 && year <= 2009) return true;
    if (pref === '2010_2019' && year >= 2010 && year <= 2019) return true;
    if (pref === '2020_plus' && year >= 2020) return true;
  }
  return false;
}

/**
 * Builds user's library taste profile from watch history, ratings, and dropped items
 */
async function buildLibraryProfile(userId: Types.ObjectId | string): Promise<LibraryProfile> {
  const profile: LibraryProfile = {
    completedMalIds: new Set(),
    allLibraryMalIds: new Set(),
    highRatedTitles: [],
    likedGenres: new Map(),
    likedThemes: new Map(),
    dislikedGenres: new Map(),
    dislikedThemes: new Map(),
    droppedAnimeMalIds: new Set(),
  };

  const libraryEntries = await UserAnimeListModel.find({ userId }).lean();
  if (libraryEntries.length === 0) return profile;

  const malIds = libraryEntries.map((e) => e.mal_id);
  const animeDocs = await AnimeModel.find({ mal_id: { $in: malIds } })
    .select('mal_id title title_english genres themes')
    .lean();

  const animeMap = new Map<number, any>();
  for (const a of animeDocs) {
    animeMap.set(a.mal_id, a);
  }

  for (const entry of libraryEntries) {
    profile.allLibraryMalIds.add(entry.mal_id);
    const anime = animeMap.get(entry.mal_id);

    if (entry.status === 'completed') {
      profile.completedMalIds.add(entry.mal_id);

      const score = entry.userScore;
      if (score && score >= 8 && anime) {
        profile.highRatedTitles.push({
          mal_id: entry.mal_id,
          title: anime.title_english || anime.title,
          score,
        });

        // Boost genres and themes of 8-10 rated anime
        (anime.genres || []).forEach((g: any) => {
          if (g.name) profile.likedGenres.set(g.name.toLowerCase(), (profile.likedGenres.get(g.name.toLowerCase()) || 0) + 2);
        });
        (anime.themes || []).forEach((t: any) => {
          if (t.name) profile.likedThemes.set(t.name.toLowerCase(), (profile.likedThemes.get(t.name.toLowerCase()) || 0) + 2);
        });
      } else if (score && score <= 4 && anime) {
        // Dislike penalty
        (anime.genres || []).forEach((g: any) => {
          if (g.name) profile.dislikedGenres.set(g.name.toLowerCase(), (profile.dislikedGenres.get(g.name.toLowerCase()) || 0) + 1);
        });
        (anime.themes || []).forEach((t: any) => {
          if (t.name) profile.dislikedThemes.set(t.name.toLowerCase(), (profile.dislikedThemes.get(t.name.toLowerCase()) || 0) + 1);
        });
      } else if (anime) {
        (anime.genres || []).forEach((g: any) => {
          if (g.name) profile.likedGenres.set(g.name.toLowerCase(), (profile.likedGenres.get(g.name.toLowerCase()) || 0) + 1);
        });
      }
    } else if (entry.status === 'watching' && anime) {
      // Watching counts as positive interest
      (anime.genres || []).forEach((g: any) => {
        if (g.name) profile.likedGenres.set(g.name.toLowerCase(), (profile.likedGenres.get(g.name.toLowerCase()) || 0) + 1);
      });
    } else if (entry.status === 'dropped' && anime) {
      profile.droppedAnimeMalIds.add(entry.mal_id);
      (anime.genres || []).forEach((g: any) => {
        if (g.name) profile.dislikedGenres.set(g.name.toLowerCase(), (profile.dislikedGenres.get(g.name.toLowerCase()) || 0) + 1.5);
      });
      (anime.themes || []).forEach((t: any) => {
        if (t.name) profile.dislikedThemes.set(t.name.toLowerCase(), (profile.dislikedThemes.get(t.name.toLowerCase()) || 0) + 1.5);
      });
    }
  }

  return profile;
}

/**
 * Extracts collective profile from seed favorite anime
 */
async function buildSeedProfile(favoriteAnimeIds: number[]): Promise<SeedProfile> {
  const profile: SeedProfile = {
    genres: new Map(),
    themes: new Map(),
    demographics: new Set(),
    studios: new Set(),
    types: new Set(),
    seedTitles: [],
  };

  if (!favoriteAnimeIds || favoriteAnimeIds.length === 0) {
    return profile;
  }

  const seeds = await AnimeModel.find({ mal_id: { $in: favoriteAnimeIds } }).lean();

  for (const seed of seeds) {
    const title = seed.title_english || seed.title;
    if (title) profile.seedTitles.push(title);

    if (seed.type) profile.types.add(seed.type);

    (seed.genres || []).forEach((g) => {
      if (g.name) {
        profile.genres.set(g.name.toLowerCase(), (profile.genres.get(g.name.toLowerCase()) || 0) + 1);
      }
    });

    (seed.themes || []).forEach((t) => {
      if (t.name) {
        profile.themes.set(t.name.toLowerCase(), (profile.themes.get(t.name.toLowerCase()) || 0) + 1);
      }
    });

    (seed.demographics || []).forEach((d) => {
      if (d.name) profile.demographics.add(d.name.toLowerCase());
    });

    (seed.studios || []).forEach((s) => {
      if (s.name) profile.studios.add(s.name.toLowerCase());
    });
  }

  return profile;
}

/**
 * Extracts collective negative signals from disliked anime
 */
async function buildDislikeProfile(dislikedAnimeIds: number[]): Promise<{
  genres: Set<string>;
  themes: Set<string>;
}> {
  const profile = { genres: new Set<string>(), themes: new Set<string>() };
  if (!dislikedAnimeIds || dislikedAnimeIds.length === 0) return profile;

  const docs = await AnimeModel.find({ mal_id: { $in: dislikedAnimeIds } })
    .select('genres themes')
    .lean();

  for (const doc of docs) {
    (doc.genres || []).forEach((g) => {
      if (g.name) profile.genres.add(g.name.toLowerCase());
    });
    (doc.themes || []).forEach((t) => {
      if (t.name) profile.themes.add(t.name.toLowerCase());
    });
  }

  return profile;
}

export class RecommendationEngine {
  private weights: RecommendationWeights;
  private static similarCache = new Map<number, Array<{
    anime: Anime;
    similarityScore: number;
    sharedGenres: string[];
    sharedThemes: string[];
    sharedDemographics: string[];
  }>>();

  constructor(customWeights: Partial<RecommendationWeights> = {}) {
    this.weights = { ...DEFAULT_WEIGHTS, ...customWeights };
  }

  /**
   * Calculates similarity between candidate anime and source anime
   */
  public calculateAnimeSimilarity(
    source: AnimeDocument,
    candidate: AnimeDocument
  ): {
    score: number;
    sharedGenres: string[];
    sharedThemes: string[];
    sharedDemographics: string[];
  } {
    const srcGenres = new Set((source.genres || []).map((g) => g.name.toLowerCase()));
    const candGenres = (candidate.genres || []).map((g) => g.name);
    const sharedGenres = candGenres.filter((g) => srcGenres.has(g.toLowerCase()));

    const srcThemes = new Set((source.themes || []).map((t) => t.name.toLowerCase()));
    const candThemes = (candidate.themes || []).map((t) => t.name);
    const sharedThemes = candThemes.filter((t) => srcThemes.has(t.toLowerCase()));

    const srcDemos = new Set((source.demographics || []).map((d) => d.name.toLowerCase()));
    const candDemos = (candidate.demographics || []).map((d) => d.name);
    const sharedDemographics = candDemos.filter((d) => srcDemos.has(d.toLowerCase()));

    // Jaccard similarity for genres & themes
    const allGenres = new Set([...srcGenres, ...candGenres.map((g) => g.toLowerCase())]);
    const genreSim = allGenres.size > 0 ? sharedGenres.length / allGenres.size : 0;

    const allThemes = new Set([...srcThemes, ...candThemes.map((t) => t.toLowerCase())]);
    const themeSim = allThemes.size > 0 ? sharedThemes.length / allThemes.size : 0;

    const demoSim = sharedDemographics.length > 0 ? 1 : 0;
    const typeSim = source.type === candidate.type ? 1 : 0.5;

    const srcStudios = new Set((source.studios || []).map((s) => s.name.toLowerCase()));
    const studioMatch = (candidate.studios || []).some((s) => srcStudios.has(s.name.toLowerCase())) ? 1 : 0;

    const composite =
      genreSim * 0.40 +
      themeSim * 0.30 +
      demoSim * 0.15 +
      typeSim * 0.10 +
      studioMatch * 0.05;

    return {
      score: Math.min(1, Math.max(0, composite)),
      sharedGenres,
      sharedThemes,
      sharedDemographics,
    };
  }

  /**
   * Retrieves similar anime for a given anime MAL ID
   */
  public async getSimilarAnime(
    malId: number,
    limit = 6,
    excludeIds: number[] = []
  ): Promise<Array<{
    anime: Anime;
    similarityScore: number;
    sharedGenres: string[];
    sharedThemes: string[];
    sharedDemographics: string[];
  }>> {
    const excludeSet = new Set(excludeIds);

    // Fast in-memory cache check
    const cached = RecommendationEngine.similarCache.get(malId);
    if (cached) {
      const filtered = cached.filter((item) => !excludeSet.has(item.anime.mal_id));
      if (filtered.length >= limit) {
        return filtered.slice(0, limit);
      }
    }

    const source = await AnimeModel.findOne({ mal_id: malId })
      .select('mal_id title title_english genres themes demographics')
      .lean();
    if (!source) {
      throw new Error('Anime not found');
    }

    const genreNames = (source.genres || []).map((g) => g.name);
    const themeNames = (source.themes || []).map((t) => t.name);

    const query: Record<string, any> = {
      mal_id: { $ne: malId },
      $or: [
        { 'genres.name': { $in: genreNames } },
        { 'themes.name': { $in: themeNames } },
      ],
    };

    const candidates = await AnimeModel.find(query)
      .select('mal_id title title_english type episodes year score members genres themes demographics images')
      .sort({ score: -1, members: -1 })
      .limit(40)
      .lean();

    const scored = candidates.map((cand) => {
      const sim = this.calculateAnimeSimilarity(source as any, cand as any);
      return {
        anime: cand as unknown as Anime,
        similarityScore: Math.round(sim.score * 100),
        sharedGenres: sim.sharedGenres,
        sharedThemes: sim.sharedThemes,
        sharedDemographics: sim.sharedDemographics,
      };
    });

    scored.sort((a, b) => b.similarityScore - a.similarityScore);

    // Cache top 25 similar anime for instant responses
    RecommendationEngine.similarCache.set(malId, scored.slice(0, 25));

    const result = scored.filter((item) => !excludeSet.has(item.anime.mal_id));
    return result.slice(0, limit);
  }

  /**
   * Core Recommendation Engine V2 pipeline:
   * 1. Fetch user preferences & library state
   * 2. Build taste profile & negative signals
   * 3. Fetch candidate anime
   * 4. Exclude all library anime
   * 5. Apply franchise/watch-order eligibility rules
   * 6. Score candidates with library & negative weighting
   * 7. Apply franchise diversity capping
   * 8. Generate grounded explanations
   */
  public async getRecommendationsForUser(
    userId: Types.ObjectId | string,
    options: {
      type?: 'all' | 'tv' | 'movie';
      category?: RecommendationCategory;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    items: RecommendedAnimeItem[];
    total: number;
    questionnaireCompleted: boolean;
    preferencesSummary: {
      genresCount: number;
      themesCount: number;
      favoritesCount: number;
      negativeGenresCount: number;
    };
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(60, Math.max(1, options.limit || 18));
    const targetType = options.type || 'all';
    const category = options.category || 'for_you';

    // 1. Fetch User Preferences & Library state
    const [prefs, libraryProfile] = await Promise.all([
      UserPreferenceModel.findOne({ userId }).lean(),
      buildLibraryProfile(userId),
    ]);

    const favoriteGenres = prefs?.favoriteGenres || [];
    const favoriteThemes = prefs?.favoriteThemes || [];
    const negativeGenres = (prefs?.negativeGenres || []).map((g) => g.toLowerCase());
    const negativeThemes = (prefs?.negativeThemes || []).map((t) => t.toLowerCase());
    const preferredFormats = prefs?.preferredFormats || ['both'];
    const preferredLength = prefs?.preferredLength || ['any'];
    const preferredEras = prefs?.preferredEras || ['any'];
    const favoriteAnimeIds = prefs?.favoriteAnimeIds || [];
    const questionnaireCompleted = Boolean(prefs?.questionnaireCompleted);

    // 2. Build favorite seeds & dislike profile
    const dislikedAnimeIds = (prefs as any)?.dislikedAnimeIds || [];
    const [seedProfile, dislikeProfile] = await Promise.all([
      buildSeedProfile(favoriteAnimeIds),
      buildDislikeProfile(dislikedAnimeIds),
    ]);

    // 3. Candidate exclusions: Library items + explicit seeds + disliked items
    const excludedMalIds = new Set<number>([
      ...Array.from(libraryProfile.allLibraryMalIds),
      ...favoriteAnimeIds,
      ...dislikedAnimeIds,
    ]);

    // 4. Weight normalization
    const activeWeights: RecommendationWeights = { ...this.weights };
    if (favoriteGenres.length === 0) activeWeights.genre = 0;
    if (favoriteThemes.length === 0) activeWeights.theme = 0;
    if (favoriteAnimeIds.length === 0) activeWeights.favorite = 0;
    if (libraryProfile.likedGenres.size === 0) activeWeights.library = 0;
    if (preferredFormats.includes('both') || preferredFormats.length === 0) activeWeights.format = 0;
    if (preferredLength.includes('any') || preferredLength.length === 0) activeWeights.length = 0;
    if (preferredEras.includes('any') || preferredEras.length === 0) activeWeights.era = 0;

    const totalActiveWeight = Object.values(activeWeights).reduce((a, b) => a + b, 0);
    const normalizedWeights: RecommendationWeights = totalActiveWeight > 0
      ? {
          genre: activeWeights.genre / totalActiveWeight,
          theme: activeWeights.theme / totalActiveWeight,
          favorite: activeWeights.favorite / totalActiveWeight,
          library: activeWeights.library / totalActiveWeight,
          format: activeWeights.format / totalActiveWeight,
          length: activeWeights.length / totalActiveWeight,
          era: activeWeights.era / totalActiveWeight,
          quality: activeWeights.quality / totalActiveWeight,
        }
      : {
          genre: 0,
          theme: 0,
          favorite: 0,
          library: 0,
          format: 0,
          length: 0,
          era: 0,
          quality: 1,
        };

    // 5. Query candidate pool from MongoDB
    const query: Record<string, any> = {
      mal_id: { $nin: Array.from(excludedMalIds) },
    };

    // Category-specific query adjustments
    if (category === 'hidden_gems') {
      query.score = { $gte: 7.5 };
      query.members = { $lt: 400000 };
    } else if (category === 'top_rated') {
      query.score = { $gte: 8.2 };
    } else {
      query.score = { $gte: 5.8 };
    }

    if (targetType === 'tv' || targetType === 'movie') {
      query.type = targetType;
    } else if (!preferredFormats.includes('both') && preferredFormats.length > 0) {
      query.type = { $in: preferredFormats };
    }

    // Candidate selection signals
    const orConditions: any[] = [];
    if (favoriteGenres.length > 0) {
      orConditions.push({ 'genres.name': { $in: favoriteGenres } });
    }
    if (favoriteThemes.length > 0) {
      orConditions.push({ 'themes.name': { $in: favoriteThemes } });
    }
    if (libraryProfile.likedGenres.size > 0) {
      const topLiked = Array.from(libraryProfile.likedGenres.keys()).slice(0, 5);
      orConditions.push({ 'genres.name': { $in: topLiked.map((g) => new RegExp(`^${g}$`, 'i')) } });
    }
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    const candidates = await AnimeModel.find(query)
      .sort(category === 'hidden_gems' ? { score: -1, members: 1 } : { score: -1, members: -1 })
      .limit(120)
      .lean();

    // Fallback if strict queries return few results
    if (candidates.length < 30) {
      const fallbackQuery: Record<string, any> = {
        mal_id: { $nin: Array.from(excludedMalIds) },
      };
      if (targetType === 'tv' || targetType === 'movie') fallbackQuery.type = targetType;
      const topPicks = await AnimeModel.find(fallbackQuery)
        .sort({ members: -1, score: -1 })
        .limit(60)
        .lean();

      const existingIds = new Set(candidates.map((c) => c.mal_id));
      for (const p of topPicks) {
        if (!existingIds.has(p.mal_id)) {
          candidates.push(p);
          existingIds.add(p.mal_id);
        }
      }
    }

    // 6. CRITICAL: Franchise & Sequel Eligibility Filter
    const candidateMalIds = candidates.map((c) => c.mal_id);
    const eligibilityMap = await franchiseService.batchEvaluateEligibility(
      candidateMalIds,
      libraryProfile.completedMalIds,
      libraryProfile.allLibraryMalIds
    );

    // Filter to ONLY eligible anime
    const eligibleCandidates = candidates.filter((c) => {
      const el = eligibilityMap.get(c.mal_id);
      return el && el.eligible;
    });

    // 7. Score Eligible Candidates
    const scoredList: RecommendedAnimeItem[] = [];
    const normGenres = favoriteGenres.map((g) => g.toLowerCase());
    const normThemes = favoriteThemes.map((t) => t.toLowerCase());

    for (const anime of eligibleCandidates) {
      const animeGenres = (anime.genres || []).map((g) => g.name);
      const animeThemes = (anime.themes || []).map((t) => t.name);

      const matchedGenres = animeGenres.filter((g) => normGenres.includes(g.toLowerCase()));
      const matchedThemes = animeThemes.filter((t) => normThemes.includes(t.toLowerCase()));

      // A. Genre Score (0-1)
      let genreScore = 0;
      if (favoriteGenres.length > 0) {
        genreScore = Math.min(1, matchedGenres.length / Math.min(3, favoriteGenres.length));
      }

      // B. Theme Score (0-1)
      let themeScore = 0;
      if (favoriteThemes.length > 0) {
        themeScore = Math.min(1, matchedThemes.length / Math.min(2, favoriteThemes.length));
      }

      // C. Favorite Seed Similarity (0-1)
      let favoriteScore = 0;
      let topSeedMatchTitle = '';
      if (seedProfile.seedTitles.length > 0) {
        let seedScoreSum = 0;
        let hits = 0;

        animeGenres.forEach((g) => {
          const freq = seedProfile.genres.get(g.toLowerCase()) || 0;
          if (freq > 0) {
            seedScoreSum += Math.min(1, freq / seedProfile.seedTitles.length);
            hits++;
          }
        });

        animeThemes.forEach((t) => {
          const freq = seedProfile.themes.get(t.toLowerCase()) || 0;
          if (freq > 0) {
            seedScoreSum += Math.min(1, freq / seedProfile.seedTitles.length) * 1.2;
            hits++;
          }
        });

        favoriteScore = Math.min(1, seedScoreSum / Math.max(1, hits || 1));
        if (seedProfile.seedTitles.length > 0) {
          topSeedMatchTitle = seedProfile.seedTitles[0] || '';
        }
      }

      // D. User Library Signal (V2)
      let libraryScore = 0;
      let highRatedAnchorTitle = '';
      if (libraryProfile.likedGenres.size > 0) {
        let libMatchSum = 0;
        animeGenres.forEach((g) => {
          const boost = libraryProfile.likedGenres.get(g.toLowerCase()) || 0;
          if (boost > 0) libMatchSum += Math.min(1, boost / 3);
        });
        animeThemes.forEach((t) => {
          const boost = libraryProfile.likedThemes.get(t.toLowerCase()) || 0;
          if (boost > 0) libMatchSum += Math.min(1, boost / 3);
        });
        libraryScore = Math.min(1, libMatchSum / Math.max(1, animeGenres.length || 1));

        if (libraryProfile.highRatedTitles.length > 0) {
          highRatedAnchorTitle = libraryProfile.highRatedTitles[0]?.title || '';
        }
      }

      // E. Format Score (0-1)
      let formatScore = 0;
      if (preferredFormats.includes('both') || preferredFormats.length === 0) {
        formatScore = 1.0;
      } else {
        formatScore = preferredFormats.includes(anime.type as any) ? 1.0 : 0.0;
      }

      // F. Length Score (0-1)
      const lengthScore = matchesLengthPreference(anime as any, preferredLength) ? 1.0 : 0.0;

      // G. Era Score (0-1)
      const eraScore = matchesEraPreference(anime as any, preferredEras) ? 1.0 : 0.0;

      // H. Quality / Popularity (0-1)
      const malScore = anime.score || 6.0;
      const members = anime.members || 1000;
      let qualityScore = Math.min(
        1,
        (malScore / 10) * 0.75 + (Math.min(1, Math.log10(members + 1) / 7)) * 0.25
      );
      if (category === 'hidden_gems') {
        // In hidden gems, balance quality with lower popularity discovery
        qualityScore = Math.min(1, (malScore / 10) * 0.9);
      }

      // I. Negative Preferences & Dislike Penalties (V2)
      let negativePenalty = 0;
      const hasNegativeGenre = animeGenres.some((g) => negativeGenres.includes(g.toLowerCase()));
      const hasNegativeTheme = animeThemes.some((t) => negativeThemes.includes(t.toLowerCase()));

      if (hasNegativeGenre) negativePenalty += 0.40;
      if (hasNegativeTheme) negativePenalty += 0.35;

      // Check if anime shares traits with user's dropped anime
      animeGenres.forEach((g) => {
        if (libraryProfile.dislikedGenres.has(g.toLowerCase())) {
          negativePenalty += 0.15;
        }
      });
      animeThemes.forEach((t) => {
        if (libraryProfile.dislikedThemes.has(t.toLowerCase())) {
          negativePenalty += 0.15;
        }
      });

      // Check if anime shares traits with user's specifically disliked anime
      animeGenres.forEach((g) => {
        if (dislikeProfile.genres.has(g.toLowerCase())) {
          negativePenalty += 0.20;
        }
      });
      animeThemes.forEach((t) => {
        if (dislikeProfile.themes.has(t.toLowerCase())) {
          negativePenalty += 0.20;
        }
      });
      negativePenalty = Math.min(0.9, negativePenalty);

      // Composite Raw Score
      const baseScore =
        genreScore * normalizedWeights.genre +
        themeScore * normalizedWeights.theme +
        favoriteScore * normalizedWeights.favorite +
        libraryScore * normalizedWeights.library +
        formatScore * normalizedWeights.format +
        lengthScore * normalizedWeights.length +
        eraScore * normalizedWeights.era +
        qualityScore * normalizedWeights.quality;

      const finalScoreRaw = Math.max(0.05, baseScore * (1 - negativePenalty));
      const finalScore = Math.round(finalScoreRaw * 1000) / 10; // e.g. 92.4%

      // Build Explanations
      const explanations: RecommendationExplanation[] = [];
      const reasons: string[] = [];

      if (matchedGenres.length > 0) {
        const text = `Matches your favorite genres: ${matchedGenres.slice(0, 3).join(', ')}`;
        reasons.push(text);
        explanations.push({ type: 'genre', label: text, matchedItems: matchedGenres });
      }

      if (matchedThemes.length > 0) {
        const text = `Features themes you like: ${matchedThemes.slice(0, 2).join(', ')}`;
        reasons.push(text);
        explanations.push({ type: 'theme', label: text, matchedItems: matchedThemes });
      }

      if (libraryScore >= 0.4 && highRatedAnchorTitle) {
        const text = `Similar to ${highRatedAnchorTitle} (which you rated highly)`;
        reasons.push(text);
        explanations.push({ type: 'library_match', label: text });
      } else if (favoriteScore >= 0.45 && topSeedMatchTitle) {
        const text = `Shares style & themes with ${topSeedMatchTitle}`;
        reasons.push(text);
        explanations.push({ type: 'favorite', label: text });
      }

      if (category === 'hidden_gems') {
        const text = `Hidden gem with high ratings (${anime.score?.toFixed(1)}★ score)`;
        reasons.push(text);
        explanations.push({ type: 'quality', label: text });
      } else if (anime.score && anime.score >= 8.2) {
        const text = `Critically acclaimed masterpiece (${anime.score.toFixed(1)}★ score)`;
        reasons.push(text);
        explanations.push({ type: 'quality', label: text });
      }

      if (reasons.length === 0) {
        reasons.push('Popular title aligning with your taste profile');
      }

      const elInfo = eligibilityMap.get(anime.mal_id);

      scoredList.push({
        anime: anime as unknown as Anime,
        score: finalScore,
        reasons,
        explanations,
        franchiseInfo: {
          rootMalId: elInfo?.franchiseRootMalId || anime.mal_id,
          relationType: 'standalone',
        },
        scoreBreakdown: {
          genreScore: Math.round(genreScore * 100),
          themeScore: Math.round(themeScore * 100),
          favoriteScore: Math.round(favoriteScore * 100),
          libraryScore: Math.round(libraryScore * 100),
          formatScore: Math.round(formatScore * 100),
          lengthScore: Math.round(lengthScore * 100),
          eraScore: Math.round(eraScore * 100),
          qualityScore: Math.round(qualityScore * 100),
          negativePenalty: Math.round(negativePenalty * 100),
        },
      });
    }

    // Sort by recommendation score descending
    scoredList.sort((a, b) => b.score - a.score);

    // 8. Diversity & Franchise Capping (Section 3.4)
    // Avoid returning multiple titles from the same franchise root in general recommendations
    const diversified: RecommendedAnimeItem[] = [];
    const seenRoots = new Set<number>();

    for (const item of scoredList) {
      const rootId = item.franchiseInfo?.rootMalId || item.anime.mal_id;
      if (seenRoots.has(rootId)) {
        continue; // Limit to 1 per franchise root for diversity
      }
      seenRoots.add(rootId);
      diversified.push(item);
    }

    const total = diversified.length;
    const paginatedItems = diversified.slice((page - 1) * limit, page * limit);

    return {
      items: paginatedItems,
      total,
      questionnaireCompleted,
      preferencesSummary: {
        genresCount: favoriteGenres.length,
        themesCount: favoriteThemes.length,
        favoritesCount: favoriteAnimeIds.length,
        negativeGenresCount: negativeGenres.length,
      },
    };
  }

  /**
   * Generates all 5 categorized recommendation sections for the user:
   * 1. Recommended for You
   * 2. Because You Liked
   * 3. Hidden Gems for You
   * 4. Highly Rated Picks
   * 5. Continue Your Journey (Sequels with satisfied prerequisites)
   */
  public async getCategorizedRecommendations(
    userId: Types.ObjectId | string
  ): Promise<CategorizedRecommendationsResponse> {
    const [userPrefs, libraryProfile] = await Promise.all([
      UserPreferenceModel.findOne({ userId }).lean(),
      buildLibraryProfile(userId),
    ]);

    // Determine anchors for diverse sets
    // 1. Anime Anchor: top from library (>=8★) OR top favoriteAnimeIds from questionnaire
    let anchorAnimeId: number | null = null;
    let anchorAnimeTitle = '';

    if (libraryProfile.highRatedTitles.length > 0 && libraryProfile.highRatedTitles[0]) {
      anchorAnimeId = libraryProfile.highRatedTitles[0].mal_id;
      anchorAnimeTitle = libraryProfile.highRatedTitles[0].title;
    } else if (userPrefs?.favoriteAnimeIds && userPrefs.favoriteAnimeIds.length > 0) {
      anchorAnimeId = userPrefs.favoriteAnimeIds[0] ?? null;
      if (anchorAnimeId) {
        const anchorDoc = await AnimeModel.findOne({ mal_id: anchorAnimeId })
          .select('title title_english')
          .lean();
        anchorAnimeTitle = anchorDoc?.title_english || anchorDoc?.title || 'your favorite anime';
      }
    }

    // 2. Genre Anchor: user's top positive genre or top completed genre
    const topGenre =
      userPrefs?.favoriteGenres?.[0] ||
      Array.from(libraryProfile.likedGenres.keys())[0] ||
      'Action';

    // Total excluded IDs: library items, user favorite seeds, and disliked anime
    const totalExcludedMalIds = new Set<number>([
      ...Array.from(libraryProfile.allLibraryMalIds),
      ...(userPrefs?.favoriteAnimeIds || []),
      ...((userPrefs as any)?.dislikedAnimeIds || []),
    ]);

    // Execute category queries in PARALLEL for maximum speed
    const [
      forYouRes,
      hiddenGemsRes,
      topRatedRes,
      continuationsData,
      anchorSimilar,
      genreAnimeDocs,
    ] = await Promise.all([
      this.getRecommendationsForUser(userId, { category: 'for_you', limit: 12 }),
      this.getRecommendationsForUser(userId, { category: 'hidden_gems', limit: 6 }),
      this.getRecommendationsForUser(userId, { category: 'top_rated', limit: 6 }),
      franchiseService.getContinueYourJourneyCandidates(
        libraryProfile.completedMalIds,
        libraryProfile.allLibraryMalIds
      ),
      anchorAnimeId
        ? this.getSimilarAnime(anchorAnimeId, 6, Array.from(totalExcludedMalIds))
        : Promise.resolve([]),
      AnimeModel.find({
        'genres.name': topGenre,
        mal_id: { $nin: Array.from(totalExcludedMalIds) },
        score: { $gte: 7.2 },
      })
        .sort({ score: -1, members: -1 })
        .limit(6)
        .lean(),
    ]);

    // 4. Continue Your Journey (Immediate eligible sequels)
    const continueYourJourney: CategorizedRecommendationsResponse['continueYourJourney'] = [];
    if (continuationsData.length > 0) {
      const validContinuations = continuationsData.filter(
        (c) => !totalExcludedMalIds.has(c.sequelMalId)
      );
      const sequelMalIds = validContinuations.map((c) => c.sequelMalId);
      const sequelAnimeDocs = await AnimeModel.find({ mal_id: { $in: sequelMalIds } }).lean();

      for (const cont of validContinuations.slice(0, 8)) {
        const animeDoc = sequelAnimeDocs.find((a) => a.mal_id === cont.sequelMalId);
        if (animeDoc) {
          continueYourJourney.push({
            predecessorMalId: cont.predecessorMalId,
            predecessorTitle: cont.predecessorTitle,
            item: {
              anime: animeDoc as unknown as Anime,
              score: 95.0,
              reasons: [`Next season following ${cont.predecessorTitle}`],
              explanations: [
                {
                  type: 'sequel',
                  label: `Next season following ${cont.predecessorTitle}`,
                },
              ],
              franchiseInfo: {
                rootMalId: cont.predecessorMalId,
                relationType: 'sequel',
                predecessorTitle: cont.predecessorTitle,
              },
              scoreBreakdown: {
                genreScore: 100,
                themeScore: 100,
                favoriteScore: 100,
                libraryScore: 100,
                formatScore: 100,
                lengthScore: 100,
                eraScore: 100,
                qualityScore: 100,
                negativePenalty: 0,
              },
            },
          });
        }
      }
    }

    // 5. Because You Liked
    const becauseYouLiked: CategorizedRecommendationsResponse['becauseYouLiked'] = [];
    if (anchorAnimeId && anchorSimilar.length > 0) {
      becauseYouLiked.push({
        anchorMalId: anchorAnimeId,
        anchorTitle: anchorAnimeTitle,
        anchorScore: libraryProfile.highRatedTitles[0]?.score || null,
        items: anchorSimilar.map((s) => ({
          anime: s.anime,
          score: s.similarityScore,
          reasons: [`Similar style, tone & themes to ${anchorAnimeTitle}`],
          explanations: [
            {
              type: 'library_match',
              label: `Similar to ${anchorAnimeTitle}`,
            },
          ],
          scoreBreakdown: {
            genreScore: s.similarityScore,
            themeScore: s.similarityScore,
            favoriteScore: 0,
            libraryScore: s.similarityScore,
            formatScore: 100,
            lengthScore: 100,
            eraScore: 100,
            qualityScore: 100,
            negativePenalty: 0,
          },
        })),
      });
    }

    // 6. Build Distinct Recommendation Sets for Netflix/Spotify-style rows
    const sets: RecommendationSet[] = [];

    // Set 1: Personalized Picks For You
    if (forYouRes.items.length > 0) {
      sets.push({
        id: 'for_you',
        title: 'Recommended For You',
        subtitle: 'Personalized selection tuned to your overall anime preferences',
        type: 'for_you',
        items: forYouRes.items,
      });
    }

    // Set 2: Continue Your Journey
    if (continueYourJourney.length > 0) {
      sets.push({
        id: 'continue_journey',
        title: 'Continue Your Journey',
        subtitle: 'Next seasons and direct sequel continuations waiting for you',
        type: 'continuation',
        items: continueYourJourney.map((c) => c.item),
      });
    }

    // Set 3: Because You Liked [Anime Name]
    const firstLiked = becauseYouLiked[0];
    if (firstLiked && firstLiked.items.length > 0) {
      sets.push({
        id: `because_liked_${anchorAnimeId}`,
        title: `Because You Liked "${anchorAnimeTitle}"`,
        subtitle: `Shares matching atmosphere, themes, and creative style with ${anchorAnimeTitle}`,
        type: 'anchor_anime',
        anchor: {
          type: 'anime',
          name: anchorAnimeTitle,
          mal_id: anchorAnimeId || undefined,
        },
        items: firstLiked.items,
      });
    }

    // Set 4: Because You Love [Genre Name]
    if (genreAnimeDocs.length > 0) {
      sets.push({
        id: `genre_${topGenre.toLowerCase().replace(/\s+/g, '_')}`,
        title: `Because You Love ${topGenre}`,
        subtitle: `Standout high-rated anime representing the very best in ${topGenre}`,
        type: 'genre',
        anchor: {
          type: 'genre',
          name: topGenre,
        },
        items: genreAnimeDocs.map((a) => ({
          anime: a as unknown as Anime,
          score: Math.min(99, Math.round(((a.score || 7.5) / 10) * 100)),
          reasons: [`Top rated title in your favorite genre: ${topGenre}`],
          explanations: [
            {
              type: 'genre',
              label: `Top rated in ${topGenre}`,
            },
          ],
          scoreBreakdown: {
            genreScore: 100,
            themeScore: 80,
            favoriteScore: 0,
            libraryScore: 70,
            formatScore: 100,
            lengthScore: 100,
            eraScore: 100,
            qualityScore: 100,
            negativePenalty: 0,
          },
        })),
      });
    }

    // Set 5: Hidden Gems
    if (hiddenGemsRes.items.length > 0) {
      sets.push({
        id: 'hidden_gems',
        title: 'Hidden Gems For You',
        subtitle: 'Critically acclaimed underground favorites with under 400k members',
        type: 'hidden_gems',
        items: hiddenGemsRes.items,
      });
    }

    // Set 6: Masterpieces
    if (topRatedRes.items.length > 0) {
      sets.push({
        id: 'masterpieces',
        title: 'Critically Acclaimed Masterpieces',
        subtitle: 'Top tier classics and landmark achievements rated 8.2 or above',
        type: 'top_rated',
        items: topRatedRes.items,
      });
    }

    return {
      recommendedForYou: forYouRes.items,
      becauseYouLiked,
      hiddenGems: hiddenGemsRes.items,
      highlyRatedPicks: topRatedRes.items,
      continueYourJourney,
      sets,
      meta: {
        questionnaireCompleted: forYouRes.questionnaireCompleted,
        eligibleContinuationsCount: continueYourJourney.length,
      },
    };
  }

  /**
   * Computes learned taste signals and library statistics for the user recommendation profile.
   */
  public async getTasteProfileSignals(userId: Types.ObjectId | string) {
    const prefs = await UserPreferenceModel.findOne({ userId }).lean();
    const libraryProfile = await buildLibraryProfile(userId);

    const positiveTasteSignals: string[] = [];
    if (prefs?.favoriteGenres && prefs.favoriteGenres.length > 0) {
      positiveTasteSignals.push(...prefs.favoriteGenres.map((g) => `Prefers ${g}`));
    }
    if (prefs?.favoriteThemes && prefs.favoriteThemes.length > 0) {
      positiveTasteSignals.push(...prefs.favoriteThemes.map((t) => `Enjoys ${t}`));
    }
    for (const [g, count] of libraryProfile.likedGenres) {
      if (!prefs?.favoriteGenres?.includes(g)) {
        positiveTasteSignals.push(`Highly rated ${g} (${count} anime)`);
      }
    }

    const negativeTasteSignals: string[] = [];
    if (prefs?.negativeGenres && prefs.negativeGenres.length > 0) {
      negativeTasteSignals.push(...prefs.negativeGenres.map((g) => `Avoids ${g}`));
    }
    if (prefs?.negativeThemes && prefs.negativeThemes.length > 0) {
      negativeTasteSignals.push(...prefs.negativeThemes.map((t) => `Avoids ${t}`));
    }
    for (const [g, count] of libraryProfile.dislikedGenres) {
      if (!prefs?.negativeGenres?.includes(g)) {
        negativeTasteSignals.push(`Low-rated ${g} (${count} anime)`);
      }
    }
    if (libraryProfile.droppedAnimeMalIds.size > 0) {
      negativeTasteSignals.push(`Penalized ${libraryProfile.droppedAnimeMalIds.size} dropped anime titles`);
    }

    // Compute library summary stats
    const libraryEntries = await UserAnimeListModel.find({ userId }).lean();
    const completedEntries = libraryEntries.filter((e) => e.status === 'completed');
    const watchingEntries = libraryEntries.filter((e) => e.status === 'watching');
    const droppedEntries = libraryEntries.filter((e) => e.status === 'dropped');
    const ratedEntries = libraryEntries.filter((e) => typeof e.userScore === 'number' && e.userScore > 0);
    const avgScore = ratedEntries.length > 0
      ? Number((ratedEntries.reduce((acc, curr) => acc + (curr.userScore || 0), 0) / ratedEntries.length).toFixed(1))
      : null;

    const topCompletedGenres = Array.from(libraryProfile.likedGenres.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 5);

    return {
      positiveTasteSignals,
      negativeTasteSignals,
      negativeGenres: prefs?.negativeGenres || [],
      negativeThemes: prefs?.negativeThemes || [],
      libraryLearnedStats: {
        completedCount: completedEntries.length,
        watchingCount: watchingEntries.length,
        droppedCount: droppedEntries.length,
        averagePersonalScore: avgScore,
        topCompletedGenres,
      },
    };
  }

  /**
   * Generates a single replacement recommendation when an anime is reviewed.
   * Excludes all currently on-screen anime, plus all library, favorite, and disliked anime.
   */
  public async getSingleReplacementRecommendation(
    userId: Types.ObjectId | string,
    excludeMalIds: number[] = [],
    feedback?: 'like' | 'dislike' | 'watched',
    sourceMalId?: number
  ): Promise<RecommendedAnimeItem | null> {
    const [userPrefs, libraryProfile] = await Promise.all([
      UserPreferenceModel.findOne({ userId }).lean(),
      buildLibraryProfile(userId),
    ]);

    const totalExcluded = new Set<number>([
      ...Array.from(libraryProfile.allLibraryMalIds),
      ...(userPrefs?.favoriteAnimeIds || []),
      ...((userPrefs as any)?.dislikedAnimeIds || []),
      ...excludeMalIds,
      ...(sourceMalId ? [sourceMalId] : []),
    ]);

    // If the user just liked or watched an anime, first try to recommend a direct similar match!
    if ((feedback === 'like' || feedback === 'watched') && sourceMalId) {
      try {
        const similar = await this.getSimilarAnime(sourceMalId, 4, Array.from(totalExcluded));
        const firstMatch = similar.find((s) => !totalExcluded.has(s.anime.mal_id));
        if (firstMatch) {
          return {
            anime: firstMatch.anime,
            score: Math.min(98, Math.max(78, firstMatch.similarityScore)),
            reasons: [`Recommended based on your positive review`],
            explanations: [
              {
                type: 'favorite',
                label: `Shares tone and themes with titles you loved`,
              },
            ],
            scoreBreakdown: {
              genreScore: firstMatch.similarityScore,
              themeScore: firstMatch.similarityScore,
              favoriteScore: 90,
              libraryScore: 80,
              formatScore: 100,
              lengthScore: 100,
              eraScore: 100,
              qualityScore: 90,
              negativePenalty: 0,
            },
          };
        }
      } catch {
        // Fallback to general pool
      }
    }

    // Otherwise fetch the next top eligible personalized recommendation
    const pool = await this.getRecommendationsForUser(userId, {
      category: 'for_you',
      limit: 25,
    });

    const candidate = pool.items.find((item) => !totalExcluded.has(item.anime.mal_id));
    if (candidate) return candidate;

    // Fallback: top rated candidate not excluded
    const topRated = await AnimeModel.find({
      mal_id: { $nin: Array.from(totalExcluded) },
      score: { $gte: 7.5 },
    })
      .sort({ score: -1, members: -1 })
      .limit(1)
      .lean();

    if (topRated.length > 0 && topRated[0]) {
      const anime = topRated[0] as unknown as Anime;
      return {
        anime,
        score: Math.round(((anime.score || 8.0) / 10) * 100),
        reasons: ['Highly acclaimed title popular among community'],
        explanations: [{ type: 'quality', label: 'Highly acclaimed title' }],
        scoreBreakdown: {
          genreScore: 80,
          themeScore: 80,
          favoriteScore: 70,
          libraryScore: 70,
          formatScore: 100,
          lengthScore: 100,
          eraScore: 100,
          qualityScore: 95,
          negativePenalty: 0,
        },
      };
    }

    return null;
  }
}

export const recommendationEngine = new RecommendationEngine();
