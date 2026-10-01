// Shared detail-page layout — one clean, full-width white card with a navy top
// accent, a title + status header, sectioned label/value details, and an action
// footer. Used by every entity detail page so they read as one system.
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { resolveMediaUrl } from "@/services/lib/env";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Full-width page wrapper + a back link. Children (the DetailCard, plus any
// sibling blocks like QuestionsForum / EscrowPanel) render below the link.
export function DetailPage({ onBack, backLabel = "Back", children }) {
  return (
    <div className="w-full space-y-5 font-montserrat">
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> {backLabel}
        </Button>
      )}
      {children}
    </div>
  );
}

// The white card with the navy top accent.
export function DetailCard({ className, children }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        className,
      )}
    >
      <div className="h-1.5 bg-header" />
      <div className="space-y-8 p-6 sm:p-8">{children}</div>
    </div>
  );
}

// Title + optional logo/icon + status badge + actions.
export function DetailHeader({
  icon: Icon,
  logo,
  title,
  subtitle,
  badge,
  actions,
}) {
  // Logos may come back as bare "/media/…" paths; rebase them onto the backend
  // host, and fall back to the entity icon if the image still fails to load.
  const logoSrc = resolveMediaUrl(logo);
  const [logoBroken, setLogoBroken] = useState(false);
  const showLogo = Boolean(logoSrc) && !logoBroken;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-4">
        {showLogo ? (
          <img
            src={logoSrc}
            alt=""
            onError={() => setLogoBroken(true)}
            className="h-12 w-12 shrink-0 rounded-xl border border-border/70 object-contain p-1"
          />
        ) : Icon ? (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Icon className="h-6 w-6" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {(badge || actions) && (
        <div className="flex flex-wrap items-center gap-3">
          {badge}
          {actions}
        </div>
      )}
    </div>
  );
}

// A titled block; sections are divided by a top border (first has none).
export function Section({ title, action, children }) {
  return (
    <section className="border-t border-border/60 pt-6 first:border-t-0 first:pt-0">
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// Label / value row (label in a fixed-width muted column).
export function Row({ label, children }) {
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-36 shrink-0 font-medium text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 text-foreground">{children}</span>
    </div>
  );
}

// Two-column grid of Rows (stacks on mobile). Use inside a Section.
export function DetailGrid({ children }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
      {children}
    </div>
  );
}

// Status pill. tone: "open" (green) | "closed"/"neutral" (muted) | "warn" (amber).
export function StatusBadge({ label, tone = "neutral" }) {
  const tones = {
    open: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    warn: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    closed: "bg-muted text-muted-foreground",
    neutral: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
        tones[tone] || tones.neutral,
      )}
    >
      {label}
    </span>
  );
}

// Right-aligned action footer (divided from the content above).
export function DetailFooter({ children }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-6">
      {children}
    </div>
  );
}
