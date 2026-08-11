// Compatibility shim — canonical implementation lives in services/lib/cookies.
// Migrate imports to "@/services/lib/cookies" over time, then delete this file.
export { getCookie, setCookie, deleteCookie } from "@/services/lib/cookies";
