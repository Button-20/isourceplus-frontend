import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Single source of truth for the brand mark — the 2026 iSourcePlus identity:
// two interlocking rings (azure + navy) beside the "i-SOURCEPLUS®" wordmark,
// rendered as one inline SVG so it stays crisp at every size.
//
// Theme-aware by default via brand tokens: the azure ring + "PLUS" use --brand,
// the navy ring uses --brand-2, and "i-SOURCE" follows the foreground (dark on
// light, light on dark). `onDark` forces a mono-white lockup for placement on
// solid brand-blue surfaces (auth panel, gradient headers/footers).
export default function Logo({
  to = "/",
  className,
  imgClassName,
  onDark = false,
  showWordmark = true,
  showTagline = false,
}) {
  const ringAzure = onDark ? "stroke-white" : "stroke-brand";
  const ringNavy = onDark ? "stroke-white" : "stroke-brand-2";
  const textMain = onDark ? "fill-white" : "fill-foreground";
  const textAccent = onDark ? "fill-white" : "fill-brand";
  const tagFill = onDark ? "fill-white/80" : "fill-muted-foreground";

  const width = showWordmark ? 300 : 64;
  const height = showTagline ? 76 : 64;

  const svg = (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-8 w-auto", imgClassName)}
      style={{ overflow: "visible" }}
      role="img"
      aria-label="iSourcePlus"
    >
      {/* Interlocking-rings mark */}
      <g fill="none" strokeWidth="8">
        <circle cx="24" cy="32" r="14" className={ringAzure} />
        <circle cx="40" cy="32" r="14" className={ringNavy} />
        {/* Redraw the azure ring's top arc so it weaves over the navy ring. */}
        <path d="M24 18 A14 14 0 0 1 37.16 27.21" className={ringAzure} />
      </g>

      {showWordmark && (
        <>
          <text
            x="72"
            y={showTagline ? 37 : 42}
            fontFamily="Inter, sans-serif"
            fontWeight="800"
            fontSize="29"
            letterSpacing="-0.5"
          >
            <tspan className={textMain}>i-SOURCE</tspan>
            <tspan className={textAccent}>PLUS</tspan>
            <tspan className={textAccent} fontSize="12" dy="-13">
              ®
            </tspan>
          </text>
          {showTagline && (
            <text
              x="74"
              y="64"
              fontFamily="Inter, sans-serif"
              fontWeight="600"
              fontSize="10"
              letterSpacing="3.5"
              className={tagFill}
            >
              CONNECT. SOURCE. PAY.
            </text>
          )}
        </>
      )}
    </svg>
  );

  if (!to)
    return <span className={cn("inline-flex", className)}>{svg}</span>;

  return (
    <Link to={to} className={cn("inline-flex items-center", className)}>
      {svg}
    </Link>
  );
}
