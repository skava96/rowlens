import { DatasetColumn, DatasetRow } from "@/types/dataset";

type Args = {
  rows: DatasetRow[];
  columns: DatasetColumn[];
};

type ValueCount = {
  value: string;
  count: number;
  rowIds: number[];
};

export type AIColumnEvidence = {
  field: string;
  label: string;
  completeness: number;
  distinctCount: number;
  topValues: ValueCount[];
  textExamples: string[];
  numericSummary?: {
    min: number;
    median: number;
    max: number;
  };
};

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) return "";

  return String(value).trim();
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function isNumeric(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value);

  if (typeof value !== "string") return false;

  const trimmed = value.trim();

  return trimmed !== "" && Number.isFinite(Number(trimmed));
}

function isLowValueAIField(field: string) {
  const key = field.toLowerCase();

  return (
    key.includes("id") ||
    key.includes("email") ||
    key.includes("phone") ||
    key.includes("name") ||
    key.includes("status") ||
    key.includes("manager")
  );
}

function getVariantScore(column: AIColumnEvidence) {
  const values = column.textExamples.map((value) => value.toLowerCase());
  const uniqueLowercaseCount = new Set(values).size;

  return column.textExamples.length - uniqueLowercaseCount;
}

export function buildAIAnalysisContext({
  rows,
  columns,
}: Args): AIColumnEvidence[] {
  return columns
    .filter((column) => !isLowValueAIField(column.key))
    .slice(0, 8)
    .map((column) => {
      const values = rows.map((row) => normalizeValue(row.values[column.key]));

      const populatedValues = values.filter(Boolean);
      const valueCounts = new Map<string, { count: number; rowIds: number[] }>();

      for (const row of rows) {
        const value = normalizeValue(row.values[column.key]);
        if (!value) continue;

        const current = valueCounts.get(value) ?? {
          count: 0,
          rowIds: [],
        };

        current.count += 1;
        current.rowIds.push(row.id);

        valueCounts.set(value, current);
      }

      const topValues = [...valueCounts.entries()]
        .sort((left, right) => right[1].count - left[1].count)
        .slice(0, 8)
        .map(([value, meta]) => ({
          value,
          count: meta.count,
          rowIds: meta.rowIds.slice(0, 8),
        }));

      const textExamples = [...new Set(populatedValues)]
        .filter((value) => Number.isNaN(Number(value)))
        .slice(0, 8);

      const numericValues = populatedValues
        .filter(isNumeric)
        .map((value) => Number(value));

      return {
        field: column.key,
        label: column.label,
        completeness:
          rows.length === 0
            ? 100
            : Math.round((populatedValues.length / rows.length) * 100),
        distinctCount: new Set(populatedValues).size,
        topValues,
        textExamples,
        numericSummary:
          numericValues.length > 0
            ? {
              min: Math.min(...numericValues),
              median: median(numericValues),
              max: Math.max(...numericValues),
            }
            : undefined,
      };
    })
    .sort((left, right) => getVariantScore(right) - getVariantScore(left))
    .slice(0, 8);
}