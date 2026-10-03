// Shared line-items table for commercial documents (proforma invoices, sales
// invoices, …): quantity, unit price, extended value per row and a total row.
//
// Extended value comes from the backend (`extended_value`, already net of any
// discount). When a row doesn't carry one (e.g. auto-populated items on a
// create page) it falls back to quantity × unit price. The total uses the
// document's own total when given, otherwise the sum of the rows.

import { formatMoney } from "@/utils/money";

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const extendedValueOf = (item) => {
  const ev = toNumber(item?.extended_value);
  if (ev !== null) return ev;
  const qty = toNumber(item?.quantity);
  const price = toNumber(item?.unit_price);
  return qty !== null && price !== null ? qty * price : null;
};

export default function LineItemsTable({
  items,
  total,
  totalLabel = "Total cost",
  currency,
}) {
  const cur = currency || "GHS";
  const rows = Array.isArray(items) ? items : [];

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No items available.
      </p>
    );
  }

  const computedTotal = rows.reduce((sum, it) => {
    const ev = extendedValueOf(it);
    return ev === null ? sum : sum + ev;
  }, 0);
  const displayTotal = toNumber(total) ?? computedTotal;

  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border/70 bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">#</th>
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="px-4 py-2.5 font-medium">Description</th>
            <th className="px-4 py-2.5 text-right font-medium">Qty</th>
            <th className="px-4 py-2.5 font-medium">Unit</th>
            <th className="px-4 py-2.5 text-right font-medium">Unit price</th>
            <th className="px-4 py-2.5 text-right font-medium">
              Extended value
            </th>
            <th className="px-4 py-2.5 font-medium">Special handling</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((item, i) => {
            const handles = Array.isArray(item.special_handles)
              ? item.special_handles
              : [];
            return (
              <tr key={item.id ?? i} className="align-top">
                <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <p className="font-medium">{item.name || "N/A"}</p>
                  {item.extra_value && (
                    <p className="text-xs text-muted-foreground">
                      + {item.extra_value}
                      {item.extra_value_TnCs
                        ? ` (${item.extra_value_TnCs})`
                        : ""}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {item.description || "N/A"}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {item.quantity}
                </td>
                <td className="px-4 py-2.5">{item.unit_of_measure}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                  {formatMoney(item.unit_price, cur)}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums">
                  {formatMoney(extendedValueOf(item), cur)}
                </td>
                <td className="px-4 py-2.5">
                  {handles.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {handles.map((sh, j) => (
                        <span
                          key={sh?.id ?? j}
                          className="text-muted-foreground"
                        >
                          {typeof sh === "string"
                            ? sh
                            : sh?.handling_description}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border/70 bg-muted/30">
            <td
              colSpan={6}
              className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {totalLabel}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right font-display text-base font-bold tabular-nums">
              {formatMoney(displayTotal, cur)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
