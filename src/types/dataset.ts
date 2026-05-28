export type DatasetCellValue = string | number | boolean | Date | null;

export type DatasetValidationState = "valid" | "missing" | "invalid";

export interface DatasetColumn {
  key: string;
  label: string;
}

export interface DatasetRow {
  id: number;
  values: Record<string, DatasetCellValue>;
  validationState: DatasetValidationState;
  validationField?: string;
  transformedFields?: string[];
  searchText?: string;
}

export interface AISuggestion {
  id: string;
  type: "validation" | "duplicate" | "missing";
  title: string;
  description: string;
  confidence: number;
  affectedRows: number[];
  severity: "low" | "medium" | "high";
  status: "pending" | "approved" | "rejected";

  action:
    | "fill_missing"
    | "flag_invalid"
    | "remove_duplicate"
    | "standardize_value";

  targetField?: string;
  suggestedValue?: DatasetCellValue;
}