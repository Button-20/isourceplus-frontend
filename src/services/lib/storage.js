// Core client-side storage.
//
// The single source of truth for persistence in the browser. Every read/write
// is guarded so private mode, quota limits, or a missing `window` (SSR) can
// never throw — callers always get a usable value. When localStorage isn't
// available we transparently fall back to an in-memory store for the session.
//
// Feature modules build on this instead of touching `localStorage` directly:
//   - auth session (services/lib/auth.js)
//   - form drafts (transporter, business docs, employees, …)
//   - UI preferences (view mode)

const memory = new Map();

function localStorageWorks() {
  try {
    const probe = "__storage_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const canUse = typeof window !== "undefined" && localStorageWorks();

export const storage = {
  /** Read a raw string value, or null. */
  get(key) {
    try {
      if (canUse) return window.localStorage.getItem(key);
    } catch {
      /* fall through to memory */
    }
    return memory.has(key) ? memory.get(key) : null;
  },

  /** Write a raw string value. */
  set(key, value) {
    memory.set(key, value);
    try {
      if (canUse) window.localStorage.setItem(key, value);
    } catch {
      /* keep the in-memory copy */
    }
  },

  /** Remove a key from both stores. */
  remove(key) {
    memory.delete(key);
    try {
      if (canUse) window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },

  /** Parse a JSON value, returning `fallback` if missing or malformed. */
  getJSON(key, fallback = null) {
    const raw = storage.get(key);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  /** Serialize and store a JSON value. */
  setJSON(key, value) {
    try {
      storage.set(key, JSON.stringify(value));
    } catch {
      /* ignore serialization failures */
    }
  },
};

/**
 * A small namespaced helper for form drafts, so a form gets load/save/clear
 * without repeating JSON + try/catch plumbing:
 *
 *   const draft = createDraft("transporterFormValues");
 *   draft.load(defaults); draft.save(values); draft.clear();
 */
export function createDraft(key) {
  return {
    load: (fallback = null) => storage.getJSON(key, fallback),
    save: (value) => storage.setJSON(key, value),
    clear: () => storage.remove(key),
  };
}

export default storage;
