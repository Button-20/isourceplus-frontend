import { Info } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Radix Select can't represent "" as an item value, so "no preference" uses a
// sentinel that maps back to "" on change.
const NONE = "__none__";

export const PAYOUT_METHOD_OPTIONS = [
  { value: NONE, label: "Wallet (default)" },
  { value: "MoMo", label: "MoMo" },
  { value: "Bank", label: "Bank" },
];

/**
 * Supplier payout-method selector (MoMo / Bank / wallet). `value` is "" when
 * unset; `onChange` receives "" | "MoMo" | "Bank".
 */
export default function PayoutMethodField({ value = "", onChange, className }) {
  return (
    <div className={className}>
      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
        Payout method
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Your payout goes to the method chosen here. If no method is chosen
              or the destination is incomplete, the amount is credited to your
              virtual wallet instead, where you can withdraw to MoMo or Bank.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </label>
      <Select
        value={value || NONE}
        onValueChange={(v) => onChange(v === NONE ? "" : v)}
      >
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder="Select payout method" />
        </SelectTrigger>
        <SelectContent>
          {PAYOUT_METHOD_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
