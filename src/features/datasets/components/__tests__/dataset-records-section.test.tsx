import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DatasetRecordsSection from "../dataset-records-section";
import { DatasetRow } from "@/types/dataset";

vi.mock("@/components/dataset/dataset-table", () => ({
  DatasetTable: () => <div data-testid="dataset-table" />,
}));

const baseProps = {
  columns: [{ key: "email", label: "Email" }],
  visibleColumnKeys: ["email"],
  highlightedRowIds: [4],
  activeVisibleColumnCount: 1,
  schemaKey: "email",
  recordsViewIntent: {
    mode: "affected" as const,
    key: "review-suggestion-1",
    suggestionId: "suggestion-1",
  },
  pinnedColumnKeys: [],
  onUpdateCell: vi.fn(),
  onExportRows: vi.fn(),
  onBulkMarkValid: vi.fn(),
  onRecordsViewChange: vi.fn(),
  activeSuggestionTitle: "Invalid email format",
  activeSuggestionTargetField: "email",
};

function createRow(overrides: Partial<DatasetRow>): DatasetRow {
  return {
    id: 4,
    values: { email: "nina.patel@acme" },
    validationState: "invalid",
    validationField: "email",
    ...overrides,
  };
}

describe("DatasetRecordsSection", () => {
  it("does not show resolved wording for a pending affected row after undo", () => {
    render(
      <DatasetRecordsSection
        {...baseProps}
        rows={[createRow({})]}
        activeSuggestionStatus="pending"
        activeSuggestionResolvedRowIds={[]}
      />
    );

    expect(
      screen.getByText("These rows need attention before continuing.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("These rows were resolved by manual edits.")
    ).not.toBeInTheDocument();
  });

  it("shows resolved wording only when affected rows are currently valid", () => {
    render(
      <DatasetRecordsSection
        {...baseProps}
        rows={[
          createRow({
            values: { email: "nina.patel@acme.com" },
            validationState: "valid",
            validationField: undefined,
          }),
        ]}
        activeSuggestionStatus="resolved"
        activeSuggestionResolvedRowIds={[4]}
      />
    );

    expect(
      screen.getByText("These rows were resolved by manual edits.")
    ).toBeInTheDocument();
  });
});
