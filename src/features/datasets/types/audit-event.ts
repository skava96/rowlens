import { DatasetCellValue } from "@/types/dataset";

export type DatasetAuditEventSource =
  | "ai-suggestion"
  | "manual-edit"
  | "bulk-review"
  | "undo"
  | "system";

export type DatasetAuditEvent = {
  id: string;
  timestamp: string;
  source: DatasetAuditEventSource;
  actor: "local-user";
  operation: string;
  rowIds: number[];
  fieldChanges?: {
    rowId: number;
    field: string;
    beforeValue: DatasetCellValue;
    afterValue: DatasetCellValue;
  }[];
  status: "applied" | "reverted" | "partial_conflict" | "ignored";
};