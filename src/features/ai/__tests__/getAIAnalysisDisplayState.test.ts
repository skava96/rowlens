import { describe, expect, it } from "vitest";

import { getAIAnalysisDisplayState } from "../getAIAnalysisDisplayState";
import { AIAnalysisState } from "../types";

function createState(
  overrides: Partial<AIAnalysisState> = {}
): AIAnalysisState {
  return {
    status: "idle",
    rowsAnalyzed: 0,
    totalRows: 30,
    analysisTargetRows: 30,
    findings: [],
    ...overrides,
  };
}

describe("getAIAnalysisDisplayState", () => {
  it("does not show active progress for fallback states", () => {
    const display = getAIAnalysisDisplayState(
      createState({
        status: "failed",
        rowsAnalyzed: 0,
        findings: [],
        error: "Browser AI could not complete analysis.",
      })
    );

    expect(display.showFallbackCard).toBe(true);
    expect(display.isActiveProgress).toBe(false);
    expect(display.showCoverage).toBe(false);
  });

  it("labels fallback findings separately from AI findings", () => {
    expect(
      getAIAnalysisDisplayState(createState({ status: "unavailable" }))
        .findingsTitle
    ).toBe("Deterministic Findings");

    expect(
      getAIAnalysisDisplayState(createState({ status: "analyzing" }))
      .findingsTitle
    ).toBe("AI Observations");
  });

  it("does not keep spinner-style active progress for terminal states", () => {
    expect(
      getAIAnalysisDisplayState(createState({ status: "completed" }))
        .isActiveProgress
    ).toBe(false);
    expect(
      getAIAnalysisDisplayState(createState({ status: "failed" }))
        .isActiveProgress
    ).toBe(false);
    expect(
      getAIAnalysisDisplayState(createState({ status: "unavailable" }))
        .isActiveProgress
    ).toBe(false);
  });
});
