import { AISuggestion, DatasetColumn, DatasetRow } from "@/types/dataset";

import { DatasetProfile } from "@/features/datasets/utils/profileDataset";

import { DatasetTransformation } from "./transformation";

import { DatasetAuditEvent } from "./audit-event";
export type DatasetStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "ready"
  | "reviewing"
  | "completed"
  | "failed";

export interface DatasetActivity {
  id: string;
  time: string;
  label: string;
}

export interface DatasetWorkflowState {
  datasetId: string | null;
  fileName: string | null;
  status: DatasetStatus;

  columns: DatasetColumn[];
  rows: DatasetRow[];
  suggestions: AISuggestion[];
  transformations: DatasetTransformation[];
  selectedSuggestionId: string | null;

  activity: DatasetActivity[];

  progress?: number;
  error?: string;

  profile: DatasetProfile | null;
  auditEvents: DatasetAuditEvent[];
}