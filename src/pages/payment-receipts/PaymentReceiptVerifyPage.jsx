// Public payment-receipt verification page. Matches the backend's
// `verification_url` shape: /payment-receipts/verify/<receipt_number>.
// Fetches the receipt read-only and renders its details + GRA QR image.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Loader2, ReceiptText } from "lucide-react";

import { getPaymentReceipt } from "@/services/api/payment-receipts.service";
import { resolveMediaUrl } from "@/services/lib/env";
import { formatMoney } from "@/utils/money";
import { prettify } from "@/utils/choices";

const fmt = (value) => {
  if (!value) return "N/A";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString("en-GH");
};

export default function PaymentReceiptVerifyPage() {
  const { receiptNumber } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getPaymentReceipt(receiptNumber)
      .then((data) => {
        if (!cancelled) setReceipt(data);
      })
      .catch(() => {
        if (!cancelled)
          setError("Receipt not found. Check the reference and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [receiptNumber]);

  const qrSrc = resolveMediaUrl(receipt?.qr_code);

  const lineItems = Array.isArray(receipt?.line_items) ? receipt.line_items : [];

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 font-montserrat">
      <a
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back home
      </a>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="h-1.5 bg-header" />
        <div className="space-y-8 p-6 sm:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-brand">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="font-display text-lg font-semibold">Not found</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <ReceiptText className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="font-display text-2xl font-bold">
                      Payment receipt
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {receipt.receipt_number}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {qrSrc && (
                    <img
                      src={qrSrc}
                      alt="GRA verification QR code"
                      className="h-24 w-24 shrink-0 rounded-lg border border-border/70 object-contain p-1"
                    />
                  )}
                  {receipt.verification_url && (
                    <a
                      href={receipt.verification_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      Verify with GRA ↗
                    </a>
                  )}
                </div>
              </div>

              <section>
                <h2 className="mb-4 font-display text-base font-semibold">
                  Details
                </h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
                  <Row label="Issued by">{receipt.issued_by_name}</Row>
                  <Row label="TIN">{receipt.issued_by_tin || "N/A"}</Row>
                  <Row label="Received from">{receipt.received_from}</Row>
                  <Row label="Received by">{receipt.received_by}</Row>
                  <Row label="For">{receipt.being_payment_for}</Row>
                  <Row label="Method">
                    {prettify(receipt.payment_method || "") || "N/A"}
                  </Row>
                  <Row label="Issued">{fmt(receipt.issued_at)}</Row>
                  {receipt.gra_invoice_number && (
                    <Row label="GRA invoice">
                      {receipt.gra_invoice_number}
                    </Row>
                  )}
                </div>
              </section>

              <section className="border-t border-border/60 pt-6">
                <h2 className="mb-4 font-display text-base font-semibold">
                  Amount
                </h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
                  <Row label="Subtotal">
                    {formatMoney(receipt.subtotal, "GHS")}
                  </Row>
                  <Row label="VAT">
                    {formatMoney(receipt.vat_amount, "GHS")}
                  </Row>
                  <Row label="NHIL">
                    {formatMoney(receipt.nhil_amount, "GHS")}
                  </Row>
                  <Row label="GETFund">
                    {formatMoney(receipt.getfund_amount, "GHS")}
                  </Row>
                  <Row label="Total">
                    {formatMoney(receipt.total_amount, "GHS")}
                  </Row>
                  <Row label="Paid">
                    {formatMoney(receipt.amount_paid, "GHS")}
                  </Row>
                </div>
                {receipt.amount_in_words && (
                  <p className="mt-3 text-sm italic text-muted-foreground">
                    {receipt.amount_in_words}
                  </p>
                )}
              </section>

              {lineItems.length > 0 && (
                <section className="border-t border-border/60 pt-6">
                  <h2 className="mb-4 font-display text-base font-semibold">
                    Items
                  </h2>
                  <div className="overflow-x-auto rounded-xl border border-border/70">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/70 bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-4 py-2.5 font-medium">#</th>
                          <th className="px-4 py-2.5 font-medium">
                            Description
                          </th>
                          <th className="px-4 py-2.5 font-medium">Qty</th>
                          <th className="px-4 py-2.5 font-medium">Unit price</th>
                          <th className="px-4 py-2.5 font-medium">Line total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {lineItems.map((li, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2.5 text-muted-foreground">
                              {i + 1}
                            </td>
                            <td className="px-4 py-2.5">
                              {li.name || li.description || "N/A"}
                            </td>
                            <td className="px-4 py-2.5">{li.quantity}</td>
                            <td className="px-4 py-2.5">
                              {formatMoney(li.unit_price, "GHS")}
                            </td>
                            <td className="px-4 py-2.5">
                              {formatMoney(li.line_total, "GHS")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-36 shrink-0 font-medium text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 text-foreground">{children}</span>
    </div>
  );
}
