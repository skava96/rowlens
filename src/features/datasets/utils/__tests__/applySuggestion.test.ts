import { describe, expect, it } from "vitest";

import { applySuggestionToRows } from "../applySuggestion";
import { AISuggestion, DatasetRow } from "@/types/dataset";

function createRows(): DatasetRow[] {
  return [
    {
      id: 1,
      values: {
        name: "Steffi",
        email: "bad-email",
        country: "usa",
      },
      validationState: "invalid",
      validationField: "email",
    },
    {
      id: 2,
      values: {
        name: "Maria",
        email: "maria@example.com",
        country: "india",
      },
      validationState: "valid",
    },
  ];
}

function createStandardizeCountrySuggestion(id: string): AISuggestion {
  return {
    id,
    title: "Standardize country",
    description: "Normalize country values.",
    type: "duplicate",
    severity: "medium",
    confidence: 92,
    affectedRows: [1],
    targetField: "country",
    suggestedValue: "United States",
    action: "standardize_value",
    status: "pending",
  };
}

describe("applySuggestionToRows", () => {
  it("applies standardize_value suggestions only to affected rows", () => {
    const result = applySuggestionToRows({
      rows: createRows(),
      suggestion: createStandardizeCountrySuggestion("suggestion-1"),
    });

    expect(result.rows[0].values.country).toBe("United States");
    expect(result.rows[1].values.country).toBe("india");

    expect(result.changes).toEqual([
      {
        rowId: 1,
        field: "country",
        beforeValue: "usa",
        afterValue: "United States",
      },
    ]);
  });

  it("tracks transformed fields without mutating unaffected rows", () => {
    const result = applySuggestionToRows({
      rows: createRows(),
      suggestion: createStandardizeCountrySuggestion("suggestion-2"),
    });

    expect(result.rows[0].transformedFields).toContain("country");
    expect(result.rows[1].transformedFields).toBeUndefined();
  });

  it("marks invalid rows as reviewed without changing their invalid value", () => {
    const suggestion: AISuggestion = {
      id: "suggestion-3",
      title: "Flag invalid email",
      description: "Review invalid email format.",
      type: "validation",
      severity: "high",
      confidence: 95,
      affectedRows: [1],
      targetField: "email",
      action: "flag_invalid",
      status: "pending",
    };

    const result = applySuggestionToRows({
      rows: createRows(),
      suggestion,
    });

    expect(result.rows[0].values.email).toBe("bad-email");
    expect(result.rows[0].validationState).toBe("invalid");
    expect(result.rows[0].validationField).toBe("email");
    expect(result.rows[0].reviewState).toBe("reviewed");
    expect(result.rows[0].transformedFields).toBeUndefined();
    expect(result.changes).toEqual([]);
  });
});
