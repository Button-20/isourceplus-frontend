// Payment receipt (GRA VAT receipt) lookup for the public verify page.
import http from "@/services/lib/http";

// GET payment-receipts/<receipt_number>/ — the receipt, including its GRA QR
// image (`qr_code`, an ImageField → URL) and `verification_url` link.
export async function getPaymentReceipt(receiptNumber) {
  const { data } = await http.get(
    `payment-receipts/${encodeURIComponent(receiptNumber)}/`,
  );
  return data;
}
