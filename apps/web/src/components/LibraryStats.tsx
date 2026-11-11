import type { LibraryStats as LibraryStatsType } from '@anisume/shared';
import { Layers, Play, CheckCircle2, Bookmark, PauseCircle, XCircle, Star, Tv } from 'lucide-react';

interface LibraryStatsProps {
  stats: LibraryStatsType;
}

export default function LibraryStats({ stats }: LibraryStatsProps) {
  const cards = [
    { label: 'Total Anime', value: stats.total, icon: Layers, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Watching', value: stats.watching, icon: Play, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Plan to Watch', value: stats.plan_to_watch, icon: Bookmark, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'On Hold', value: stats.on_hold, icon: PauseCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Dropped', value: stats.dropped, icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    {
      label: 'Mean Score',
      value: stats.meanScore ? `${stats.meanScore}★` : '—',
      icon: Star,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Episodes Watched',
      value: stats.totalEpisodesWatched.toLocaleString(),
      icon: Tv,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-dark-900 border border-dark-800/80 rounded-2xl p-3.5 shadow-lg flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-400 truncate">{card.label}</span>
              <div className={`p-1 rounded-lg ${card.bg} ${card.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-black text-white tracking-tight">{card.value}</div>
          </div>
        );
      })}
    </div>
  );
}

