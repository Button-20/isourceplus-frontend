import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ReceiptText, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listReceipts, getPaymentReceipt } from "@/services/api/payment-receipts.service";
import { formatMoney } from "@/utils/money";
import { apiErrorMessage } from "@/services/lib/api-error";

const SECTIONS = [
  { value: "ESCROW", label: "Escrow payment" },
  { value: "MANUAL", label: "Manual payment" },
  { value: "SMS", label: "SMS unit purchase" },
  { value: "SUBSCRIPTION", label: "Subscriptions" },
];

function ReceiptTable({ items, onView }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border/70 bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Receipt</th>
            <th className="px-4 py-2.5 font-medium">Payment for</th>
            <th className="px-4 py-2.5 font-medium">Amount</th>
            <th className="px-4 py-2.5 font-medium">Method</th>
            <th className="px-4 py-2.5 font-medium">Date</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {items.map((r) => (
            <tr key={r.receipt_number} className="hover:bg-muted/30">
              <td className="px-4 py-2.5 font-medium">{r.receipt_number}</td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {r.being_payment_for || "—"}
              </td>
              <td className="px-4 py-2.5">{formatMoney(r.total_amount)}</td>
              <td className="px-4 py-2.5">{r.payment_method || "—"}</td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {r.issued_at ? new Date(r.issued_at).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-2.5 text-right">
                <Button variant="ghost" size="sm" onClick={() => onView(r)}>
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ReceiptsPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await listReceipts();
      setReceipts(rows);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to load receipts."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (receipt) => {
    setSelected(receipt);
    setDetailLoading(true);
    try {
      const full = await getPaymentReceipt(receipt.receipt_number);
      setSelected(full);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to load receipt detail."));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-montserrat">
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <span className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          <ReceiptText className="h-3.5 w-3.5" /> Payments
        </span>
        <h1 className="relative mt-4 font-display text-2xl font-bold sm:text-3xl">
          Receipts
        </h1>
        <p className="relative mt-2 text-sm text-white/85">
          Receipts for your escrow payments, SMS purchases and subscriptions.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : receipts.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
            <FileText className="h-7 w-7 text-brand" />
          </div>
          <h3 className="font-display text-lg font-semibold">No receipts yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Receipts will appear here once you make payments.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map((section) => {
            const items = receipts.filter((r) => r.receipt_type === section.value);
            return (
              <div key={section.value} className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                <div className="border-b border-border/60 bg-muted/30 px-5 py-3">
                  <h2 className="font-display text-sm font-semibold">
                    {section.label}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {items.length}
                    </span>
                  </h2>
                </div>
                {items.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-muted-foreground">No receipts</p>
                ) : (
                  <ReceiptTable items={items} onView={openDetail} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="font-montserrat sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Receipt {selected?.receipt_number}</DialogTitle>
            <DialogDescription>{selected?.being_payment_for || "Payment receipt"}</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Received from</span><span>{selected?.received_from || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Issued by</span><span>{selected?.issued_by_name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>{formatMoney(selected?.total_amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount paid</span><span>{formatMoney(selected?.amount_paid)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment method</span><span>{selected?.payment_method || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span>{selected?.payment_ref || "—"}</span></div>
              {selected?.amount_in_words && (
                <div className="rounded-lg bg-muted/40 p-3 text-muted-foreground">
                  {selected.amount_in_words}
                </div>
              )}
              {Array.isArray(selected?.charges) && selected.charges.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <div className="border-b border-border/60 bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                    Charges
                  </div>
                  <ul className="divide-y divide-border/60">
                    {selected.charges.map((c, i) => (
                      <li key={i} className="flex justify-between px-3 py-2 text-xs">
                        <span className="text-muted-foreground">{c.label || "Charge"}</span>
                        <span>{formatMoney(c.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selected?.line_items?.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 text-left text-muted-foreground">
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {selected.line_items.map((li, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{li.name || li.description || "—"}</td>
                          <td className="px-3 py-2">{li.quantity || "—"}</td>
                          <td className="px-3 py-2">{formatMoney(li.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {selected?.qr_code && (
                <div className="flex justify-center">
                  <img src={selected.qr_code} alt="Receipt QR" className="h-32 w-32" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceiptsPage;
