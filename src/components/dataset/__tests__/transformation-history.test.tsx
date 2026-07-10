import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TransformationHistory } from "../transformation-history";

describe("TransformationHistory", () => {
  it("shows a reverted manual edit as a logical transformation", () => {
    render(
      <TransformationHistory
        columns={[{ key: "email", label: "Email" }]}
        transformations={[
          {
            id: "event-1",
            timestamp: "10:00 AM",
            suggestionId: "manual-edit",
            suggestionTitle: "Manual edit on row #4",
            affectedRows: [4],
            action: "manual_edit",
            reverted: true,
            revertStatus: "reverted",
            changes: [
              {
                rowId: 4,
                field: "email",
                beforeValue: "nina.patel@acme",
                afterValue: "nina.patel@acme.com",
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getByText("1 recorded transformation")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Manual edit on row #4" }))
      .toBeInTheDocument();
    expect(screen.getAllByText("Reverted")).toHaveLength(2);
    expect(screen.getByText("Manual Edit")).toBeInTheDocument();
    expect(screen.getByText("nina.patel@acme")).toBeInTheDocument();
    expect(screen.getByText("nina.patel@acme.com")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /undo/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Undo Manual Edit")).not.toBeInTheDocument();
  });
});
