import { AIFinding } from "./types";

const severityRank: Record<AIFinding["severity"], number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getMergeKey(finding: AIFinding) {
  if (finding.kind === "observation") {
    return [
      "observation",
      finding.category ?? "general",
      normalizeText(finding.title),
    ].join("|");
  }

  return [
    "validation",
    normalizeText(finding.title),
    finding.targetField ?? "field",
    finding.suggestedAction ?? "flag_invalid",
  ].join("|");
}

function mergeReasoning(current: string, next: string) {
  if (current.includes(next)) return current;
  if (next.includes(current)) return next;

  return `${current} ${next}`.trim();
}

export function mergeAIFindings(findings: AIFinding[]) {
  const merged = new Map<string, AIFinding>();

  for (const finding of findings) {
    const key = getMergeKey(finding);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...finding,
        affectedRows: [...finding.affectedRows],
      });
      continue;
    }

    const affectedRows =
      existing.kind === "observation"
        ? []
        : Array.from(
          new Set([...existing.affectedRows, ...finding.affectedRows])
        ).sort((left, right) => left - right);

    merged.set(key, {
      ...existing,
      severity:
        severityRank[finding.severity] > severityRank[existing.severity]
          ? finding.severity
          : existing.severity,
      confidence: Math.max(existing.confidence, finding.confidence),
      affectedRows,
      reasoning: mergeReasoning(existing.reasoning, finding.reasoning),
      status:
        existing.status === "added_to_review_queue" ||
          existing.status === "dismissed"
          ? existing.status
          : finding.status,
      matchedSuggestionId:
        existing.matchedSuggestionId ?? finding.matchedSuggestionId,
    });
  }

  return Array.from(merged.values());
}
