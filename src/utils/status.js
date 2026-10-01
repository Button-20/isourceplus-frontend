// Entity status helpers. The backend returns `status` enums in UPPERCASE
// ("DRAFT", "CLOSED", …) on newer records and lowercase on older ones, so
// never compare the raw string — normalise first.

export const normalizeStatus = (status) =>
  String(status ?? "")
    .trim()
    .toLowerCase();

// Draft = still open for responses / awards.
export const isDraftStatus = (status) => normalizeStatus(status) === "draft";

// Draft or open = the event is still live.
export const isOpenStatus = (status) =>
  ["draft", "open"].includes(normalizeStatus(status));
