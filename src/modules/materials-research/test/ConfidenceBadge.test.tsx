import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfidenceBadge, confidenceLevel } from "../components/common/ConfidenceBadge";

describe("ConfidenceBadge", () => {
  it("renders high confidence label", () => {
    render(<ConfidenceBadge score={95} />);
    expect(screen.getByText(/高/)).toBeInTheDocument();
  });

  it("confidenceLevel returns correct tiers", () => {
    expect(confidenceLevel(95).label).toBe("高");
    expect(confidenceLevel(75).label).toBe("中");
    expect(confidenceLevel(55).label).toBe("低");
    expect(confidenceLevel(40).label).toBe("不足");
  });
});
