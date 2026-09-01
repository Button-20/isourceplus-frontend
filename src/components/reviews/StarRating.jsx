import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Star rating. Read-only by default; pass `onChange` to make it interactive.
 * `size` is the icon size in px.
 */
export default function StarRating({
  value = 0,
  onChange,
  size = 18,
  className,
}) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === "function";
  const active = hover || value;

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= active;
        return interactive ? (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
              )}
            />
          </button>
        ) : (
          <Star
            key={star}
            style={{ width: size, height: size }}
            className={cn(
              filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
            )}
          />
        );
      })}
    </div>
  );
}
