import { AISuggestion } from "@/types/dataset";

const statusRank: Record<AISuggestion["status"], number> = {
  pending: 0,
  resolved: 1,
  approved: 2,
  ignored: 3,
};

const severityRank: Record<AISuggestion["severity"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function sortReviewSuggestions(suggestions: AISuggestion[]) {
  return [...suggestions].sort((first, second) => {
    const statusDelta = statusRank[first.status] - statusRank[second.status];
    if (statusDelta !== 0) return statusDelta;

    const severityDelta =
      severityRank[first.severity] - severityRank[second.severity];
    if (severityDelta !== 0) return severityDelta;

    const affectedRowsDelta =
      second.affectedRows.length - first.affectedRows.length;
    if (affectedRowsDelta !== 0) return affectedRowsDelta;

    const confidenceDelta = second.confidence - first.confidence;
    if (confidenceDelta !== 0) return confidenceDelta;

    return first.id.localeCompare(second.id);
  });
}
