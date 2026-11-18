import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import ItemThumbnail from "./ItemThumbnail";

vi.mock("@/services/lib/env", () => ({
  resolveMediaUrl: vi.fn((value) => (value ? `http://cdn.test/${value}` : "")),
}));

describe("ItemThumbnail", () => {
  it("renders an image when one is provided", () => {
    render(<ItemThumbnail image="/media/item.png" name="Laptop" />);

    const img = screen.getByAltText("Laptop");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "http://cdn.test//media/item.png");
  });

  it("renders a silhouette placeholder when there is no image", () => {
    const { container } = render(<ItemThumbnail image={null} name="Laptop" />);

    expect(screen.queryByAltText("Laptop")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
