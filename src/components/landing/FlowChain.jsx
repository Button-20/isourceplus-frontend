import { Fragment } from "react";
import { ChevronRight, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

// A wrapping chain of pill steps: "RFQ → Quotation → PO → …".
// `joiner` "+" renders plus signs instead of arrows (e.g. three-way match).
// `tone` "onBrand" is for use on the solid brand-blue surfaces.
export default function FlowChain({
  steps,
  joiner = "arrow",
  tone = "default",
  size = "md",
  className,
}) {
  const Sep = joiner === "+" ? Plus : ChevronRight;
  const onBrand = tone === "onBrand";
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-2", className)}
      role="list"
    >
      {steps.map((step, i) => (
        <Fragment key={`${step}-${i}`}>
          {i > 0 && (
            <Sep
              aria-hidden="true"
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                onBrand ? "text-white/60" : "text-muted-foreground/70",
              )}
            />
          )}
          <span
            role="listitem"
            className={cn(
              "inline-flex items-center rounded-full font-medium",
              size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
              onBrand
                ? "bg-white/15 text-white"
                : "border border-brand/20 bg-brand/5 text-brand",
            )}
          >
            {step}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
