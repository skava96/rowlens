import { DatasetWorkflowState } from "../types/workflow";
import {
  getWorkflowStorageKey,
  readStoredWorkflowState,
  serializeWorkflowState,
} from "./workflow-storage";
import {
  DatasetWorkflowRepository,
  WorkflowRepositoryResult,
  WorkflowRepositoryWriteResult,
} from "./workflow-repository";

function getRepositoryErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "Draft cache is full. Some workflow changes may not be recoverable after refresh.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Draft cache operation failed.";
}

export const localWorkflowRepository: DatasetWorkflowRepository = {
  loadDraft(datasetId): WorkflowRepositoryResult<DatasetWorkflowState> {
    return {
      data: readStoredWorkflowState(datasetId),
      source: "draft-cache",
    };
  },

  saveDraft(state): WorkflowRepositoryWriteResult {
    if (!state.datasetId) {
      return {
        ok: false,
        source: "draft-cache",
        error: "Cannot save draft without a dataset id.",
      };
    }

    try {
      localStorage.setItem(
        getWorkflowStorageKey(state.datasetId),
        serializeWorkflowState(state)
      );

      return {
        ok: true,
        source: "draft-cache",
      };
    } catch (error) {
      return {
        ok: false,
        source: "draft-cache",
        error: getRepositoryErrorMessage(error),
      };
    }
  },

  clearDraft(datasetId): WorkflowRepositoryWriteResult {
    try {
      localStorage.removeItem(getWorkflowStorageKey(datasetId));

      return {
        ok: true,
        source: "draft-cache",
      };
    } catch (error) {
      return {
        ok: false,
        source: "draft-cache",
        error: getRepositoryErrorMessage(error),
      };
    }
  },
};