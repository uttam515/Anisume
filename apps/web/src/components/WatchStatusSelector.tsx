import { useState, useRef, useEffect } from 'react';
import type { WatchStatus } from '@anisume/shared';
import { ChevronDown, Play, CheckCircle2, Bookmark, PauseCircle, XCircle } from 'lucide-react';

export const WATCH_STATUS_CONFIG: Record<
  WatchStatus,
  { label: string; color: string; bg: string; border: string; icon: any }
> = {
  watching: {
    label: 'Watching',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    icon: Play,
  },
  completed: {
    label: 'Completed',
    color: 'text-brand-emerald',
    bg: 'bg-brand-emerald/10',
    border: 'border-brand-emerald/30',
    icon: CheckCircle2,
  },
  plan_to_watch: {
    label: 'Plan to Watch',
    color: 'text-brand-sky',
    bg: 'bg-brand-sky/10',
    border: 'border-brand-sky/30',
    icon: Bookmark,
  },
  on_hold: {
    label: 'On Hold',
    color: 'text-brand-orange',
    bg: 'bg-brand-orange/10',
    border: 'border-brand-orange/30',
    icon: PauseCircle,
  },
  dropped: {
    label: 'Dropped',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    icon: XCircle,
  },
};

interface WatchStatusSelectorProps {
  currentStatus: WatchStatus | null;
  onSelect: (status: WatchStatus) => Promise<void> | void;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function WatchStatusSelector({
  currentStatus,
  onSelect,
  loading = false,
  size = 'md',
  className = '',
}: WatchStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const config = currentStatus ? WATCH_STATUS_CONFIG[currentStatus] : null;
  const CurrentIcon = config ? config.icon : Bookmark;

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-xs gap-2',
    lg: 'px-4 py-2.5 text-sm gap-2.5',
  }[size];

  const isFullWidth = className.includes('w-full');

  return (
    <div className={`relative ${isFullWidth ? 'w-full block' : 'inline-block'} text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={loading}
        onClick={() => setIsOpen(!isOpen)}
        className={`${isFullWidth ? 'w-full' : ''} inline-flex items-center justify-between rounded-xl font-semibold border transition-all ${sizeClasses} ${
          config
            ? `${config.bg} ${config.color} ${config.border} hover:opacity-90`
            : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-md shadow-indigo-600/20'
        } disabled:opacity-50`}
      >
        <div className="flex items-center space-x-1.5 truncate">
          <CurrentIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{config ? config.label : 'Add to List'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-48 rounded-2xl bg-dark-900 border border-dark-800 shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in duration-100">
          {(Object.keys(WATCH_STATUS_CONFIG) as WatchStatus[]).map((status) => {
            const itemConfig = WATCH_STATUS_CONFIG[status];
            const ItemIcon = itemConfig.icon;
            const isSelected = currentStatus === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSelect(status);
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                  isSelected
                    ? `${itemConfig.bg} ${itemConfig.color} font-bold`
                    : 'text-slate-300 hover:text-white hover:bg-dark-850'
                }`}
              >
                <ItemIcon className={`w-4 h-4 ${itemConfig.color}`} />
                <span>{itemConfig.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

