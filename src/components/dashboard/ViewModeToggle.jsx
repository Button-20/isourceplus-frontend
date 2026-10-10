import { useState } from "react";
import { ShoppingCart, Store } from "lucide-react";

import { useAuth } from "@/services/context/app.context";
import { cn } from "@/lib/utils";
import SwitchToBuyerModal from "@/components/dashboard/SwitchToBuyerModal";
import SwitchToSupplierModal from "@/components/dashboard/SwitchToSupplierModal";

// Global segmented control letting a switch-enabled company (type_switch=true)
// move between the Buyer and Supplier experience. The active mode lives in the
// app context (persisted) and drives which dashboard overview is shown. Each
// switch is recorded on the backend via companies/supplier-switch/:
//   → Buyer:    pick a buyer industry,   ?switch_permission=accept { industry }
//   → Supplier: pick a sub-category,     ?switch_permission=cancel { sub_category }
const OPTIONS = [
  { value: "buyer", label: "Buyer", icon: ShoppingCart },
  { value: "supplier", label: "Supplier", icon: Store },
];

export default function ViewModeToggle({ className }) {
  const { viewMode, setViewMode } = useAuth();
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);

  const select = (value) => {
    if (value === viewMode) return;
    if (value === "buyer") setBuyerOpen(true);
    else setSupplierOpen(true);
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
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => select(value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-white text-header shadow-sm"
                  : "text-white/85 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
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
      <SwitchToSupplierModal
        open={supplierOpen}
        onOpenChange={setSupplierOpen}
        onSwitched={() => setViewMode("supplier")}
      />
    </>
  );
}
