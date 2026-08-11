// Compatibility shim. The implementation moved to services/context to match the
// peerpays-style layout (services own all non-UI logic). Existing imports of
// "@/contexts/app.context" keep working; migrate them to
// "@/services/context/app.context" over time, then delete this file.
export {
  AppContext,
  AppProvider,
  useAuth,
} from "@/services/context/app.context";
