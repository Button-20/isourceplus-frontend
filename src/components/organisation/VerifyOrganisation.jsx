import { useState } from "react";
import { Loader2, ShieldCheck, BadgeCheck, XCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { verifyOrganisation } from "@/services/api/organisation.service";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

// Inline TIN verification field. `value`/`onChange` keep the TIN controlled by
// the parent (so it can persist to a draft); `onVerified({ tin, organisationName })`
// fires when the backend confirms the organisation.
export default function VerifyOrganisation({
  value,
  onChange,
  onVerified,
  label = "Tax Identification Number (TIN)",
  hint = "Verify your organisation to pull its official registered name.",
}) {
  const [loading, setLoading] = useState(false);
  // result: null | { ok: true, name } | { ok: false, message }
  const [result, setResult] = useState(null);

  const tin = (value || "").trim();

  const handleChange = (e) => {
    // A new TIN invalidates any previous verification result.
    setResult(null);
    onChange?.(e.target.value);
  };

  const handleVerify = async () => {
    if (!tin) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await verifyOrganisation(tin);
      // Success envelope: { status, message, data: { tin, organisationName } }.
      const name =
        res?.data?.organisationName ?? res?.data?.organisation_name ?? "";
      if (res?.status === false) {
        setResult({ ok: false, message: res?.message || "Verification failed." });
        return;
      }
      setResult({ ok: true, name });
      onVerified?.({ tin, organisationName: name });
    } catch (err) {
      const data = err.response?.data;
      const message =
        data?.message ||
        data?.errors?.tin?.[0] ||
        data?.detail ||
        "Couldn't verify that TIN. Please check it and try again.";
      setResult({ ok: false, message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value || ""}
            onChange={handleChange}
            placeholder="12345678-0001"
            className="pl-9"
            aria-label={label}
          />
        </div>
        <Button
          type="button"
          onClick={handleVerify}
          disabled={loading || !tin}
          variant="outline"
          className="shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </div>

      {result?.ok ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-emerald-400">
          <BadgeCheck className="h-4 w-4 shrink-0" />
          Verified{result.name ? `: ${result.name}` : ""}
        </p>
      ) : result ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          {result.message}
        </p>
      ) : (
        <p className={cn("mt-1.5 text-xs text-muted-foreground")}>{hint}</p>
      )}
    </div>
  );
}
