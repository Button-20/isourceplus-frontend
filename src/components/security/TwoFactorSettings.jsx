// Two-factor authentication for the signed-in user: turn it on (scan a QR,
// confirm a code, keep the backup codes), issue new backup codes, or turn it
// off. Disabling and rotating ask for the password plus a current code.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Copy,
  Download,
  KeyRound,
  Loader2,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  confirmTwoFactorEnrollment,
  disableTwoFactor,
  getTwoFactorStatus,
  qrCodeSrc,
  rotateBackupCodes,
  startTwoFactorEnrollment,
  twoFactorErrorMessage,
} from "@/services/api/two-factor.service";

const digitsOnly = (v) => v.replace(/\D/g, "").slice(0, 6);

function BackupCodes({ codes, onDone }) {
  const text = codes.join("\n");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Backup codes copied.");
    } catch {
      toast.error("Couldn't copy them — select and copy them instead.");
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: "isourceplus-backup-codes.txt",
    });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        Save these somewhere safe. Each code signs you in once if you lose your
        authenticator, and they won&apos;t be shown again.
      </div>
      <ul className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-4 font-mono text-sm">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          <Copy className="mr-1.5 h-4 w-4" /> Copy
        </Button>
        <Button variant="outline" size="sm" onClick={download}>
          <Download className="mr-1.5 h-4 w-4" /> Download
        </Button>
        <Button
          size="sm"
          className="ml-auto bg-brand-gradient text-brand-foreground hover:opacity-90"
          onClick={onDone}
        >
          I&apos;ve saved them
        </Button>
      </div>
    </div>
  );
}

// Password + current code, for turning 2FA off or issuing new backup codes.
function ConfirmIdentityDialog({ mode, onClose, onDone }) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode) {
      setPassword("");
      setCode("");
    }
  }, [mode]);

  const disabling = mode === "disable";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (disabling) {
        const message = await disableTwoFactor({ password, code });
        toast.success(message || "Two-factor authentication is off.");
        onDone({ enabled: false });
      } else {
        const codes = await rotateBackupCodes({ password, code });
        onDone({ backupCodes: codes });
      }
    } catch (err) {
      toast.error(
        twoFactorErrorMessage(
          err,
          disabling
            ? "Couldn't turn off two-factor authentication."
            : "Couldn't issue new backup codes.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(mode)} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {disabling
              ? "Turn off two-factor authentication?"
              : "Issue new backup codes"}
          </DialogTitle>
          <DialogDescription>
            {disabling
              ? "Signing in will only need your password. Confirm it's you first."
              : "Your current backup codes stop working. Confirm it's you first."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            inputMode="text"
            autoComplete="one-time-code"
            placeholder="Authenticator or backup code"
            value={code}
            maxLength={16}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={disabling ? "destructive" : "default"}
              disabled={busy || !password || !code.trim()}
            >
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {disabling ? "Turn off" : "Issue new codes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TwoFactorSettings() {
  const [enabled, setEnabled] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  // Enrollment in progress: { totp_secret, provisioning_uri, qr_code }.
  const [enrollment, setEnrollment] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState(null);
  const [confirmMode, setConfirmMode] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setEnabled(await getTwoFactorStatus());
    } catch (err) {
      setLoadError(
        twoFactorErrorMessage(
          err,
          "Couldn't check your two-factor authentication.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const start = async () => {
    setBusy(true);
    try {
      setEnrollment(await startTwoFactorEnrollment());
      setCode("");
    } catch (err) {
      toast.error(
        twoFactorErrorMessage(err, "Couldn't start the set-up. Try again."),
      );
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await confirmTwoFactorEnrollment(code);
      toast.success(res.message || "Two-factor authentication is on.");
      setEnrollment(null);
      setEnabled(true);
      setBackupCodes(res.backupCodes);
    } catch (err) {
      toast.error(
        twoFactorErrorMessage(err, "That code didn't work. Try the next one."),
      );
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(enrollment.totp_secret);
      toast.success("Set-up key copied.");
    } catch {
      /* the key is visible to copy by hand */
    }
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card">
      <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">
              Two-factor authentication
            </h2>
            <p className="text-xs text-muted-foreground">
              Ask for a code from an authenticator app when you sign in.
            </p>
          </div>
        </div>
        {!loading && !loadError && enabled !== null && (
          <span
            className={
              enabled
                ? "inline-flex w-fit rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                : "inline-flex w-fit rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
            }
          >
            {enabled ? "On" : "Off"}
          </span>
        )}
      </div>

      <div className="px-6 py-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-brand" /> Checking…
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-start gap-3 text-sm">
            <p className="text-muted-foreground">{loadError}</p>
            <Button variant="outline" size="sm" onClick={load}>
              Try again
            </Button>
          </div>
        ) : backupCodes ? (
          <BackupCodes
            codes={backupCodes}
            onDone={() => setBackupCodes(null)}
          />
        ) : enrollment ? (
          <form onSubmit={confirm} className="space-y-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                Scan this QR code with an authenticator app (Google
                Authenticator, Microsoft Authenticator, Authy…).
              </li>
              <li>Enter the 6-digit code it shows.</li>
            </ol>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {qrCodeSrc(enrollment.qr_code) && (
                <img
                  src={qrCodeSrc(enrollment.qr_code)}
                  alt="Two-factor set-up QR code"
                  className="h-44 w-44 rounded-lg border border-border/70 bg-white p-2"
                />
              )}
              {enrollment.totp_secret && (
                <div className="min-w-0 text-sm">
                  <p className="text-muted-foreground">
                    Can&apos;t scan it? Enter this key instead:
                  </p>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="mt-1 inline-flex max-w-full items-center gap-1.5 break-all rounded-md bg-muted px-2 py-1 text-left font-mono text-xs"
                    title="Copy"
                  >
                    {enrollment.totp_secret}
                    <Copy className="h-3.5 w-3.5 shrink-0" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(digitsOnly(e.target.value))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className="w-36 text-center tracking-[0.3em]"
                required
              />
              <Button
                type="submit"
                disabled={busy || code.length !== 6}
                className="bg-brand-gradient text-brand-foreground hover:opacity-90"
              >
                {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Turn on
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEnrollment(null)}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : enabled ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setConfirmMode("rotate")}>
              <KeyRound className="mr-1.5 h-4 w-4" /> New backup codes
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmMode("disable")}
            >
              <ShieldOff className="mr-1.5 h-4 w-4" /> Turn off
            </Button>
          </div>
        ) : (
          <Button
            onClick={start}
            disabled={busy}
            className="bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Set up two-factor authentication
          </Button>
        )}
      </div>

      <ConfirmIdentityDialog
        mode={confirmMode}
        onClose={() => setConfirmMode(null)}
        onDone={(res) => {
          setConfirmMode(null);
          if (res.enabled === false) setEnabled(false);
          if (res.backupCodes) setBackupCodes(res.backupCodes);
        }}
      />
    </div>
  );
}
