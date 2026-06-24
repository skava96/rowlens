import { AISuggestion, DatasetRow } from "@/types/dataset";
import {
  getValidationIssueKey,
  validateDatasetRow,
} from "./validateDatasetRow";

type SuggestionBucket = {
  type: AISuggestion["type"];
  title: string;
  description: string;
  confidence: number;
  severity: AISuggestion["severity"];
  affectedRows: number[];
  action: AISuggestion["action"];
  targetField: string;
  suggestedValue: AISuggestion["suggestedValue"];
};

function createSuggestionId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function analyzeDataset(rows: DatasetRow[]) {
  const suggestionBuckets = new Map<string, SuggestionBucket>();

  const addSuggestion = (key: string, suggestion: SuggestionBucket) => {
    const existing = suggestionBuckets.get(key);

    if (existing) {
      existing.affectedRows.push(...suggestion.affectedRows);
      return;
    }

    suggestionBuckets.set(key, suggestion);
  };

  const analyzedRows: DatasetRow[] = rows.map((row) => {
    const validation = validateDatasetRow(row.values);
    const primaryIssue = validation.issues[0];

    if (primaryIssue) {
      addSuggestion(getValidationIssueKey(primaryIssue), {
        type: primaryIssue.type,
        title: primaryIssue.title,
        description: primaryIssue.description,
        confidence: primaryIssue.confidence,
        affectedRows: [row.id],
        severity: primaryIssue.severity,
        action: primaryIssue.action,
        targetField: primaryIssue.field,
        suggestedValue: primaryIssue.suggestedValue,
      });
    }

    return {
      ...row,
      validationState: validation.validationState,
      validationField: validation.validationField,
    };
  });

  const suggestions: AISuggestion[] = Array.from(suggestionBuckets.values()).map(
    (suggestion) => ({
      id: createSuggestionId(suggestion.title),
      ...suggestion,
      status: "pending",
    })
  );

  return {
    rows: analyzedRows,
    suggestions,
  };
}
