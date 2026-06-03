import { DatasetCellValue } from "@/types/dataset";

export interface DatasetTransformationChange {
  rowId: number;
  field: string;
  beforeValue: DatasetCellValue;
  afterValue: DatasetCellValue;
}

export interface DatasetTransformation {
  id: string;
  timestamp: string;
  suggestionId: string;
  suggestionTitle: string;
  affectedRows: number[];
  action: string;
  changes: DatasetTransformationChange[];
  reverted?: boolean;
  revertStatus?: "active" | "reverted" | "partial_conflict";
}