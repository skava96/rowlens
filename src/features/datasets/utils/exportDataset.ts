import { DatasetColumn, DatasetRow } from "@/types/dataset";

function escapeCsvValue(value: unknown): string {
  const rawValue = value == null ? "" : String(value);

  const formulaUnsafePattern = /^[=+\-@]/;
  const safeValue = formulaUnsafePattern.test(rawValue)
    ? `'${rawValue}`
    : rawValue;

  return `"${safeValue.replace(/"/g, '""')}"`;
}

export function exportDatasetToCsv(
  rows: DatasetRow[],
  columns: DatasetColumn[],
): string {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(",");

  const body = rows.map((row) =>
    columns
      .map((column) => escapeCsvValue(row.values[column.key]))
      .join(","),
  );

  return [header, ...body].join("\n");
}

export function downloadCsv(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}