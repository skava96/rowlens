import { DatasetRow, AISuggestion } from "@/types/dataset";

export type DatasetStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "ready"
  | "reviewing"
  | "completed"
  | "failed";

export interface DatasetWorkflowState {
  datasetId: string | null;
  fileName: string | null;
  status: DatasetStatus;

  rows: DatasetRow[];
  suggestions: AISuggestion[];

  activity: {
    id: string;
    time: string;
    label: string;
  }[];

  progress?: number;

  error?: string;
}