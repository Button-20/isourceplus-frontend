import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Wallet, ArrowDownToLine, ArrowUpToLine, Send, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getWallet,
  fundWallet,
  payoutClient,
  withdrawWallet,
  listWalletTransactions,
} from "@/services/api/wallet.service";
import { formatMoney } from "@/utils/money";
import { apiErrorMessage } from "@/services/lib/api-error";

const NETWORKS = ["MTN", "VOD", "AIR", "MAS", "VIS", "BNK"];
const labelClass = "mb-1 block text-sm font-medium text-foreground";

const VirtualWalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fundOpen, setFundOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fundForm, setFundForm] = useState({ amount: "", customer_number: "", network: "MTN" });
  const [payoutForm, setPayoutForm] = useState({ amount: "", client_number: "", network: "MTN" });
  const [withdrawForm, setWithdrawForm] = useState({ amount: "" });

  const loadTransactions = useCallback(async () => {
    try {
      const rows = await listWalletTransactions();
      setTransactions(rows);
    } catch {
      setTransactions([]);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await getWallet();
      setWallet(data);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to load wallet."));
    } finally {
      setLoading(false);
    }
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFund = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fundWallet({
        amount: fundForm.amount,
        customer_number: fundForm.customer_number,
        network: fundForm.network,
      });
      toast.success("Redirecting to complete wallet funding…");
      if (res?.redirect_url) {
        window.location.href = res.redirect_url;
      } else {
        setFundOpen(false);
        load();
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to start wallet funding."));
    } finally {
      setSaving(false);
    }
  };

  const handlePayout = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await payoutClient({
        amount: payoutForm.amount,
        client_number: payoutForm.client_number,
        network: payoutForm.network,
      });
      toast.success("Payout initiated to client.");
      setPayoutOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to start payout."));
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await withdrawWallet({ amount: withdrawForm.amount });
      toast.success("Withdrawal initiated to your payout method.");
      setWithdrawOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to start withdrawal."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const currency = wallet?.currency || "GHS";

  return (
    <div className="mx-auto max-w-4xl space-y-6 font-montserrat">
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <span className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          <Wallet className="h-3.5 w-3.5" /> Account
        </span>
        <h1 className="relative mt-4 font-display text-2xl font-bold sm:text-3xl">
          Virtual wallet
        </h1>
        <p className="relative mt-2 text-sm text-white/85">
          Fund your wallet and pay clients outside the sourcing flow.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <p className="text-xs text-muted-foreground">Available balance</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {formatMoney(wallet?.balance, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <p className="text-xs text-muted-foreground">Held in escrow</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {formatMoney(wallet?.held_amount, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <p className="text-xs text-muted-foreground">Currency</p>
          <p className="mt-1 font-display text-2xl font-bold">{currency}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          className="bg-brand-gradient text-brand-foreground hover:opacity-90"
          onClick={() => setFundOpen(true)}
        >
          <ArrowDownToLine className="mr-1.5 h-4 w-4" /> Fund wallet
        </Button>
        <Button variant="outline" onClick={() => setPayoutOpen(true)}>
          <Send className="mr-1.5 h-4 w-4" /> Pay client
        </Button>
        <Button variant="outline" onClick={() => setWithdrawOpen(true)}>
          <ArrowUpToLine className="mr-1.5 h-4 w-4" /> Withdraw
        </Button>
        <Button variant="ghost" size="icon" onClick={load} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Transactions */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="border-b border-border/60 px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Transactions</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            No transactions yet
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {transactions.map((t) => (
              <li
                key={t.id || t.exttrid}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {t.purpose_display || t.purpose || "Transaction"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.reference || t.exttrid} · {t.status}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={
                      t.direction === "CTM"
                        ? "text-sm font-semibold text-emerald-600"
                        : "text-sm font-semibold text-rose-600"
                    }
                  >
                    {t.direction === "CTM" ? "+" : "−"}
                    {formatMoney(t.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.created_at
                      ? new Date(t.created_at).toLocaleDateString()
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Fund wallet */}
      <Dialog open={fundOpen} onOpenChange={(o) => !saving && setFundOpen(o)}>
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fund wallet</DialogTitle>
            <DialogDescription>
              Pay into your wallet via Orchard hosted checkout.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFund} className="space-y-4">
            <div>
              <label className={labelClass}>Amount</label>
              <Input
                inputMode="decimal"
                value={fundForm.amount}
                onChange={(e) => setFundForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>Payer number</label>
              <Input
                value={fundForm.customer_number}
                onChange={(e) => setFundForm((f) => ({ ...f, customer_number: e.target.value }))}
                placeholder="0241234567"
              />
            </div>
            <div>
              <label className={labelClass}>Network</label>
              <Select value={fundForm.network} onValueChange={(v) => setFundForm((f) => ({ ...f, network: v }))}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFundOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !fundForm.amount || !fundForm.customer_number}
                className="bg-brand-gradient text-brand-foreground hover:opacity-90">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Funding…</> : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pay client */}
      <Dialog open={payoutOpen} onOpenChange={(o) => !saving && setPayoutOpen(o)}>
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay client</DialogTitle>
            <DialogDescription>
              Send money from your wallet to an external client.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePayout} className="space-y-4">
            <div>
              <label className={labelClass}>Amount</label>
              <Input
                inputMode="decimal"
                value={payoutForm.amount}
                onChange={(e) => setPayoutForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>Client number</label>
              <Input
                value={payoutForm.client_number}
                onChange={(e) => setPayoutForm((f) => ({ ...f, client_number: e.target.value }))}
                placeholder="0241234567"
              />
            </div>
            <div>
              <label className={labelClass}>Network</label>
              <Select value={payoutForm.network} onValueChange={(v) => setPayoutForm((f) => ({ ...f, network: v }))}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setPayoutOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !payoutForm.amount || !payoutForm.client_number}
                className="bg-brand-gradient text-brand-foreground hover:opacity-90">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Paying…</> : "Pay client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Withdraw */}
      <Dialog open={withdrawOpen} onOpenChange={(o) => !saving && setWithdrawOpen(o)}>
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw</DialogTitle>
            <DialogDescription>
              Withdraw funds to your configured payout method (MoMo or Bank).
              The payout charge is applied on the withdrawal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className={labelClass}>Amount</label>
              <Input
                inputMode="decimal"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setWithdrawOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !withdrawForm.amount}
                className="bg-brand-gradient text-brand-foreground hover:opacity-90">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Withdrawing…</> : "Withdraw"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VirtualWalletPage;
