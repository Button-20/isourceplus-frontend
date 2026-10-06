import { useState } from "react";
import { Loader2, ShoppingCart, Store } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/services/context/app.context";
import { cn } from "@/lib/utils";
import SwitchToBuyerModal from "@/components/dashboard/SwitchToBuyerModal";
import {
  supplierSwitch,
  supplierSwitchErrorMessage,
} from "@/services/api/companies.service";

// Global segmented control letting a supplier company switch between the Buyer
// and Supplier experience. The active mode lives in the app context
// (persisted) and drives which dashboard overview is shown. Switching is
// recorded on the backend via companies/supplier-switch/:
//   → Buyer:    pick a buyer industry, ?switch_permission=accept { industry }
//   → Supplier: ?switch_permission=cancel
const OPTIONS = [
  { value: "buyer", label: "Buyer", icon: ShoppingCart },
  { value: "supplier", label: "Supplier", icon: Store },
];

export default function ViewModeToggle({ className }) {
  const { viewMode, setViewMode } = useAuth();
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const select = async (value) => {
    if (value === viewMode || busy) return;
    if (value === "buyer") {
      setBuyerOpen(true);
      return;
    }
    setBusy(true);
    try {
      const res = await supplierSwitch("cancel");
      setViewMode("supplier");
      toast.success(res?.message || "Switched back to supplier.");
    } catch (err) {
      toast.error(
        supplierSwitchErrorMessage(err, "Couldn't switch back to supplier."),
      );
      console.error("Supplier switch error:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        role="group"
        aria-label="Switch between buyer and supplier"
        className={cn(
          // Sits on the navy app header, so it's styled for a dark surface.
          "inline-flex items-center rounded-lg border border-white/25 bg-white/10 p-0.5",
          className,
        )}
      >
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = viewMode === value;
          const pending = busy && value === "supplier";
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              disabled={busy}
              onClick={() => select(value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-wait",
                active
                  ? "bg-white text-header shadow-sm"
                  : "text-white/85 hover:bg-white/10 hover:text-white",
              )}
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {label}
            </button>
          );
        })}
      </div>

      <SwitchToBuyerModal
        open={buyerOpen}
        onOpenChange={setBuyerOpen}
        onSwitched={() => setViewMode("buyer")}
      />
    </>
  );
}
