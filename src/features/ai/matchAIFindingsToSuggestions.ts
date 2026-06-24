import { AISuggestion } from "@/types/dataset";

import { AIFinding } from "./types";

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hasOverlap(left: number[] = [], right: number[] = []) {
  const rightSet = new Set(right);
  return left.some((item) => rightSet.has(item));
}

function hasSimilarMeaning(left: string, right: string) {
  const leftText = normalizeText(left);
  const rightText = normalizeText(right);

  if (leftText.includes(rightText) || rightText.includes(leftText)) {
    return true;
  }

  const deterministicGroups = [
    ["email", "invalid email", "email format"],
    ["missing", "blank", "required"],
    ["duplicate", "duplicated"],
    ["country", "normalization", "standardize"],
    ["status", "account status", "enum"],
    ["date", "signup date"],
  ];

  return deterministicGroups.some((group) => {
    const leftMatches = group.some((word) => leftText.includes(word));
    const rightMatches = group.some((word) => rightText.includes(word));

    return leftMatches && rightMatches;
  });
}

export function matchAIFindingsToSuggestions(
  findings: AIFinding[],
  suggestions: AISuggestion[]
): AIFinding[] {
  return findings.map((finding) => {
    const matchedSuggestion = suggestions.find((suggestion) => {
      const rowOverlap = hasOverlap(
        finding.affectedRows,
        suggestion.affectedRows
      );

      if (!rowOverlap) return false;

      const sameField =
        finding.targetField && suggestion.targetField
          ? finding.targetField === suggestion.targetField
          : true;

      if (!sameField) return false;

      return hasSimilarMeaning(
        `${finding.title} ${finding.description}`,
        `${suggestion.title} ${suggestion.description}`
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