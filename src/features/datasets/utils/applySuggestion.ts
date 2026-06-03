import {
  AISuggestion,
  DatasetCellValue,
  DatasetRow,
} from "@/types/dataset";
import { DatasetTransformationChange } from "../types/transformation";
import { getRowValidationState } from "./getRowValidationState";

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
      const updatedRows = rows.map((row): DatasetRow => {
        if (!suggestion.affectedRows.includes(row.id)) return row;
        if (!suggestion.targetField) return row;

        const beforeValue = row.values[suggestion.targetField];
        const afterValue = suggestion.suggestedValue ?? "Unknown";

        changes.push({
          rowId: row.id,
          field: suggestion.targetField,
          beforeValue,
          afterValue,
        });

        return updateRowValue(row, suggestion.targetField, afterValue);
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