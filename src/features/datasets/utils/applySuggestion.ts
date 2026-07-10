import {
  AISuggestion,
  DatasetCellValue,
  DatasetRow,
} from "@/types/dataset";
import { DatasetTransformationChange } from "../types/transformation";
import { getRowValidationState } from "./getRowValidationState";
import { rowHasSuggestionIssue } from "./validateDatasetRow";

type SuggestionWithSuggestedValue = AISuggestion & {
  targetField: string;
  suggestedValue: DatasetCellValue;
};

function hasSafeSuggestedValue(
  suggestion: AISuggestion
): suggestion is SuggestionWithSuggestedValue {
  const value = suggestion.suggestedValue;

  return (
    suggestion.targetField !== undefined &&
    value !== undefined &&
    value !== null &&
    String(value).trim() !== "" &&
    String(value).trim().toLowerCase() !== "unknown"
  );
}

function canApplySuggestedValueToRow(row: DatasetRow, suggestion: AISuggestion) {
  if (!suggestion.targetField) return false;

  if (row.values[suggestion.targetField] === suggestion.suggestedValue) {
    return false;
  }

  return rowHasSuggestionIssue(row.values, suggestion);
}

function updateRowValue(
  row: DatasetRow,
  field: string,
  value: DatasetCellValue
): DatasetRow {
  const nextValues = {
    ...row.values,
    [field]: value,
  };

  return {
    ...row,
    values: nextValues,
    ...getRowValidationState(nextValues),
    transformedFields: Array.from(
      new Set([...(row.transformedFields ?? []), field])
    ),
    correctedFields: Array.from(new Set([...(row.correctedFields ?? []), field])),
    manualEditedFields: row.manualEditedFields?.filter(
      (manualField) => manualField !== field
    ),
  };
}

function markRowReviewed(row: DatasetRow): DatasetRow {
  return {
    ...row,
    reviewState: "reviewed",
  };
}

export function applySuggestionToRows({
  rows,
  suggestion,
}: {
  rows: DatasetRow[];
  suggestion: AISuggestion;
}): {
  rows: DatasetRow[];
  changes: DatasetTransformationChange[];
} {
  const changes: DatasetTransformationChange[] = [];

  switch (suggestion.action) {
    case "fill_missing":
    case "standardize_value": {
      if (!hasSafeSuggestedValue(suggestion)) {
        return {
          rows,
          changes,
        };
      }

      const targetField = suggestion.targetField;
      const suggestedValue = suggestion.suggestedValue;

      const updatedRows = rows.map((row): DatasetRow => {
        if (!suggestion.affectedRows.includes(row.id)) return row;
        if (!canApplySuggestedValueToRow(row, suggestion)) return row;

        const beforeValue = row.values[targetField];
        const afterValue = suggestedValue;

        changes.push({
          rowId: row.id,
          field: targetField,
          beforeValue,
          afterValue,
        });

        return updateRowValue(row, targetField, afterValue);
      });

      return {
        rows: updatedRows,
        changes,
      };
    }

    case "flag_invalid": {
      const updatedRows = rows.map((row): DatasetRow => {
        if (!suggestion.affectedRows.includes(row.id)) {
          return row;
        }

        return markRowReviewed(row);
      });

      return {
        rows: updatedRows,
        changes: [],
      };
    }

    default:
      return {
        rows,
        changes,
      };
  }
}
