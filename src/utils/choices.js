// Helpers for backend "choices" endpoints (transporter type, transport mode,
// transport means, …). Shared so the create and edit forms agree on how a
// choices payload is turned into { value, label } options.

export const prettify = (s) =>
  String(s)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Normalize a choices response into { value, label }[]. The exact shape isn't
// guaranteed, so handle strings, [value, label] tuples, and objects.
export function normalizeChoices(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.choices)
        ? data.choices
        : [];
  return list
    .map((item) => {
      if (typeof item === "string")
        return { value: item, label: prettify(item) };
      if (Array.isArray(item))
        return {
          value: String(item[0]),
          label: String(item[1] ?? prettify(item[0])),
        };
      if (item && typeof item === "object") {
        const value = item.value ?? item.id ?? item.key ?? item.name ?? "";
        const label =
          item.label ?? item.display_name ?? item.name ?? prettify(value);
        return { value: String(value), label: String(label) };
      }
      return null;
    })
    .filter((c) => c && c.value !== "");
}
