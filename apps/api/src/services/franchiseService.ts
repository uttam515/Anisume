import { FranchiseRelationModel, type FranchiseRelationDocument } from '../models/FranchiseRelation.js';
import { AnimeModel, type AnimeDocument } from '../models/Anime.js';

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  missingPrerequisites?: number[];
  franchiseRootMalId?: number;
  franchiseTitle?: string;
}

export class FranchiseService {
  // In-memory cache for fast lookups across recommendation scoring runs
  private relationCache = new Map<number, any>();

  /**
   * Evaluates eligibility for a single anime against the user's completed & library anime.
   */
  public async checkEligibility(
    malId: number,
    completedMalIds: Set<number>,
    libraryMalIds: Set<number>
  ): Promise<EligibilityResult> {
    // Rule 1: Never recommend anime already present in user's library
    if (libraryMalIds.has(malId)) {
      return {
        eligible: false,
        reason: 'Anime is already present in your personal library',
      };
    }

    // Lookup franchise relationship record (from memory cache or DB)
    let rel = this.relationCache.get(malId);
    if (rel === undefined) {
      rel = await FranchiseRelationModel.findOne({ mal_id: malId }).lean();
      if (!rel) {
        await this.ensureFranchiseRecord(malId);
        rel = await FranchiseRelationModel.findOne({ mal_id: malId }).lean();
      }
      this.relationCache.set(malId, rel || null);
    }

    // If still no relation record or no prerequisites, it is considered standalone/Season 1
    if (!rel || !rel.allPrerequisiteMalIds || rel.allPrerequisiteMalIds.length === 0) {
      return {
        eligible: true,
        franchiseRootMalId: rel?.franchiseRootMalId || malId,
        franchiseTitle: rel?.franchiseTitle || '',
      };
    }

    // Rule 2: Multi-level franchise prerequisite check
    // ALL required predecessors in the entire chain must be present in completedMalIds
    const missing = rel.allPrerequisiteMalIds.filter((preId: number) => !completedMalIds.has(preId));

    if (missing.length > 0) {
      return {
        eligible: false,
        reason: `Requires completing predecessor anime first (MAL #${missing[0]})`,
        missingPrerequisites: missing,
        franchiseRootMalId: rel.franchiseRootMalId,
        franchiseTitle: rel.franchiseTitle,
      };
    }

    // All prerequisites completed!
    return {
      eligible: true,
      franchiseRootMalId: rel.franchiseRootMalId,
      franchiseTitle: rel.franchiseTitle,
    };
  }

  /**
   * Batch evaluates eligibility for a list of candidate anime IDs.
   * Avoids N+1 queries by using in-memory cache and single-batch lookups.
   */
  public async batchEvaluateEligibility(
    candidateMalIds: number[],
    completedMalIds: Set<number>,
    libraryMalIds: Set<number>
  ): Promise<Map<number, EligibilityResult>> {
    const results = new Map<number, EligibilityResult>();

    // 1. Immediately block any candidates in user's library
    const toQueryMalIds: number[] = [];
    for (const id of candidateMalIds) {
      if (libraryMalIds.has(id)) {
        results.set(id, {
          eligible: false,
          reason: 'Anime is already present in your personal library',
        });
      } else {
        toQueryMalIds.push(id);
      }
    }

    if (toQueryMalIds.length === 0) {
      return results;
    }

    // 2. Fetch from in-memory cache or DB in a single batch
    const unhitMalIds: number[] = [];
    const relMap = new Map<number, any>();

    for (const id of toQueryMalIds) {
      if (this.relationCache.has(id)) {
        const cached = this.relationCache.get(id);
        if (cached) relMap.set(id, cached);
      } else {
        unhitMalIds.push(id);
      }
    }

    if (unhitMalIds.length > 0) {
      const existingRels = await FranchiseRelationModel.find({
        mal_id: { $in: unhitMalIds },
      }).lean();

      for (const r of existingRels) {
        relMap.set(r.mal_id, r);
        this.relationCache.set(r.mal_id, r);
      }

      // Identify any candidates missing franchise records and parse their relations in-memory
      const missingFromRels = unhitMalIds.filter((id) => !relMap.has(id));
      if (missingFromRels.length > 0) {
        const animeDocs = await AnimeModel.find({ mal_id: { $in: missingFromRels } })
          .select('mal_id title relations type')
          .lean();

        for (const anime of animeDocs) {
          const rawRels = (anime.relations as any[]) || [];
          const prereqIds: number[] = [];

          for (const rel of rawRels) {
            const relName = (rel.relation || '').toLowerCase();
            if (relName === 'prequel' || relName === 'parent story') {
              const entries = Array.isArray(rel.entry) ? rel.entry : [];
              for (const ent of entries) {
                const entMalId = Number(ent.mal_id || ent.malId);
                if (entMalId && entMalId !== anime.mal_id) {
                  prereqIds.push(entMalId);
                }
              }
            }
          }

          const fallbackRecord = {
            mal_id: anime.mal_id,
            franchiseRootMalId: prereqIds[0] || anime.mal_id,
            franchiseTitle: anime.title || '',
            allPrerequisiteMalIds: prereqIds,
            directSequelMalIds: [],
          };

          relMap.set(anime.mal_id, fallbackRecord);
          this.relationCache.set(anime.mal_id, fallbackRecord);
        }
      }
    }

    // 3. Evaluate eligibility for each candidate (blazing fast in-memory)
    for (const id of toQueryMalIds) {
      const rel = relMap.get(id);

      if (!rel || !rel.allPrerequisiteMalIds || rel.allPrerequisiteMalIds.length === 0) {
        results.set(id, {
          eligible: true,
          franchiseRootMalId: rel?.franchiseRootMalId || id,
          franchiseTitle: rel?.franchiseTitle || '',
        });
        continue;
      }

      // Check all prerequisites
      const missing = rel.allPrerequisiteMalIds.filter((preId: number) => !completedMalIds.has(preId));

      if (missing.length > 0) {
        results.set(id, {
          eligible: false,
          reason: `Requires completing predecessor anime first (MAL #${missing[0]})`,
          missingPrerequisites: missing,
          franchiseRootMalId: rel.franchiseRootMalId,
          franchiseTitle: rel.franchiseTitle,
        });
      } else {
        results.set(id, {
          eligible: true,
          franchiseRootMalId: rel.franchiseRootMalId,
          franchiseTitle: rel.franchiseTitle,
        });
      }
    }

    return results;
  }

  /**
   * "Continue Your Journey": Finds eligible direct sequels/continuations for anime the user has completed.
   */
  public async getContinueYourJourneyCandidates(
    completedInput: Set<number> | number[],
    libraryInput: Set<number> | number[]
  ): Promise<Array<{ sequelMalId: number; predecessorMalId: number; predecessorTitle: string }>> {
    const completedMalIds = completedInput instanceof Set ? completedInput : new Set(completedInput);
    const libraryMalIds = libraryInput instanceof Set ? libraryInput : new Set(libraryInput);

    if (completedMalIds.size === 0) return [];

    const completedIdsArr = Array.from(completedMalIds);

    // Find franchise records for all completed anime
    const completedRels = await FranchiseRelationModel.find({
      mal_id: { $in: completedIdsArr },
    }).lean();

    const candidates: Array<{ sequelMalId: number; predecessorMalId: number; predecessorTitle: string }> = [];
    const seenSequelIds = new Set<number>();

    for (const compRel of completedRels) {
      const directSequels = compRel.directSequelMalIds || [];

      for (const sequelId of directSequels) {
        // Skip if already in user's library or already seen in candidates
        if (libraryMalIds.has(sequelId) || seenSequelIds.has(sequelId)) {
          continue;
        }

        // Verify the sequel is actually eligible (all its prerequisites must be completed)
        const sequelRel = await FranchiseRelationModel.findOne({ mal_id: sequelId }).lean();
        if (sequelRel && sequelRel.allPrerequisiteMalIds) {
          const allMet = sequelRel.allPrerequisiteMalIds.every((preId) => completedMalIds.has(preId));
          if (allMet) {
            seenSequelIds.add(sequelId);
            candidates.push({
              sequelMalId: sequelId,
              predecessorMalId: compRel.mal_id,
              predecessorTitle: compRel.title,
            });
          }
        } else {
          seenSequelIds.add(sequelId);
          candidates.push({
            sequelMalId: sequelId,
            predecessorMalId: compRel.mal_id,
            predecessorTitle: compRel.title,
          });
        }
      }
    }

    return candidates;
  }

  /**
   * Ensures a franchise record exists for a given mal_id.
   */
  public async ensureFranchiseRecord(malId: number): Promise<FranchiseRelationDocument | null> {
    const existing = await FranchiseRelationModel.findOne({ mal_id: malId });
    if (existing) return existing;

    const anime = await AnimeModel.findOne({ mal_id: malId }).lean();
    if (!anime) return null;

    return this.buildFranchiseRecordFromAnime(anime as any);
  }

  /**
   * Builds and saves a FranchiseRelation record from an Anime document and its relations.
   */
  public async buildFranchiseRecordFromAnime(
    anime: AnimeDocument
  ): Promise<FranchiseRelationDocument> {
    const malId = anime.mal_id;
    const title = anime.title_english || anime.title;
    const relations = (anime.relations as any[]) || [];

    const predecessorIds = new Set<number>();
    const directSequelIds = new Set<number>();
    const rawEntries: any[] = [];
    let relationType: FranchiseRelationDocument['relationType'] = 'standalone';

    for (const rel of relations) {
      const relName = (rel.relation || '').toLowerCase();
      const entries = Array.isArray(rel.entry) ? rel.entry : [];

      for (const ent of entries) {
        const entMalId = Number(ent.mal_id || ent.malId);
        if (!entMalId || entMalId === malId) continue;

        rawEntries.push({
          relation: rel.relation,
          targetMalId: entMalId,
          targetTitle: ent.name || ent.title || '',
          targetType: ent.type || 'anime',
        });

        // 1. Prequel is a mandatory predecessor
        if (relName === 'prequel') {
          predecessorIds.add(entMalId);
          relationType = 'sequel';
        }
        // 2. Sequel is an immediate sequel
        else if (relName === 'sequel') {
          directSequelIds.add(entMalId);
        }
        // 3. Parent story is often a mandatory predecessor for continuations
        else if (relName === 'parent story') {
          predecessorIds.add(entMalId);
        }
        // 4. Side story, spin-off, alternative version
        else if (relName === 'side story') {
          if (relationType === 'standalone') relationType = 'side_story';
        } else if (relName === 'spin-off') {
          if (relationType === 'standalone') relationType = 'spinoff';
        }
      }
    }

    if (anime.type === 'movie' && predecessorIds.size > 0) {
      relationType = 'movie_continuation';
    }

    // Check if other anime list this title as sequel (reverse lookup)
    if (predecessorIds.size === 0) {
      const parentRels = await FranchiseRelationModel.find({ directSequelMalIds: malId }).lean();
      for (const pr of parentRels) {
        predecessorIds.add(pr.mal_id);
        if (anime.type === 'movie') relationType = 'movie_continuation';
        else if (relationType === 'standalone') relationType = 'sequel';
      }
    }

    // Compute transitive prerequisites
    const allPrereqs = new Set<number>(predecessorIds);
    for (const pId of Array.from(predecessorIds)) {
      const parentRel = await FranchiseRelationModel.findOne({ mal_id: pId }).lean();
      if (parentRel && parentRel.allPrerequisiteMalIds) {
        parentRel.allPrerequisiteMalIds.forEach((id) => allPrereqs.add(id));
      }
    }

    // Determine root
    let rootMalId = malId;
    if (allPrereqs.size > 0) {
      rootMalId = Array.from(allPrereqs)[0] || malId;
    }

    const doc = await FranchiseRelationModel.findOneAndUpdate(
      { mal_id: malId },
      {
        $set: {
          mal_id: malId,
          title,
          predecessorMalIds: Array.from(predecessorIds),
          allPrerequisiteMalIds: Array.from(allPrereqs),
          directSequelMalIds: Array.from(directSequelIds),
          franchiseRootMalId: rootMalId,
          franchiseTitle: title.split(':')[0]?.split('Season')[0]?.trim() || title,
          relationType,
          rawRelations: rawEntries,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return doc as unknown as FranchiseRelationDocument;
  }
}

export const franchiseService = new FranchiseService();
