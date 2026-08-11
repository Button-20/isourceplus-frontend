import { Outlet } from "react-router-dom";
import LastPathTracker from "@/components/util/LastPathTracker";

// Shared shell for the authentication routes (login / signup / forgot / reset).
// The individual auth pages render their own full-screen split layouts, so this
// layout only wires cross-cutting concerns (last-path tracking) around them.
export function AuthLayout() {
  return (
    <>
      <LastPathTracker />
      <Outlet />
    </>
  );
}
