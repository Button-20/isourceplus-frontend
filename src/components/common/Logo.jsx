import { Link } from "react-router-dom";
import { assets } from "@/assets/assets";
import { cn } from "@/lib/utils";

// Single source of truth for the brand mark. The PNG is a full wordmark
// ("i-source+"), so we never render a duplicate text label next to it.
// `onDark` places it on a light chip so the coloured wordmark stays legible
// against dark backgrounds (e.g. the footer).
export default function Logo({ to = "/", className, imgClassName, onDark = false }) {
  const img = (
    <img
      src={assets.ISlogo}
      alt="iSource+"
      className={cn("h-8 w-auto", imgClassName)}
    />
  );

  const content = onDark ? (
    <span className="inline-flex items-center rounded-lg bg-white px-2.5 py-1.5">
      {img}
    </span>
  ) : (
    img
  );

  if (!to) return <span className={cn("inline-flex", className)}>{content}</span>;

  return (
    <Link to={to} className={cn("inline-flex items-center", className)}>
      {content}
    </Link>
  );
}
