// The message to show for a failed API call. The backend's own wording is
// specific ("This email is already in use") where a generic "Failed to create
// company" isn't, so it always wins; `fallback` is only for errors that carry
// no message (network failures, empty bodies, the server's HTML error pages).
//
// Understands every error shape the backend sends:
//   { detail } / { Detail }                      DRF
//   { message } / { error } / { errors }         envelopes, incl. HTTP-200 ones
//   { field, message, hint }                     validation envelope
//   { email: ["…"], location: { region: ["…"] } } field errors (nested too)
//   { non_field_errors: ["…"] }
//   a plain-text body
// plus errors already turned into messages (err.envelope / err.unavailable).

const GENERIC_KEYS = [
  "detail",
  "Detail",
  "message",
  "Message",
  "error",
  "errors",
  "non_field_errors",
  "msg",
];
// Envelope bookkeeping, never a message.
const IGNORED_KEYS = new Set([
  "status",
  "code",
  "status_code",
  "success",
  "field",
  "hint",
  "data",
]);

// "new_password1" → "New password".
const humanize = (key) => {
  const words = String(key).replace(/[_-]+/g, " ").replace(/\d+$/, "").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const isHtml = (s) => /^\s*</.test(s) && /<(html|!doctype|body)/i.test(s);

// First readable string inside a value (string, array or object).
function textOf(value, depth = 0) {
  if (value == null || depth > 4) return "";
  if (typeof value === "string") return isHtml(value) ? "" : value.trim();
  if (typeof value === "number" || typeof value === "boolean") return "";
  if (Array.isArray(value)) {
    for (const item of value) {
      const t = textOf(item, depth + 1);
      if (t) return t;
    }
    return "";
  }
  if (typeof value === "object") return messageFromBody(value, depth + 1);
  return "";
}

// The message inside an error body, or "".
export function messageFromBody(body, depth = 0) {
  if (body == null || depth > 4) return "";
  if (typeof body === "string") {
    const s = body.trim();
    return !s || isHtml(s) || s.length > 500 ? "" : s;
  }
  if (Array.isArray(body)) return textOf(body, depth);
  if (typeof body !== "object") return "";

  for (const key of GENERIC_KEYS) {
    const t = textOf(body[key], depth);
    if (!t) continue;
    // { field, message, hint }: name the field and add the hint.
    const field = typeof body.field === "string" ? body.field : "";
    const hint = typeof body.hint === "string" ? body.hint.trim() : "";
    let msg = field && key === "message" ? `${humanize(field)}: ${t}` : t;
    if (hint && key === "message") msg += ` (${hint})`;
    return msg;
  }

  // An envelope's payload: { success: false, data: { message } }.
  if (body.data && typeof body.data === "object") {
    const t = messageFromBody(body.data, depth + 1);
    if (t) return t;
  }

  // Field errors: "Email: This email is already in use."
  for (const [key, value] of Object.entries(body)) {
    if (IGNORED_KEYS.has(key)) continue;
    const t = textOf(value, depth);
    if (t) return /^\d+$/.test(key) ? t : `${humanize(key)}: ${t}`;
  }
  return "";
}

export function apiErrorMessage(
  err,
  fallback = "Something went wrong. Please try again.",
) {
  if (!err) return fallback;
  // Errors the services already turned into a message.
  if ((err.envelope || err.unavailable) && err.message) return err.message;

  const res = err.response;
  if (res) {
    const msg = messageFromBody(res.data);
    // DRF's bare "Not found." says less than the caller's own wording.
    if (msg && !/^not found\.?$/i.test(msg)) return msg;
    const body = res.data;
    if (res.status === 404 && typeof body === "string" && isHtml(body))
      return "This isn't available on the server yet.";
    if (res.status === 413) return "That upload is too large.";
    if (res.status === 429)
      return "Too many attempts. Please wait a few minutes and try again.";
    if (res.status >= 500)
      return "The server ran into a problem. Please try again shortly.";
    return fallback;
  }
  // No response at all: offline, CORS, timeout.
  if (err.request || err.code === "ERR_NETWORK")
    return "Couldn't reach the server. Check your connection and try again.";
  // Plain Errors thrown by our own code carry a readable message (but not
  // TypeErrors and the like, which are bugs, not news for the user).
  if (err.name === "Error" && err.message && !err.isAxiosError)
    return err.message;
  return fallback;
}
