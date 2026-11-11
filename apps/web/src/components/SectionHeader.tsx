import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  viewAllLink?: string;
  kanji?: string;
  accentColor?: 'emerald' | 'sky' | 'pink' | 'yellow' | 'orange';
}

export default function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  viewAllLink,
  kanji,
  accentColor = 'emerald',
}: SectionHeaderProps) {
  const iconColorClasses = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    sky: 'bg-brand-sky/15 text-brand-sky border-brand-sky/30',
    pink: 'bg-brand-pink/15 text-brand-pink border-brand-pink/30',
    yellow: 'bg-brand-yellow/15 text-brand-yellow border-brand-yellow/30',
    orange: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  }[accentColor];

  const kanjiColorClasses = {
    emerald: 'text-emerald-400',
    sky: 'text-brand-sky',
    pink: 'text-brand-pink',
    yellow: 'text-brand-yellow',
    orange: 'text-brand-orange',
  }[accentColor];

  return (
    <div className="flex items-end justify-between mb-6 gap-4">
      <div>
        <div className="flex items-center space-x-2.5">
          {Icon && (
            <div className={`p-2 rounded-xl border ${iconColorClasses} shadow-sm`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="flex items-baseline space-x-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {title}
            </h2>
            {kanji && (
              <span className={`font-japanese text-xs font-black tracking-wider ${kanjiColorClasses}`}>
                {kanji}
              </span>
            )}
          </div>
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {viewAllLink && (
        <Link
          to={viewAllLink}
          className="group inline-flex items-center space-x-1 text-xs font-bold text-slate-300 hover:text-white transition-colors shrink-0 px-3 py-1.5 rounded-lg hover:bg-dark-850"
        >
          <span>Explore All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 text-emerald-400 transition-transform" />
        </Link>
      )}
    </div>
  );
}
