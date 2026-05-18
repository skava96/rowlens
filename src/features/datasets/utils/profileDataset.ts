import { DatasetColumn, DatasetRow } from "@/types/dataset";

export type DatasetColumnProfile = {
  column: string;
  completeness: number;
  missingCount: number;
  uniqueValues: number;
  inferredType: "string" | "number" | "date" | "boolean";
};

export type DatasetProfile = {
  totalRows: number;
  duplicateRows: number;
  columns: DatasetColumnProfile[];
};

function inferType(values: unknown[]) {
  const filtered = values.filter(
    (value) => value !== null && value !== undefined && value !== ""
  );

  if (!filtered.length) {
    return "string";
  }

  const allNumbers = filtered.every(
    (value) => typeof value === "number"
  );

  if (allNumbers) {
    return "number";
  }

  const allBooleans = filtered.every(
    (value) => typeof value === "boolean"
  );

  if (allBooleans) {
    return "boolean";
  }

  const allDates = filtered.every((value) => {
    return (
      typeof value === "string" &&
      !Number.isNaN(Date.parse(value))
    );
  });

  if (allDates) {
    return "date";
  }

  return "string";
}

export function profileDataset(
  columns: DatasetColumn[],
  rows: DatasetRow[]
): DatasetProfile {
  const duplicateTracker = new Set<string>();
  let duplicateRows = 0;

  rows.forEach((row) => {
    const fingerprint = JSON.stringify(row.values);

    if (duplicateTracker.has(fingerprint)) {
      duplicateRows += 1;
    } else {
      duplicateTracker.add(fingerprint);
    }
  });

  const columnProfiles: DatasetColumnProfile[] = columns.map((column) => {
    const values = rows.map((row) => row.values[column.key]);

    const missingCount = values.filter(
      (value) =>
        value === null ||
        value === undefined ||
        value === ""
    ).length;

    const completeness =
      rows.length === 0
        ? 100
        : Math.round(((rows.length - missingCount) / rows.length) * 100);

    const uniqueValues = new Set(values).size;

    return {
      column: column.label,
      completeness,
      missingCount,
      uniqueValues,
      inferredType: inferType(values),
    };
  });

  return {
    totalRows: rows.length,
    duplicateRows,
    columns: columnProfiles,
  };
}