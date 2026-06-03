import { DatasetWorkflowState } from "../types/workflow";

export type WorkflowRepositorySource = "draft-cache" | "server";

export type WorkflowRepositoryResult<T> = {
  data: T | null;
  source: WorkflowRepositorySource;
};

export type WorkflowRepositoryWriteResult = {
  ok: boolean;
  source: WorkflowRepositorySource;
  error?: string;
};

export interface DatasetWorkflowRepository {
  loadDraft(datasetId: string): WorkflowRepositoryResult<DatasetWorkflowState>;
  saveDraft(state: DatasetWorkflowState): WorkflowRepositoryWriteResult;
  clearDraft(datasetId: string): WorkflowRepositoryWriteResult;
}