import { ShoppingCart, Store } from "lucide-react";

import { useAuth } from "@/services/context/app.context";
import { cn } from "@/lib/utils";

// Global segmented control letting the user switch between the Buyer and
// Supplier experience. The active mode lives in the app context (persisted) and
// drives which dashboard overview is shown.
const OPTIONS = [
  { value: "buyer", label: "Buyer", icon: ShoppingCart },
  { value: "supplier", label: "Supplier", icon: Store },
];

export default function ViewModeToggle({ className }) {
  const { viewMode, setViewMode } = useAuth();

  return (
    <div
      role="group"
      aria-label="Switch between buyer and supplier"
      className={cn(
        "inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = viewMode === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setViewMode(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-brand-gradient text-brand-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
