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
  selectedValues?: unknown;
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
]);

const allowedActions = new Set<NonNullable<AIFinding["suggestedAction"]>>([
  "flag_invalid",
  "standardize_value",
  "fill_missing",
]);

const MAX_PARSED_AI_FINDINGS = 3;

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
): AIFinding["suggestedAction"] {
  if (
    typeof value === "string" &&
    allowedActions.has(value as NonNullable<AIFinding["suggestedAction"]>)
  ) {
    return value as NonNullable<AIFinding["suggestedAction"]>;
  }

  return undefined;
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

function isForbiddenDeterministicFinding(finding: RawFinding) {
  const text = [
    finding.title,
    finding.description,
    finding.reasoning,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("missing") ||
    text.includes("empty") ||
    text.includes("invalid email") ||
    text.includes("invalid phone") ||
    text.includes("malformed email")
  );
}

function normalizeSuggestedActionForFinding(
  finding: RawFinding
): AIFinding["suggestedAction"] {
  const text = [
    finding.title,
    finding.description,
    finding.reasoning,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    text.includes("standard") ||
    text.includes("case") ||
    text.includes("abbreviation") ||
    text.includes("alias") ||
    text.includes("written differently") ||
    text.includes("fragment reports")
  ) {
    return "standardize_value";
  }

  return normalizeSuggestedAction(finding.suggestedAction) ?? "flag_invalid";
}

function normalizeSelectedValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function resolveAffectedRowsFromEvidence({
  targetField,
  selectedValues,
  rawAffectedRows,
  input,
}: {
  targetField: string;
  selectedValues: string[];
  rawAffectedRows: unknown;
  input: DatasetInsightInput;
}): number[] {
  const explicitAffectedRows = normalizeAffectedRows(rawAffectedRows, input);

  if (explicitAffectedRows.length > 0) {
    return explicitAffectedRows;
  }

  const selected = new Set(selectedValues.map((value) => value.toLowerCase()));

  return input.analysisRows
    .filter((row) =>
      selected.has(String(row.values[targetField] ?? "").trim().toLowerCase())
    )
    .map((row) => row.id)
    .sort((left, right) => left - right);
}

function hasRealValueVariation({
  targetField,
  selectedValues,
  input,
}: {
  targetField: string;
  selectedValues: string[];
  input: DatasetInsightInput;
}) {
  const selectedNormalized = new Set(
    selectedValues.map((value) => value.trim().toLowerCase())
  );

  const actualValues = input.analysisRows
    .map((row) => String(row.values[targetField] ?? "").trim())
    .filter(Boolean);

  const matchingValues = actualValues.filter((value) =>
    selectedNormalized.has(value.toLowerCase())
  );

  return new Set(matchingValues).size > 1;
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
    .slice(0, MAX_PARSED_AI_FINDINGS)
    .map((rawFinding: unknown): AIFinding | null => {
      if (!rawFinding || typeof rawFinding !== "object") return null;

      const finding = rawFinding as RawFinding;

      if (isForbiddenDeterministicFinding(finding)) {
        return null;
      }

      const title = normalizeString(finding.title);
      const description = normalizeString(finding.description);
      const reasoning = normalizeString(finding.reasoning);
      const targetField = normalizeTargetField(finding.targetField, input);

      if (!targetField) {
        return null;
      }

      const selectedValues = normalizeSelectedValues(finding.selectedValues);

      const affectedRows = resolveAffectedRowsFromEvidence({
        targetField,
        selectedValues,
        rawAffectedRows: finding.affectedRows,
        input,
      });

      const suggestedAction =
        normalizeSuggestedActionForFinding(finding);

      if (affectedRows.length === 0 || !suggestedAction) {
        return null;
      }

      if (!title || !description || !reasoning) {
        return null;
      }

      if (
        suggestedAction === "standardize_value" &&
        selectedValues.length > 0 &&
        selectedValues.length < 2 &&
        !hasRealValueVariation({ targetField, selectedValues, input })
      ) {
        return null;
      }
      return {
        id: createFindingId({
          source,
          title,
          targetField,
          affectedRows,
        }),
        kind: "observation",
        title,
        description,
        reasoning,
        confidence: normalizeConfidence(finding.confidence),
        severity: normalizeSeverity(finding.severity),
        targetField,
        affectedRows,
        suggestedAction: suggestedAction,
        suggestedValue: normalizeSuggestedValue(
          finding.suggestedValue
        ),
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
        : "No actionable review candidates were found.",
    findings,
  };
}
