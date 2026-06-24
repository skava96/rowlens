import { AISuggestion } from "@/types/dataset";

import { AIFinding } from "./types";

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hasOverlap(left: number[], right: number[]) {
  const rightSet = new Set(right);
  return left.some((item) => rightSet.has(item));
}

function isSimilarTitle(left: string, right: string) {
  const leftWords = new Set(normalizeText(left).split(" ").filter(Boolean));
  const rightWords = normalizeText(right).split(" ").filter(Boolean);

  return rightWords.some((word) => word.length > 3 && leftWords.has(word));
}

export function matchAIFindingsToSuggestions(
  findings: AIFinding[],
  suggestions: AISuggestion[]
): AIFinding[] {
  return findings.map((finding) => {
    if (finding.kind === "observation") {
      return {
        ...finding,
        status: finding.status ?? "new",
        matchedSuggestionId: undefined,
      };
    }

    const matchedSuggestion = suggestions.find((suggestion) => {
      if (finding.targetField && suggestion.targetField !== finding.targetField) {
        return false;
      }

      if (!hasOverlap(finding.affectedRows, suggestion.affectedRows)) {
        return false;
      }

      return (
        suggestion.action === finding.suggestedAction ||
        isSimilarTitle(finding.title, suggestion.title)
      );
    });

    if (!matchedSuggestion) {
      return {
        ...finding,
        status:
          finding.status === "dismissed" ||
            finding.status === "added_to_review_queue"
            ? finding.status
            : "new",
        matchedSuggestionId: undefined,
      };
    }

    return {
      ...finding,
      status: "already_tracked",
      matchedSuggestionId: matchedSuggestion.id,
    };
  });
}
