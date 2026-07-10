import { describe, expect, it } from "vitest";

import {
  rowHasSuggestionIssue,
  validateDatasetRow,
} from "../validateDatasetRow";
import { AISuggestion } from "@/types/dataset";

const standardizeCountrySuggestion: AISuggestion = {
  id: "standardize-country-value",
  type: "validation",
  title: "Standardize country value",
  description: "Normalize country aliases.",
  confidence: 94,
  affectedRows: [1],
  severity: "low",
  status: "pending",
  action: "standardize_value",
  targetField: "country",
  suggestedValue: "United States",
};

const reviewCountrySuggestion: AISuggestion = {
  id: "review-country-value",
  type: "validation",
  title: "Review country value",
  description: "Review unsupported country values.",
  confidence: 86,
  affectedRows: [1],
  severity: "low",
  status: "pending",
  action: "flag_invalid",
  targetField: "country",
  suggestedValue: null,
};

describe("validateDatasetRow", () => {
  it("detects account status normalization issues", () => {
    const result = validateDatasetRow({
      account_status: "active",
    });

    expect(result).toMatchObject({
      validationState: "invalid",
      validationField: "account_status",
      issues: [
        {
          kind: "standardize_account_status",
          action: "standardize_value",
          suggestedValue: "Active",
        },
      ],
    });
  });

  it("does not treat arbitrary country text as valid", () => {
    const result = validateDatasetRow({
      country: "Narnia",
    });

    expect(result).toMatchObject({
      validationState: "invalid",
      validationField: "country",
      issues: [
        {
          kind: "invalid_country",
          action: "flag_invalid",
        },
      ],
    });
  });

  it("detects invalid dates during row revalidation", () => {
    const result = validateDatasetRow({
      signup_date: "still not a date",
    });

    expect(result).toMatchObject({
      validationState: "invalid",
      validationField: "signup_date",
      issues: [
        {
          kind: "invalid_date",
          action: "flag_invalid",
        },
      ],
    });
  });

  it("matches country alias standardization without matching unrelated country issues", () => {
    expect(
      rowHasSuggestionIssue(
        { country: "US" },
        standardizeCountrySuggestion
      )
    ).toBe(true);
    expect(
      rowHasSuggestionIssue(
        { country: "U.S.A." },
        standardizeCountrySuggestion
      )
    ).toBe(true);
    expect(
      rowHasSuggestionIssue(
        { country: "" },
        standardizeCountrySuggestion
      )
    ).toBe(false);
    expect(
      rowHasSuggestionIssue(
        { country: "UnitedState" },
        standardizeCountrySuggestion
      )
    ).toBe(false);
    expect(
      rowHasSuggestionIssue(
        { country: "Canada" },
        standardizeCountrySuggestion
      )
    ).toBe(false);
  });

  it("matches unsupported country review without matching country aliases", () => {
    expect(
      rowHasSuggestionIssue({ country: "UnitedState" }, reviewCountrySuggestion)
    ).toBe(true);
    expect(
      rowHasSuggestionIssue({ country: "US" }, reviewCountrySuggestion)
    ).toBe(false);
  });
});
