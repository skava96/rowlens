import { DatasetColumn, DatasetRow } from "@/types/dataset";
import { AICandidatePattern } from "./types";

type Args = {
  rows: DatasetRow[];
  columns: DatasetColumn[];
};

const PLACEHOLDER_VALUES = new Set([
  "",
  "n/a",
  "na",
  "null",
  "none",
  "unknown",
  "test",
  "test user",
  "dummy",
  "-",
]);

function normalizeCase(value: string) {
  return value.trim().toLowerCase();
}

function isNumeric(value: unknown): boolean {
  return (
    typeof value === "number" ||
    (typeof value === "string" &&
      value.trim() !== "" &&
      !Number.isNaN(Number(value)))
  );
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function createPatternId(
  type: AICandidatePattern["type"],
  field: string,
  evidence: Array<{ rowId: number; value: string }>
) {
  const firstValue =
    evidence.length > 0 ? normalizeCase(evidence[0].value) : "unknown";

  return `${type}:${field}:${firstValue}`;
}

export function extractCandidatePatterns({
  rows,
  columns,
}: Args): AICandidatePattern[] {
  const findings: AICandidatePattern[] = [];

  for (const column of columns) {
    const key = column.key;

    const cellValues = rows.map((row) => ({
      rowId: row.id,
      value: row.values[key],
    }));

    const textValues = cellValues.filter(
      (item): item is { rowId: number; value: string } =>
        typeof item.value === "string" && item.value.trim() !== ""
    );

    //
    // ----------------------------------------------------
    // Formatting inconsistencies
    // ----------------------------------------------------
    //

    const grouped = new Map<
      string,
      {
        originals: Map<number, string>;
      }
    >();

    for (const item of textValues) {
      const normalized = normalizeCase(item.value);

      if (!grouped.has(normalized)) {
        grouped.set(normalized, {
          originals: new Map(),
        });
      }

      grouped.get(normalized)!.originals.set(item.rowId, item.value);
    }

    for (const [, group] of grouped) {
      const uniqueValues = new Set(group.originals.values());

      if (uniqueValues.size <= 1) continue;

      const evidence = [...group.originals.entries()].map(([rowId, value]) => ({
        rowId,
        value,
      }));

      findings.push({
        id: createPatternId("format_inconsistency", key, evidence),
        type: "format_inconsistency",
        title: `Inconsistent ${column.label} formatting`,
        description: `${column.label} contains multiple formatting variations.`,
        targetField: key,
        affectedRows: [...group.originals.keys()],
        evidence,
        suggestedAction: "standardize_value",
        severity: "medium",
      });
    }

    //
    // ----------------------------------------------------
    // Placeholder values
    // ----------------------------------------------------
    //

    const placeholders = textValues.filter((item) =>
      PLACEHOLDER_VALUES.has(normalizeCase(item.value))
    );

    const evidence = placeholders.map((p) => ({
      rowId: p.rowId,
      value: p.value,
    }));

    if (placeholders.length > 0) {
      findings.push({
        id: createPatternId("placeholder_value", key, evidence),
        type: "placeholder_value",
        title: `Placeholder values detected`,
        description: `${column.label} contains placeholder values that should be reviewed.`,
        targetField: key,
        affectedRows: placeholders.map((p) => p.rowId),
        evidence,
        suggestedAction: "flag_invalid",
        severity: "medium",
      });
    }

    //
    // ----------------------------------------------------
    // Categorical aliases
    // ----------------------------------------------------
    //

    const distinct = [...new Set(textValues.map((t) => t.value))];

    for (let i = 0; i < distinct.length; i++) {
      for (let j = i + 1; j < distinct.length; j++) {
        const left = distinct[i];
        const right = distinct[j];

        const short = left.length < right.length ? left : right;
        const long = left.length < right.length ? right : left;

        if (
          short.length <= 4 &&
          long.length >= 8 &&
          long.toLowerCase().startsWith(short.toLowerCase())
        ) {
          const evidence = textValues
            .filter((r) => r.value === left || r.value === right)
            .map((r) => ({
              rowId: r.rowId,
              value: r.value,
            }));

          findings.push({
            id: createPatternId("categorical_alias", key, evidence),
            type: "categorical_alias",
            title: `Possible categorical aliases`,
            description: `${column.label} appears to contain abbreviated and expanded forms of the same value.`,
            targetField: key,
            affectedRows: evidence.map((e) => e.rowId),
            evidence,
            suggestedAction: "standardize_value",
            severity: "medium",
          });
        }
      }
    }

    //
    // ----------------------------------------------------
    // Numeric outliers
    // ----------------------------------------------------
    //

    const numeric = cellValues
      .filter((item) => isNumeric(item.value))
      .map((item) => ({
        rowId: item.rowId,
        value: Number(item.value),
      }));

    if (numeric.length >= 5) {
      const med = median(numeric.map((n) => n.value));

      for (const item of numeric) {
        if (med === 0) continue;
        const evidence = [
          {
            rowId: item.rowId,
            value: String(item.value),
          },
        ];

        if (item.value > med * 5 || item.value < med / 5) {
          findings.push({
            id: createPatternId("numeric_outlier", key, evidence),
            type: "numeric_outlier",
            title: `Possible numeric outlier`,
            description: `${column.label} contains a value that differs significantly from the surrounding values.`,
            targetField: key,
            affectedRows: [item.rowId],
            evidence,
            suggestedAction: "flag_invalid",
            severity: "high",
          });
        }
      }
    }
  }

  return findings;
}