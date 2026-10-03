// Shared currency formatting for amounts the backend returns as decimal strings.

// "2100.00" + "GHS" -> "GHS 2,100.00". Falls back to the raw value (or "—")
// when it isn't numeric.
export function formatMoney(value, currency = "GHS") {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${currency} ${n.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
