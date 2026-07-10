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
    expect(result.rows[0].correctedFields).toContain("country");
    expect(result.rows[0].manualEditedFields).toBeUndefined();
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

  it("does not apply missing-value suggestions without an explicit safe value", () => {
    const rows: DatasetRow[] = [
      {
        id: 1,
        values: {
          country: "",
        },
        validationState: "missing",
        validationField: "country",
      },
    ];

    const result = applySuggestionToRows({
      rows,
      suggestion: {
        id: "missing-country",
        title: "Missing values in country",
        description: "Review missing country values.",
        type: "missing",
        severity: "medium",
        confidence: 96,
        affectedRows: [1],
        targetField: "country",
        action: "fill_missing",
        status: "pending",
      },
    });

    expect(result.rows[0].values.country).toBe("");
    expect(result.changes).toEqual([]);
  });

  it("does not overwrite rows already fixed before a suggestion is applied", () => {
    const rows: DatasetRow[] = [
      {
        id: 1,
        values: {
          country: "United States",
        },
        validationState: "valid",
      },
    ];

    const result = applySuggestionToRows({
      rows,
      suggestion: createStandardizeCountrySuggestion("suggestion-4"),
    });

    expect(result.rows[0].values.country).toBe("United States");
    expect(result.rows[0].transformedFields).toBeUndefined();
    expect(result.changes).toEqual([]);
  });

  it("applies a suggestion to a manually edited value that still has the matching issue", () => {
    const rows: DatasetRow[] = [
      {
        id: 1,
        values: {
          country: "US",
        },
        validationState: "invalid",
        validationField: "country",
        manualEditedFields: ["country"],
        transformedFields: ["country"],
      },
    ];

    const result = applySuggestionToRows({
      rows,
      suggestion: createStandardizeCountrySuggestion("suggestion-5"),
    });

    expect(result.rows[0]).toMatchObject({
      values: { country: "United States" },
      validationState: "valid",
      validationField: undefined,
      correctedFields: ["country"],
      manualEditedFields: [],
    });
    expect(result.changes).toEqual([
      {
        rowId: 1,
        field: "country",
        beforeValue: "US",
        afterValue: "United States",
      },
    ]);
  });

  it("skips a manually edited valid value that no longer has the suggestion issue", () => {
    const rows: DatasetRow[] = [
      {
        id: 1,
        values: {
          country: "United States",
        },
        validationState: "valid",
        manualEditedFields: ["country"],
        transformedFields: ["country"],
      },
    ];

    const result = applySuggestionToRows({
      rows,
      suggestion: createStandardizeCountrySuggestion("suggestion-6"),
    });

    expect(result.rows[0].values.country).toBe("United States");
    expect(result.rows[0].manualEditedFields).toEqual(["country"]);
    expect(result.rows[0].correctedFields).toBeUndefined();
    expect(result.changes).toEqual([]);
  });

  it("skips an intentional valid different manual value", () => {
    const rows: DatasetRow[] = [
      {
        id: 1,
        values: {
          country: "Canada",
        },
        validationState: "valid",
        manualEditedFields: ["country"],
        transformedFields: ["country"],
      },
    ];

    const result = applySuggestionToRows({
      rows,
      suggestion: createStandardizeCountrySuggestion("suggestion-7"),
    });

    expect(result.rows[0].values.country).toBe("Canada");
    expect(result.rows[0].manualEditedFields).toEqual(["country"]);
    expect(result.rows[0].correctedFields).toBeUndefined();
    expect(result.changes).toEqual([]);
  });

  it("does not let AI suggested values overwrite valid manual corrections", () => {
    const rows: DatasetRow[] = [
      {
        id: 1,
        values: {
          country: "Canada",
        },
        validationState: "valid",
        manualEditedFields: ["country"],
      },
    ];

    const result = applySuggestionToRows({
      rows,
      suggestion: {
        ...createStandardizeCountrySuggestion("suggestion-8"),
        source: "ai-finding",
      },
    });

    expect(result.rows[0].values.country).toBe("Canada");
    expect(result.changes).toEqual([]);
  });
});
