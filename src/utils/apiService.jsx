// Compatibility shim. This used to be a separate axios instance hardcoded to
// http://127.0.0.1:8000 with its own CSRF/refresh logic. It now re-exports the
// single shared client so every consumer gets the correct env-based base URL,
// unified CSRF injection, and 401 refresh handling.
//
// Migrate imports to "@/services/lib/http" over time, then delete this file.
import http, { registerLogoutHandler } from "@/services/lib/http";

export { registerLogoutHandler };
export default http;
