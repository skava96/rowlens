import {
  DatasetColumn,
  DatasetRow,
} from "@/types/dataset";
import { readSheet as readBrowserSheet } from "read-excel-file/browser";

import { createParsedDataset } from "./createParsedDataset";
import {
  getDatasetFileExtension,
  validateDatasetFile,
  validateDatasetRowCount,
} from "../parsing/validate-dataset-file";

export type ParsedDataset = {
  columns: DatasetColumn[];
  rows: DatasetRow[];
};

type XlsxSheetReaderOptions = {
  trim?: boolean;
};

type XlsxSheetReader = (
  file: File,
  options?: XlsxSheetReaderOptions
) => Promise<unknown[][]>;

export async function parseDatasetFile(file: File): Promise<ParsedDataset> {
  return parseDatasetFileWithXlsxReader(file, readBrowserSheet);
}

export async function parseDatasetFileWithXlsxReader(
  file: File,
  readXlsxSheet: XlsxSheetReader
): Promise<ParsedDataset> {
  validateDatasetFile(file);

  const extension = getDatasetFileExtension(file.name);

  if (extension === "csv") {
    return parseCsvFile(file);
  }

  if (extension === "xlsx") {
    return parseXlsxFile(file, readXlsxSheet);
  }

  throw new Error("Unsupported file type. Please upload a CSV or XLSX file.");
}

export async function parseCsvFile(file: File): Promise<ParsedDataset> {
  validateDatasetFile(file);

  const rawRows = parseCsvFileText(await file.text());

  validateDatasetRowCount(rawRows.length);

  return createParsedDataset(rawRows);
}

export async function parseXlsxFile(
  file: File,
  readXlsxSheet: XlsxSheetReader = readBrowserSheet
): Promise<ParsedDataset> {
  validateDatasetFile(file);

  const sheetRows = await readXlsxSheetWithRecovery(file, readXlsxSheet);

  const rawRows = createRawRowsFromSheetRows(sheetRows);

  validateDatasetRowCount(rawRows.length);

  return createParsedDataset(rawRows);
}

function isUndefinedTrimXlsxError(error: unknown) {
  return (
    error instanceof TypeError &&
    error.message.includes("Cannot read properties of undefined") &&
    error.message.includes("trim")
  );
}

function createXlsxParseError(error: unknown, retryAttempted: boolean) {
  const parseError = new Error("XLSX file could not be parsed.", {
    cause: error,
  });

  if (process.env.NODE_ENV !== "production") {
    Object.defineProperty(parseError, "diagnostics", {
      value: {
        retryAttempted,
        originalMessage:
          error instanceof Error ? error.message : String(error),
        originalName: error instanceof Error ? error.name : typeof error,
      },
    });
  }

  return parseError;
}

function normalizeRetriedXlsxRows(rows: unknown[][]) {
  return rows.map((row) =>
    row.map((value) => {
      if (typeof value !== "string") return value;

      const trimmedValue = value.trim();

      return trimmedValue === "" ? null : trimmedValue;
    })
  );
}

async function readXlsxSheetWithRecovery(
  file: File,
  readXlsxSheet: XlsxSheetReader
) {
  try {
    return await readXlsxSheet(file);
  } catch (error) {
    if (!isUndefinedTrimXlsxError(error)) {
      throw createXlsxParseError(error, false);
    }

    try {
      const recoveredRows = await readXlsxSheet(file, { trim: false });

      return normalizeRetriedXlsxRows(recoveredRows);
    } catch (retryError) {
      throw createXlsxParseError(retryError, true);
    }
  }
}

export function createRawRowsFromSheetRows(
  rows: unknown[][]
): Record<string, unknown>[] {
  const [headers, ...dataRows] = rows;

  if (!headers || headers.length === 0) {
    throw new Error("The uploaded dataset is empty.");
  }

  const normalizedHeaders = headers.map((header, index) => {
    if (header === null || header === undefined || header === "") {
      return `Column ${index + 1}`;
    }

    return String(header);
  });

  return dataRows
    .filter((row) =>
      row.some((value) => value !== null && value !== undefined && value !== "")
    )
    .map((row) =>
      Object.fromEntries(
        normalizedHeaders.map((header, index) => [
          header,
          row[index] === undefined || row[index] === "" ? null : row[index],
        ])
      )
    );
}

export function parseCsvFileText(text: string): Record<string, unknown>[] {
  const rows = parseCsv(text);
  const [headers, ...dataRows] = rows;

  if (!headers || headers.length === 0) {
    throw new Error("No rows found in the uploaded file.");
  }

  const normalizedHeaders = headers.map((header, index) => {
    const normalizedHeader =
      index === 0 ? header.replace(/^\uFEFF/, "") : header;

    if (normalizedHeader === "") {
      return `Column ${index + 1}`;
    }

    return normalizedHeader;
  });

  return dataRows
    .filter((row) => row.some((value) => value.trim() !== ""))
    .map((row) =>
      Object.fromEntries(
        normalizedHeaders.map((header, index) => [
          header,
          row[index] === undefined || row[index] === "" ? null : row[index],
        ])
      )
    );
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  rows.push(row);

  return rows;
}
