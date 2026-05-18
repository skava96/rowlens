import * as XLSX from "xlsx";

import {
    DatasetCellValue,
    DatasetColumn,
    DatasetRow,
} from "@/types/dataset";

export type ParsedDataset = {
    columns: DatasetColumn[];
    rows: DatasetRow[];
};

function normalizeColumnKey(value: string, index: number) {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    return normalized || `column_${index + 1}`;
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

export async function parseDatasetFile(file: File): Promise<ParsedDataset> {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !["csv", "xlsx"].includes(extension)) {
        throw new Error("Unsupported file type. Please upload a CSV or XLSX file.");
    }

    const buffer = await file.arrayBuffer();

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

    if (rawRows.length === 0) {
        throw new Error("The uploaded dataset is empty.");
    }

    const originalHeaders = Object.keys(rawRows[0]);

    if (originalHeaders.length === 0) {
        throw new Error("No columns found in the uploaded dataset.");
    }

    const columns = originalHeaders.map((header, index) => ({
        key: normalizeColumnKey(header, index),
        label: header,
    }));

    const rows = rawRows.map((rawRow, rowIndex) => {
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
            ...getRowValidationState(values),
        };
    });

    return {
        columns,
        rows,
    };
}

function getRowValidationState(
    values: Record<string, DatasetCellValue>
): {
    validationState: "valid" | "missing" | "invalid";
    validationField?: string;
} {
    const entries = Object.entries(values);

    const missingEntry = entries.find(([, value]) => {
        return value === null || value === undefined || value === "";
    });

    if (missingEntry) {
        return {
            validationState: "missing",
            validationField: missingEntry[0],
        };
    }

    const emailEntry = entries.find(([key, value]) => {
        return (
            key.toLowerCase().includes("email") &&
            typeof value === "string" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        );
    });

    if (emailEntry) {
        return {
            validationState: "invalid",
            validationField: emailEntry[0],
        };
    }

    return {
        validationState: "valid",
    };
}