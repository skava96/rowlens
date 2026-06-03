import {
  DatasetColumn,
  DatasetRow,
} from "@/types/dataset";

import { createParsedDataset } from "./createParsedDataset";
import { validateDatasetFile, validateDatasetRowCount } from "../parsing/validate-dataset-file";

export type ParsedDataset = {
  columns: DatasetColumn[];
  rows: DatasetRow[];
};


export async function parseDatasetFile(file: File): Promise<ParsedDataset> {

  validateDatasetFile(file);

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

  validateDatasetRowCount(rawRows.length);

  return createParsedDataset(rawRows);
}