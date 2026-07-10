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

function createSuggestionId(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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

    validation.issues.forEach((issue) => {
      addSuggestion(getValidationIssueKey(issue), {
        type: issue.type,
        title: issue.title,
        description: issue.description,
        confidence: issue.confidence,
        affectedRows: [row.id],
        severity: issue.severity,
        action: issue.action,
        targetField: issue.field,
        suggestedValue: issue.suggestedValue,
      });
    });

    return {
      ...row,
      validationState: validation.validationState,
      validationField: validation.validationField,
    };
  });

  const suggestions: AISuggestion[] = Array.from(suggestionBuckets.entries()).map(
    ([key, suggestion]) => ({
      id: createSuggestionId(key),
      ...suggestion,
      status: "pending",
    })
  );

  return {
    rows: analyzedRows,
    suggestions,
  };
}
