import { describe, it, expect, vi, beforeEach } from "vitest";

import http from "@/services/lib/http";
import { evaluateRfx, evaluateTender } from "./evaluation.service";

vi.mock("@/services/lib/http", () => ({
  default: { get: vi.fn() },
}));

describe("evaluation.service", () => {
  beforeEach(() => {
    http.get.mockReset();
  });

  it("evaluateRfx hits the rfx endpoint and returns an array", async () => {
    http.get.mockResolvedValue({ data: [{ id: "a", rank: 1 }] });

    const out = await evaluateRfx("RFX-2026-001");

    expect(out).toEqual([{ id: "a", rank: 1 }]);
    expect(http.get).toHaveBeenCalledWith("rfxs/RFX-2026-001/evaluate/");
  });

  it("evaluateRfx unwraps a paginated { results } payload", async () => {
    http.get.mockResolvedValue({ data: { results: [{ id: "b", rank: 2 }] } });

    const out = await evaluateRfx("RFX-2026-002");

    expect(out).toEqual([{ id: "b", rank: 2 }]);
  });

  it("evaluateTender hits the tender endpoint", async () => {
    http.get.mockResolvedValue({ data: [] });

    const out = await evaluateTender("TND-2026-001");

    expect(out).toEqual([]);
    expect(http.get).toHaveBeenCalledWith("tenders/TND-2026-001/evaluate/");
  });
});
