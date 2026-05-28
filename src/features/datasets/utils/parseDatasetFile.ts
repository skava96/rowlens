import {
  DatasetColumn,
  DatasetRow,
} from "@/types/dataset";

import { createParsedDataset } from "./createParsedDataset";

export type ParsedDataset = {
  columns: DatasetColumn[];
  rows: DatasetRow[];
};

export async function parseDatasetFile(file: File): Promise<ParsedDataset> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !["csv", "xlsx"].includes(extension)) {
    throw new Error("Unsupported file type. Please upload a CSV or XLSX file.");
  }

  const buffer = await file.arrayBuffer();

  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("No worksheet found in the uploaded file.");
  }

  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
  });

  return createParsedDataset(rawRows);
}