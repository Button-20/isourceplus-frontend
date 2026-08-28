import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const Pagination = ({ count, page, setPage, next, previous }) => {
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(count / itemsPerPage));

  const maxPagesToShow = 5;
  const startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i += 1) pageNumbers.push(i);

  const go = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  // Nothing to paginate — don't render a lonely control.
  if (totalPages <= 1) return null;

  const navBtn =
    "inline-flex h-9 items-center gap-1 rounded-lg border border-border/70 px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-border/60 p-4">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={!previous}
        className={navBtn}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {pageNumbers.map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => go(num)}
          aria-current={page === num ? "page" : undefined}
          className={cn(
            "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors",
            page === num
              ? "bg-brand-gradient text-brand-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {num}
        </button>
      ))}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={!next}
        className={navBtn}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Pagination;
