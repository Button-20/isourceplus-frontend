// Payment receipt (GRA VAT receipt) lookup for the public verify page + the
// signed-in "Receipts" list.
import http from "@/services/lib/http";

// GET payment-receipts/<receipt_number>/ — the receipt, including its GRA QR
// image (`qr_code`, an ImageField → URL) and `verification_url` link.
export async function getPaymentReceipt(receiptNumber) {
  const { data } = await http.get(
    `payment-receipts/${encodeURIComponent(receiptNumber)}/`,
  );
  return data;
}

// GET payment-receipts/ — the signed-in organisation's receipts (newest first).
export async function listReceipts() {
  const { data } = await http.get("payment-receipts/");
  return Array.isArray(data) ? data : data?.results || [];
}

