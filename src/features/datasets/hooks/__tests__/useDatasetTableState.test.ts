import { describe, expect, it } from "vitest";

import { getValidationLabel } from "@/components/dataset/dataset-table-utils";

describe("dataset table helpers", () => {
  it("returns correct validation labels", () => {
    expect(getValidationLabel("valid")).toBe("Valid");
    expect(getValidationLabel("missing")).toBe("Needs review");
    expect(getValidationLabel("invalid")).toBe("Invalid");
  });
});