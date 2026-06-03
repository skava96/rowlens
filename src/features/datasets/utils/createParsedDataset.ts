import { DatasetCellValue, DatasetColumn, DatasetRow } from "@/types/dataset";
import { getRowValidationState } from "./getRowValidationState";
import { ParsedDataset } from "./parseDatasetFile";
import { createRowSearchText } from "./createRowSearchText";



function normalizeColumnKey(value: string, index: number) {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    return normalized || `column_${index + 1}`;
}

function createUniqueColumnKey(
    header: string,
    index: number,
    usedColumnKeys: Map<string, number>
) {
    const baseKey = normalizeColumnKey(header, index);
    const existingCount = usedColumnKeys.get(baseKey) ?? 0;
    const nextCount = existingCount + 1;

    usedColumnKeys.set(baseKey, nextCount);

    if (existingCount === 0) {
        return baseKey;
    }

    return `${baseKey}_${nextCount}`;
}

function toDatasetCellValue(value: unknown): DatasetCellValue {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return value;
    }

    return String(value);
}
export function createParsedDataset(
    rawRows: Record<string, unknown>[]
): ParsedDataset {
    if (rawRows.length === 0) {
        throw new Error("The uploaded dataset is empty.");
    }

    const originalHeaders = Object.keys(rawRows[0]);

    if (originalHeaders.length === 0) {
        throw new Error("No columns found in the uploaded dataset.");
    }

    const usedColumnKeys = new Map<string, number>();

    const columns: DatasetColumn[] = originalHeaders.map((header, index) => ({
        key: createUniqueColumnKey(header, index, usedColumnKeys),
        label: header,
    }));

    const rows: DatasetRow[] = rawRows.map((rawRow, rowIndex) => {
        const values = columns.reduce<Record<string, DatasetCellValue>>(
            (acc, column, columnIndex) => {
                const originalHeader = originalHeaders[columnIndex];
                acc[column.key] = toDatasetCellValue(rawRow[originalHeader]);
                return acc;
            },
            {}
        );

        return {
            id: rowIndex + 1,
            values,
            reviewState: "unreviewed",
            searchText: createRowSearchText(values),
            ...getRowValidationState(values),
        };
    });

    return { columns, rows };
}