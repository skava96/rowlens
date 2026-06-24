import { AIFinding, AIFindingSource, DatasetInsightInput } from "./types";

type RawFinding = {
  title?: unknown;
  description?: unknown;
  reasoning?: unknown;
  confidence?: unknown;
  category?: unknown;

  // Disallowed for browser AI
  severity?: unknown;
  targetField?: unknown;
  targetFields?: unknown;
  affectedRows?: unknown;
  evidence?: unknown;
  suggestedAction?: unknown;
  suggestedValue?: unknown;
};

type ParsedAIResponse = {
  summary: string;
  findings: AIFinding[];
};

const observationCategories = new Set([
  "pattern",
  "business_context",
  "review_priority",
  "data_quality_summary",
]);

const browserAIDisallowedKeys = [
  "severity",
  "targetField",
  "targetFields",
  "affectedRows",
  "evidence",
  "suggestedAction",
  "suggestedValue",
];

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

function clampConfidence(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeCategory(value: unknown): AIFinding["category"] {
  if (typeof value !== "string") return "data_quality_summary";

  return observationCategories.has(value)
    ? (value as AIFinding["category"])
    : "data_quality_summary";
}

function createObservationId(title: string, category: AIFinding["category"]) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `ai-observation-${category ?? "summary"}-${slug || "finding"}`;
}

function parseRawResponse(
  rawText: string
): { summary?: unknown; findings?: unknown[] } | null {
  try {
    const parsed = JSON.parse(cleanJsonText(rawText));

    if (Array.isArray(parsed)) {
      return {
        summary: "",
        findings: parsed,
      };
    }

    return parsed;
  } catch {
    return null;
  }
}

function createSafeFallbackSummary(rawText: string) {
  return rawText.trim()
    ? "AI analysis completed, but no trusted structured observations were returned."
    : "AI analysis did not return structured observations.";
}

function hasBrowserAIDisallowedKeys(rawFinding: Record<string, unknown>) {
  return browserAIDisallowedKeys.some((key) => key in rawFinding);
}

export function parseAIFindingsFromText({
  rawText,
  source,
}: {
  rawText: string;
  input: DatasetInsightInput;
  source: AIFindingSource;
}): ParsedAIResponse {
  const parsed = parseRawResponse(rawText);

  if (!parsed || !Array.isArray(parsed.findings)) {
    return {
      summary: createSafeFallbackSummary(rawText),
      findings: [],
    };
  }

  const findings = parsed.findings
    .slice(0, 3)
    .map((rawFinding): AIFinding | null => {
      if (!rawFinding || typeof rawFinding !== "object") return null;

      const finding = rawFinding as RawFinding & Record<string, unknown>;

      if (source === "browser-ai" && hasBrowserAIDisallowedKeys(finding)) {
        return null;
      }

      const title = normalizeString(finding.title, "");
      const description = normalizeString(finding.description, "");
      const reasoning = normalizeString(finding.reasoning, "");

      if (!title || !description || !reasoning) return null;

      const category = normalizeCategory(finding.category);

      return {
        id: createObservationId(title, category),
        kind: "observation",
        title,
        description,
        reasoning,
        confidence: clampConfidence(finding.confidence),
        severity: "low",
        affectedRows: [],
        source: "browser-ai",
        status: "new",
        category,
      };
    })
    .filter((finding): finding is AIFinding => finding !== null);

  return {
    summary: normalizeString(
      parsed.summary,
      findings.length > 0
        ? "AI generated supplemental observations."
        : "No additional AI findings."
    ),
    findings,
  };
}