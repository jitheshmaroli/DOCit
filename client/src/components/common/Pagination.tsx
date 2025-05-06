import React, { useCallback } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination = React.memo(({ currentPage, totalPages, onPageChange, className }: PaginationProps) => {
  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  }, [onPageChange, totalPages]);

  return (
    <div className={`flex justify-center space-x-2 mt-4 ${className || ''}`}>
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-purple-600 text-white rounded-lg disabled:bg-gray-600 hover:bg-purple-700 transition-all duration-300"
      >
        Previous
      </button>
      <span className="px-3 py-1 text-white">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 bg-purple-600 text-white rounded-lg disabled:bg-gray-600 hover:bg-purple-700 transition-all duration-300"
      >
        Next
      </button>
    </div>
  );
});

export default Pagination;