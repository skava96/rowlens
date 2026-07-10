import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DatasetTableGrid } from "../dataset-table-grid";
import { DatasetRow } from "@/types/dataset";

const baseProps = {
  visibleColumns: [
    { key: "email", label: "Email" },
    { key: "country", label: "Country" },
  ],
  highlightedRowIdSet: new Set<number>([4]),
  selectedRowIdSet: new Set<number>(),
  selectedRow: null,
  selectedRowIds: [],
  editingCell: null,
  draftValue: "",
  sortConfig: null,
  allVisibleRowsSelected: false,
  hasPartialVisibleSelection: false,
  pinnedColumnKeys: [],
  onToggleSort: vi.fn(),
  onToggleVisibleRowsSelection: vi.fn(),
  onToggleRowSelection: vi.fn(),
  onSelectRow: vi.fn(),
  onStartEditing: vi.fn(),
  onDraftValueChange: vi.fn(),
  onSaveEditing: vi.fn(),
  onCancelEditing: vi.fn(),
  onExportSelectedRows: vi.fn(),
  onBulkMarkSelectedRowsValid: vi.fn(),
  onClearSelection: vi.fn(),
  onResetFilters: vi.fn(),
  onClearSearch: vi.fn(),
};

function renderGrid(row: DatasetRow, highlightedField = "email") {
  render(
    <DatasetTableGrid
      {...baseProps}
      rows={[row]}
      highlightedField={highlightedField}
    />
  );
}

describe("DatasetTableGrid", () => {
  it("does not show Invalid value on a corrected target cell when another field is invalid", () => {
    renderGrid({
      id: 4,
      values: {
        email: "nina.patel@acme.com",
        country: "Narnia",
      },
      validationState: "invalid",
      validationField: "country",
      transformedFields: ["email"],
      manualEditedFields: ["email"],
    });

    const emailCell = screen
      .getByRole("button", { name: "Edit Email for row 4" })
      .closest("td");
    const countryCell = screen
      .getByRole("button", { name: "Edit Country for row 4" })
      .closest("td");

    expect(emailCell).not.toBeNull();
    expect(countryCell).not.toBeNull();
    expect(within(emailCell as HTMLElement).getByText("Edited"))
      .toBeInTheDocument();
    expect(within(emailCell as HTMLElement).queryByText("Corrected"))
      .not.toBeInTheDocument();
    expect(within(emailCell as HTMLElement).queryByText("Invalid value"))
      .not.toBeInTheDocument();
    expect(within(countryCell as HTMLElement).getByText("Invalid value"))
      .toBeInTheDocument();
  });

  it("restores the Invalid value badge and removes Corrected when an edit is undone", () => {
    renderGrid({
      id: 4,
      values: {
        email: "nina.patel@acme",
        country: "United States",
      },
      validationState: "invalid",
      validationField: "email",
      transformedFields: [],
    });

    const emailCell = screen
      .getByRole("button", { name: "Edit Email for row 4" })
      .closest("td");

    expect(emailCell).not.toBeNull();
    expect(within(emailCell as HTMLElement).getByText("Invalid value"))
      .toBeInTheDocument();
    expect(within(emailCell as HTMLElement).queryByText("Corrected"))
      .not.toBeInTheDocument();
  });

  it("shows Corrected for an applied fix value", () => {
    renderGrid(
      {
        id: 4,
        values: {
          email: "valid@example.com",
          country: "United States",
        },
        validationState: "valid",
        transformedFields: ["country"],
        correctedFields: ["country"],
      },
      "country"
    );

    const countryCell = screen
      .getByRole("button", { name: "Edit Country for row 4" })
      .closest("td");

    expect(countryCell).not.toBeNull();
    expect(within(countryCell as HTMLElement).getByText("Corrected"))
      .toBeInTheDocument();
    expect(within(countryCell as HTMLElement).queryByText("Edited"))
      .not.toBeInTheDocument();
  });

  it("shows issue badges for every invalid or missing cell in the row", () => {
    renderGrid({
      id: 4,
      values: {
        email: "nina.patel@acme",
        country: "",
      },
      validationState: "invalid",
      validationField: "email",
    });

    const emailCell = screen
      .getByRole("button", { name: "Edit Email for row 4" })
      .closest("td");
    const countryCell = screen
      .getByRole("button", { name: "Edit Country for row 4" })
      .closest("td");

    expect(emailCell).not.toBeNull();
    expect(countryCell).not.toBeNull();
    expect(within(emailCell as HTMLElement).getByText("Invalid value"))
      .toBeInTheDocument();
    expect(within(countryCell as HTMLElement).getByText("Missing field"))
      .toBeInTheDocument();
  });
});
