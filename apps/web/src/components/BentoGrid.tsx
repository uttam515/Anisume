import { ReactNode } from 'react';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[220px] ${className}`}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
  bgImage?: string;
  badge?: string;
  badgeColor?: 'red' | 'emerald' | 'sky' | 'pink' | 'yellow' | 'orange';
}

export function BentoCard({
  children,
  className = '',
  colSpan = 1,
  rowSpan = 1,
  bgImage,
  badge,
  badgeColor = 'red',
}: BentoCardProps) {
  const colSpanClasses = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'col-span-full',
  }[colSpan];

  const rowSpanClasses = {
    1: 'row-span-1',
    2: 'row-span-2',
  }[rowSpan];

  const badgeColorClasses = {
    red: 'bg-emerald-600 text-white',
    emerald: 'bg-brand-emerald text-dark-950 font-black',
    sky: 'bg-brand-sky text-dark-950 font-black',
    pink: 'bg-brand-pink text-white font-black',
    yellow: 'bg-brand-yellow text-dark-950 font-black',
    orange: 'bg-brand-orange text-white font-black',
  }[badgeColor];

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden border border-dark-800 bg-dark-900 transition-all duration-300 hover:border-dark-700 shadow-xl flex flex-col justify-between p-6 ${colSpanClasses} ${rowSpanClasses} ${className}`}
    >
      {/* Background Image & Editorial Gradient */}
      {bgImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={bgImage}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-40 filter saturate-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/70 to-dark-950/30" />
        </div>
      )}

      {/* Top Header Badge */}
      {badge && (
        <div className="relative z-10 self-start">
          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md ${badgeColorClasses}`}
          >
            {badge}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end">{children}</div>
    </div>
  );
}

