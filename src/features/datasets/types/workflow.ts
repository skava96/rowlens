import { AISuggestion } from "@/types/dataset";
import { DatasetRowView } from "@/features/datasets/adapters/datasetAdapter";

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

  rows: DatasetRowView[];
  suggestions: AISuggestion[];

  activity: DatasetActivity[];

  progress?: number;
  error?: string;
}