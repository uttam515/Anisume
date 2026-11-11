import { SearchX, RefreshCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  resetLabel?: string;
}

export function EmptyState({
  title = 'No anime found',
  description = 'Try adjusting your search terms or filters to find what you are looking for.',
  onReset,
  resetLabel = 'Reset Filters',
}: EmptyStateProps) {
  return (
    <div className="bg-dark-900/60 border border-dark-800 rounded-2xl p-12 text-center max-w-md mx-auto my-12">
      <div className="w-12 h-12 rounded-xl bg-dark-850 flex items-center justify-center mx-auto mb-4 text-slate-500 border border-dark-800">
        <SearchX className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-xs text-slate-400 mb-6 leading-relaxed">{description}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow transition-all"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>{resetLabel}</span>
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Failed to load anime records. Please check your connection and try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
      <div className="w-10 h-10 rounded-full bg-rose-900/40 flex items-center justify-center mx-auto mb-3 text-rose-400">
        <RefreshCcw className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-rose-200 mb-1">Connection Error</h3>
      <p className="text-xs text-rose-300/80 mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

