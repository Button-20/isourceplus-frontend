import { Link } from "react-router-dom";
import { assets } from "@/assets/assets";
import { cn } from "@/lib/utils";

// Single source of truth for the brand mark. The PNG is a full wordmark
// ("i-source+"), so we never render a duplicate text label next to it.
// `onDark` renders the wordmark as a clean white mark (Potrise-style) so it
// stays legible on dark surfaces (nav, footer, the blue auth panel) without
// boxing it in a chip.
export default function Logo({ to = "/", className, imgClassName, onDark = false }) {
  const img = (
    <img
      src={assets.ISlogo}
      alt="iSource+"
      className={cn("h-8 w-auto", onDark && "brightness-0 invert", imgClassName)}
    />
  );

  const content = img;

  if (!to) return <span className={cn("inline-flex", className)}>{content}</span>;

  return (
    <Link to={to} className={cn("inline-flex items-center", className)}>
      {content}
    </Link>
  );
}
