import type { Anime } from '@anisume/shared';
import AnimeCard from './AnimeCard.js';

interface AnimeGridProps {
  animeList: Anime[];
  priorityCount?: number;
}

export default function AnimeGrid({ animeList, priorityCount = 6 }: AnimeGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
      {animeList.map((anime, idx) => (
        <AnimeCard
          key={anime.mal_id}
          anime={anime}
          priority={idx < priorityCount}
        />
      ))}
    </div>
  );
}

