"use client";

import Button from "./Button";

/* =============================================================================
 * Pagination — Page navigation with previous/next and page numbers
 * ============================================================================= */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ currentPage, totalPages, onPageChange, className = "" }: PaginationProps) {
  if (totalPages <= 1) return null;

  function getVisiblePages(): (number | "...")[] {
    const delta = 2;
    const pages: (number | "...")[] = [];
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  }

  const pages = getVisiblePages();

  return (
    <nav className={`flex items-center gap-1 ${className}`} aria-label="Pagination">
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        }
      >
        <span className="hidden sm:inline">Précédent</span>
      </Button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[32px] h-8 px-2 text-sm font-medium rounded-lg transition-all ${
              currentPage === page
                ? "bg-primary text-white shadow-sm"
                : "text-foreground hover:bg-surface-2"
            }`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        )
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        }
      >
        <span className="hidden sm:inline">Suivant</span>
      </Button>
    </nav>
  );
}
