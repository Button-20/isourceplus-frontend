import { describe, it, expect, vi, beforeEach } from "vitest";

import http from "@/services/lib/http";
import { PAYMENT_METHODS, fundPurchaseOrderEscrow } from "./escrow.service";

vi.mock("@/services/lib/http", () => ({
  default: { post: vi.fn() },
}));

describe("escrow.service", () => {
  beforeEach(() => {
    http.post.mockReset();
  });

  it("offers MoMo, Card and Wallet as funding methods", () => {
    expect(PAYMENT_METHODS).toEqual(["MoMo", "Card", "Wallet"]);
  });

  it("fundPurchaseOrderEscrow posts the chosen method and unwraps the envelope", async () => {
    http.post.mockResolvedValue({
      data: {
        success: true,
        message: "Escrow funded from wallet.",
        data: { funded_from_wallet: true, escrow: { escrow_id: "ESC-1" } },
      },
    });

    const out = await fundPurchaseOrderEscrow("PO-123", {
      payment_method: "Wallet",
    });

    expect(http.post).toHaveBeenCalledWith("purchase-orders/PO-123/fund-escrow/", {
      payment_method: "Wallet",
    });
    expect(out).toEqual({ funded_from_wallet: true, escrow: { escrow_id: "ESC-1" } });
  });

  it("fundPurchaseOrderEscrow includes the payment reference when provided", async () => {
    http.post.mockResolvedValue({ data: { redirect_url: "https://checkout" } });

    await fundPurchaseOrderEscrow("PO-1", {
      payment_method: "Card",
      payment_ref: "REF-9",
    });

    expect(http.post).toHaveBeenCalledWith("purchase-orders/PO-1/fund-escrow/", {
      payment_method: "Card",
      payment_ref: "REF-9",
    });
  });

  it("fundPurchaseOrderEscrow tolerates a bare (non-enveloped) response", async () => {
    http.post.mockResolvedValue({ data: { redirect_url: "https://checkout" } });

    const out = await fundPurchaseOrderEscrow("PO-2", { payment_method: "MoMo" });

    expect(out).toEqual({ redirect_url: "https://checkout" });
  });
});
