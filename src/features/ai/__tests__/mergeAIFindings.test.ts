import { describe, expect, it } from "vitest";

import { mergeAIFindings } from "../mergeAIFindings";
import { AIFinding } from "../types";

function createFinding(overrides: Partial<AIFinding>): AIFinding {
  return {
    id: "finding-1",
    title: "Placeholder names detected",
    description: "Some names look like placeholders.",
    reasoning: "Rows use placeholder-like names.",
    confidence: 0.7,
    severity: "medium",
    targetField: "full_name",
    affectedRows: [1],
    suggestedAction: "flag_invalid",
    source: "browser-ai",
    status: "new",
    ...overrides,
  };
}

describe("mergeAIFindings", () => {
  it("combines duplicate findings without duplicating affected rows", () => {
    const merged = mergeAIFindings([
      createFinding({ affectedRows: [1, 2], confidence: 0.7 }),
      createFinding({
        id: "finding-2",
        affectedRows: [2, 3],
        severity: "high",
        confidence: 0.9,
        reasoning: "More rows show the same pattern.",
      }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      affectedRows: [1, 2, 3],
      severity: "high",
      confidence: 0.9,
    });
    expect(merged[0].reasoning).toContain("More rows");
  });
});
