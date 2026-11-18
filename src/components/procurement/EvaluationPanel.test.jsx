import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import EvaluationPanel from "./EvaluationPanel";
import { evaluateRfx } from "@/services/api/evaluation.service";

vi.mock("@/services/api/evaluation.service", () => ({
  evaluateRfx: vi.fn(),
  evaluateTender: vi.fn(),
}));

describe("EvaluationPanel", () => {
  beforeEach(() => {
    evaluateRfx.mockReset();
  });

  it("renders ranked results after the user clicks Evaluate", async () => {
    evaluateRfx.mockResolvedValue([
      {
        id: "r1",
        supplier: "Supplier A",
        price: "1000.00",
        total_score: "95.00",
        compliant: true,
        rank: 1,
      },
      {
        id: "r2",
        supplier: "Supplier B",
        price: "1200.00",
        total_score: "91.67",
        compliant: false,
        rank: 2,
      },
    ]);

    render(<EvaluationPanel kind="rfx" refNum="RFX-1" />);

    fireEvent.click(screen.getByRole("button", { name: /evaluate/i }));

    expect(await screen.findByText("Supplier A")).toBeInTheDocument();
    expect(screen.getByText("Supplier B")).toBeInTheDocument();
    expect(screen.getByText("Compliant")).toBeInTheDocument();
    expect(screen.getByText("Non-compliant")).toBeInTheDocument();
    expect(evaluateRfx).toHaveBeenCalledWith("RFX-1");
  });
});
