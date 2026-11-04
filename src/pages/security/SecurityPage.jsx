// "Security": sign-in protection for the signed-in user (two-factor
// authentication).
import { ShieldCheck } from "lucide-react";

import TwoFactorSettings from "@/components/security/TwoFactorSettings";

export default function SecurityPage() {
  return (
    <div className="w-full space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          <ShieldCheck className="h-3.5 w-3.5" /> Account
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
          Security
        </h1>
        <p className="mt-2 max-w-lg text-sm text-white/85">
          Protect your account with a second step at sign-in.
        </p>
      </div>

      <TwoFactorSettings />
    </div>
  );
}
