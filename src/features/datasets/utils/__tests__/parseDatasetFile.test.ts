import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { parseDatasetFile } from "../parseDatasetFile";

function createWorkbookFile(headers: string[], rows: unknown[][]) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const buffer = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
  });

  return new File([buffer], "test.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("parseDatasetFile", () => {
  it("deduplicates normalized column keys without dropping values", async () => {
    const file = createWorkbookFile(
      ["First Name", "first-name", "first_name"],
      [["Steffi", "Maria", "K"]]
    );

    const result = await parseDatasetFile(file);

    expect(result.columns.map((column) => column.key)).toEqual([
      "first_name",
      "first_name_2",
      "first_name_3",
    ]);

    expect(result.rows[0].values).toEqual({
      first_name: "Steffi",
      first_name_2: "Maria",
      first_name_3: "K",
    });
  });

  it("marks rows with missing values as missing", async () => {
    const file = createWorkbookFile(
      ["Name", "Email"],
      [["Steffi", null]]
    );

    const result = await parseDatasetFile(file);

    expect(result.rows[0].validationState).toBe("missing");
    expect(result.rows[0].validationField).toBe("email");
  });

  it("marks rows with invalid emails as invalid", async () => {
    const file = createWorkbookFile(
      ["Name", "Email"],
      [["Steffi", "not-an-email"]]
    );

    const result = await parseDatasetFile(file);

    expect(result.rows[0].validationState).toBe("invalid");
    expect(result.rows[0].validationField).toBe("email");
  });
});