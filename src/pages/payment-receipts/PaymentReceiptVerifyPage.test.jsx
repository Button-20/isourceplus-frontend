import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import PaymentReceiptVerifyPage from "./PaymentReceiptVerifyPage";

const getPaymentReceipt = vi.fn();
vi.mock("@/services/api/payment-receipts.service", () => ({
  getPaymentReceipt: (...args) => getPaymentReceipt(...args),
}));
vi.mock("@/services/lib/env", () => ({
  resolveMediaUrl: vi.fn((value) => (value ? `http://cdn.test/${value}` : "")),
}));
vi.mock("react-router-dom", () => ({
  useParams: () => ({ receiptNumber: "RCT-123" }),
}));

const RECEIPT = {
  receipt_number: "RCT-123",
  issued_by_name: "Supplier Co",
  issued_by_tin: "C0001234567",
  received_from: "Buyer Co",
  received_by: "Buyer Co",
  being_payment_for: "PO PO-001",
  payment_method: "MoMo",
  issued_at: "2026-11-22T10:00:00Z",
  gra_invoice_number: "GRA-999",
  subtotal: "100.00",
  vat_amount: "15.00",
  nhil_amount: "2.50",
  getfund_amount: "2.50",
  total_amount: "120.00",
  amount_paid: "120.00",
  amount_in_words: "One Hundred Twenty Ghana Cedis Only",
  qr_code: "/media/payment_receipt_qr/qr.png",
  verification_url: "https://gra.example/verify/ABC",
  line_items: [
    {
      name: "Laptop",
      description: "Dell",
      quantity: "1",
      unit_price: "120.00",
      line_total: "120.00",
    },
  ],
};

describe("PaymentReceiptVerifyPage", () => {
  beforeEach(() => {
    getPaymentReceipt.mockReset();
  });

  it("renders the receipt and QR image", async () => {
    getPaymentReceipt.mockResolvedValue(RECEIPT);
    render(<PaymentReceiptVerifyPage />);

    expect(await screen.findByText("Payment receipt")).toBeInTheDocument();
    expect(screen.getByText("RCT-123")).toBeInTheDocument();
    expect(screen.getByAltText("GRA verification QR code")).toHaveAttribute(
      "src",
      "http://cdn.test//media/payment_receipt_qr/qr.png",
    );
    expect(
      screen.getByRole("link", { name: /verify with gra/i }),
    ).toHaveAttribute("href", "https://gra.example/verify/ABC");
  });

  it("shows a not-found message when the receipt is missing", async () => {
    getPaymentReceipt.mockRejectedValue(new Error("404"));
    render(<PaymentReceiptVerifyPage />);

    expect(await screen.findByText("Not found")).toBeInTheDocument();
  });
});
