import { DatasetCellValue } from "@/types/dataset";

import {
  AIFinding,
  AIFindingSource,
  AIObservationCategory,
  DatasetInsightInput,
} from "./types";

type RawFinding = {
  title?: unknown;
  description?: unknown;
  reasoning?: unknown;
  confidence?: unknown;
  severity?: unknown;
  targetField?: unknown;
  affectedRows?: unknown;
  suggestedAction?: unknown;
  suggestedValue?: unknown;
  category?: unknown;
};

type ParsedRawAIResponse = {
  findings?: unknown;
};

type ParsedAIResponse = {
  summary: string;
  findings: AIFinding[];
};

const allowedCategories = new Set<AIObservationCategory>([
  "pattern",
  "business_context",
  "review_priority",
  "data_quality_summary",
]);

const allowedActions = new Set<NonNullable<AIFinding["suggestedAction"]>>([
  "flag_invalid",
  "standardize_value",
  "fill_missing",
]);

function cleanJsonText(text: string) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fencedMatch?.[1]) return fencedMatch[1].trim();

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");

  if (objectStart >= 0 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1).trim();
  }

  return trimmed;
}

function parseRawResponse(rawText: string): ParsedRawAIResponse | null {
  try {
    const parsed: unknown = JSON.parse(cleanJsonText(rawText));

    if (Array.isArray(parsed)) {
      return { findings: parsed };
    }

    if (parsed && typeof parsed === "object") {
      return parsed as ParsedRawAIResponse;
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeConfidence(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0.7;
  return Math.max(0, Math.min(1, value));
}

function normalizeSeverity(value: unknown): AIFinding["severity"] {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}

function normalizeCategory(value: unknown): AIObservationCategory {
  if (
    typeof value === "string" &&
    allowedCategories.has(value as AIObservationCategory)
  ) {
    return value as AIObservationCategory;
  }

  return "pattern";
}

function normalizeSuggestedAction(
  value: unknown
): NonNullable<AIFinding["suggestedAction"]> {
  if (
    typeof value === "string" &&
    allowedActions.has(value as NonNullable<AIFinding["suggestedAction"]>)
  ) {
    return value as NonNullable<AIFinding["suggestedAction"]>;
  }

  return "flag_invalid";
}

function normalizeSuggestedValue(value: unknown): DatasetCellValue | undefined {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  ) {
    return value;
  }

  return undefined;
}

function normalizeAffectedRows(
  value: unknown,
  input: DatasetInsightInput
): number[] {
  if (!Array.isArray(value)) return [];

  const validRowIds = new Set(input.analysisRows.map((row) => row.id));

  return Array.from(
    new Set(
      value
        .filter((rowId): rowId is number => typeof rowId === "number")
        .filter((rowId) => validRowIds.has(rowId))
    )
  ).sort((left, right) => left - right);
}

function normalizeTargetField(
  value: unknown,
  input: DatasetInsightInput
): string | undefined {
  if (typeof value !== "string") return undefined;

  const field = value.trim();
  const validFields = new Set(input.columns.map((column) => column.key));

  return validFields.has(field) ? field : undefined;
}

function createFindingId({
  source,
  title,
  targetField,
  affectedRows,
}: {
  source: AIFindingSource;
  title: string;
  targetField?: string;
  affectedRows: number[];
}) {
  const slug = [title, targetField, affectedRows.join("-")]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${source}-${slug || crypto.randomUUID()}`;
}

export function parseAIFindingsFromText({
  rawText,
  input,
  source,
}: {
  rawText: string;
  input: DatasetInsightInput;
  source: AIFindingSource;
}): ParsedAIResponse {
  const parsed = parseRawResponse(rawText);

  if (!parsed || !Array.isArray(parsed.findings)) {
    return {
      summary:
        "Browser AI completed analysis, but did not return trusted structured findings.",
      findings: [],
    };
  }

  const rawFindings = parsed.findings as unknown[];

  const findings = rawFindings
    .slice(0, 3)
    .map((rawFinding: unknown): AIFinding | null => {
      if (!rawFinding || typeof rawFinding !== "object") return null;

      const finding = rawFinding as RawFinding;

      const title = normalizeString(finding.title);
      const description = normalizeString(finding.description);
      const reasoning = normalizeString(finding.reasoning);
      const affectedRows = normalizeAffectedRows(finding.affectedRows, input);
      const targetField = normalizeTargetField(finding.targetField, input);

      if (!title || !description || !reasoning) return null;
      if (!targetField || affectedRows.length === 0) return null;

      return {
        id: createFindingId({
          source,
          title,
          targetField,
          affectedRows,
        }),
        kind: "validation",
        title,
        description,
        reasoning,
        confidence: normalizeConfidence(finding.confidence),
        severity: normalizeSeverity(finding.severity),
        targetField,
        affectedRows,
        suggestedAction: normalizeSuggestedAction(finding.suggestedAction),
        suggestedValue: normalizeSuggestedValue(finding.suggestedValue),
        source,
        status: "new",
        category: normalizeCategory(finding.category),
      };
    })
    .filter((finding: AIFinding | null): finding is AIFinding => {
      return finding !== null;
    });

  return {
    summary:
      findings.length > 0
        ? "Browser AI found supplemental suspicious patterns or incorrect data."
        : "No supplemental suspicious patterns were found beyond the current Review Queue.",
    findings,
  };
}