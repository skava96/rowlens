import { describe, expect, it } from "vitest";

import { analyzeDataset } from "../analyzeDataset";
import { DatasetRow } from "@/types/dataset";

function createRow(
  id: number,
  values: DatasetRow["values"]
): DatasetRow {
  return {
    id,
    values,
    validationState: "valid",
  };
}

describe("analyzeDataset", () => {
  it("creates grouped suggestions for every deterministic issue on a row", () => {
    const result = analyzeDataset([
      createRow(1, {
        email: "bad-email",
        country: "",
        account_status: "active",
      }),
      createRow(2, {
        email: "second-bad-email",
        country: "   ",
        account_status: "ACTIVE",
      }),
    ]);

    expect(result.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "validation",
          title: "Invalid email format",
          action: "flag_invalid",
          severity: "high",
          affectedRows: [1, 2],
          targetField: "email",
        }),
        expect.objectContaining({
          type: "missing",
          title: "Missing values in country",
          action: "flag_invalid",
          severity: "medium",
          affectedRows: [1, 2],
          targetField: "country",
          suggestedValue: undefined,
        }),
        expect.objectContaining({
          type: "validation",
          title: "Standardize account status",
          action: "standardize_value",
          severity: "low",
          affectedRows: [1, 2],
          targetField: "account_status",
          suggestedValue: "Active",
        }),
      ])
    );
  });

  it("groups country standardization by safe uniform suggested value", () => {
    const result = analyzeDataset([
      createRow(1, { country: "USA" }),
      createRow(2, { country: "us" }),
      createRow(3, { country: "UK" }),
    ]);

    expect(result.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Standardize country value",
          action: "standardize_value",
          affectedRows: [1, 2],
          suggestedValue: "United States",
        }),
        expect.objectContaining({
          title: "Standardize country value",
          action: "standardize_value",
          affectedRows: [3],
          suggestedValue: "United Kingdom",
        }),
      ])
    );
  });
});
