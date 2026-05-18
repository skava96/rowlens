import {
  AISuggestion,
  DatasetCellValue,
  DatasetRow,
} from "@/types/dataset";
import { DatasetTransformationChange } from "../types/transformation";

function updateRowValue(
  row: DatasetRow,
  field: string,
  value: DatasetCellValue
): DatasetRow {
  return {
    ...row,
    values: {
      ...row.values,
      [field]: value,
    },
    validationState: "valid",
    validationField: undefined,
    transformedFields: [...(row.transformedFields ?? []), field],
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
    case "fill_missing": {
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
        if (!suggestion.affectedRows.includes(row.id)) return row;
        if (!suggestion.targetField) return row;

        const beforeValue = row.values[suggestion.targetField];

        changes.push({
          rowId: row.id,
          field: suggestion.targetField,
          beforeValue,
          afterValue: beforeValue,
        });

        return {
          ...row,
          validationState: "valid",
          validationField: undefined,
          transformedFields: [
            ...(row.transformedFields ?? []),
            suggestion.targetField,
          ],
        };
      });

      return {
        rows: updatedRows,
        changes,
      };
    }

    default:
      return {
        rows,
        changes,
      };
  }
}