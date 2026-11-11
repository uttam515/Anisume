import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate page numbers window
  const getPageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift(-1); // ellipsis
    }
    if (currentPage + delta < totalPages - 1) {
      range.push(-2); // ellipsis
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center space-x-1.5 my-10 select-none">
      {/* First Page */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1 || disabled}
        className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-slate-400 hover:text-white hover:bg-dark-850 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="First page"
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>

      {/* Prev Page */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
        className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-slate-400 hover:text-white hover:bg-dark-850 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Numbers */}
      <div className="flex items-center space-x-1">
        {pages.map((p, idx) => {
          if (p < 0) {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-600 text-xs">
                …
              </span>
            );
          }

          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={disabled || isActive}
              className={`min-w-9 h-9 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'bg-dark-900 border border-dark-800 text-slate-400 hover:text-white hover:bg-dark-850'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Next Page */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || disabled}
        className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-slate-400 hover:text-white hover:bg-dark-850 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Last Page */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages || disabled}
        className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-slate-400 hover:text-white hover:bg-dark-850 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Last page"
      >
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  );
}

