import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination = React.memo(
  ({ currentPage, totalPages, onPageChange, className }: PaginationProps) => {
    const handlePageChange = useCallback(
      (page: number) => {
        if (page < 1 || page > totalPages) return;
        onPageChange(page);
      },
      [onPageChange, totalPages]
    );

    // Show max 5 page buttons
    const getPageNumbers = (): (number | 'ellipsis')[] => {
      if (totalPages <= 7)
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      const pages: (number | 'ellipsis')[] = [1];
      if (currentPage > 3) pages.push('ellipsis');
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
      return pages;
    };

    if (totalPages <= 1) return null;

    return (
      <div
        className={`flex items-center justify-center gap-1.5 ${className || ''}`}
      >
        {/* Previous */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1.5 btn-secondary px-3 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-9 h-9 flex items-center justify-center text-text-muted text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-150 ${
                currentPage === page
                  ? 'bg-primary-500 text-white shadow-btn-primary'
                  : 'text-text-secondary hover:bg-surface-muted'
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1.5 btn-secondary px-3 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';
export default Pagination;
