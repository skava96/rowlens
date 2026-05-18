import { DatasetColumn, DatasetRow } from "@/types/dataset";

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function exportDatasetToCsv({
  columns,
  rows,
  fileName = "cleanflow-export.csv",
}: {
  columns: DatasetColumn[];
  rows: DatasetRow[];
  fileName?: string;
}) {
  const headers = columns.map((column) => escapeCsvValue(column.label));

  const csvRows = rows.map((row) =>
    columns
      .map((column) => escapeCsvValue(row.values[column.key]))
      .join(",")
  );

  const csvContent = [headers.join(","), ...csvRows].join("\n");

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