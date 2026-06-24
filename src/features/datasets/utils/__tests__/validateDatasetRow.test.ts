import { describe, expect, it } from "vitest";

import { validateDatasetRow } from "../validateDatasetRow";

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
});
