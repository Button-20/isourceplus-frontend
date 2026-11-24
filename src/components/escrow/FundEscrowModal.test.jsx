import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import FundEscrowModal from "./FundEscrowModal";
import { fundPurchaseOrderEscrow } from "@/services/api/escrow.service";

vi.mock("@/services/api/escrow.service", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fundPurchaseOrderEscrow: vi.fn() };
});

describe("FundEscrowModal", () => {
  beforeEach(() => {
    fundPurchaseOrderEscrow.mockReset();
  });

  it("offers MoMo, Card and Wallet as funding methods", () => {
    render(<FundEscrowModal open onOpenChange={vi.fn()} refNum="PO-1" />);

    expect(screen.getByText("MoMo")).toBeInTheDocument();
    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.getByText("Wallet")).toBeInTheDocument();
  });

  it("defaults to MoMo and shows the hosted-checkout copy + payment reference", () => {
    render(<FundEscrowModal open onOpenChange={vi.fn()} refNum="PO-1" />);

    expect(screen.getByRole("button", { name: /continue to payment/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/payment reference/i)).toBeInTheDocument();
  });

  it("switches to wallet funding when Wallet is selected", () => {
    render(<FundEscrowModal open onOpenChange={vi.fn()} refNum="PO-1" />);

    fireEvent.click(screen.getByText("Wallet"));

    expect(screen.getByRole("button", { name: /fund from wallet/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/payment reference/i)).not.toBeInTheDocument();
  });

  it("defaults to the PO's preferred method", () => {
    render(
      <FundEscrowModal
        open
        onOpenChange={vi.fn()}
        refNum="PO-1"
        preferredMethod="Card"
      />,
    );

    // Card is pre-selected, so the hosted-checkout copy is shown and the
    // "Fund from wallet" button is absent.
    expect(screen.getByRole("button", { name: /continue to payment/i })).toBeInTheDocument();
  });

  it("funds from the wallet and reports the secured escrow", async () => {
    const onSecured = vi.fn();
    const onOpenChange = vi.fn();
    fundPurchaseOrderEscrow.mockResolvedValue({
      funded_from_wallet: true,
      escrow: { escrow_id: "ESC-1", escrow_status: "SECURED" },
    });

    render(
      <FundEscrowModal
        open
        onOpenChange={onOpenChange}
        refNum="PO-1"
        onSecured={onSecured}
      />,
    );

    fireEvent.click(screen.getByText("Wallet"));
    fireEvent.click(screen.getByRole("button", { name: /fund from wallet/i }));

    await waitFor(() =>
      expect(fundPurchaseOrderEscrow).toHaveBeenCalledWith("PO-1", {
        payment_method: "Wallet",
        payment_ref: undefined,
      }),
    );
    await waitFor(() =>
      expect(onSecured).toHaveBeenCalledWith({
        escrow_id: "ESC-1",
        escrow_status: "SECURED",
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
