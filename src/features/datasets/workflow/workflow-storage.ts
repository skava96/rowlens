import { DatasetWorkflowState } from "../types/workflow";
import { initialState } from "./workflow-reducer";

const WORKFLOW_STORAGE_VERSION = 1;

type StoredWorkflowState = {
  version: typeof WORKFLOW_STORAGE_VERSION;
  state: DatasetWorkflowState;
};

export const getWorkflowStorageKey = (datasetId: string) =>
  `cleanflow-workflow:${datasetId}`;

export function getInitialWorkflowState(
  routeDatasetId: string
): DatasetWorkflowState {
  return {
    ...initialState,
    datasetId: routeDatasetId,
  };
}

function normalizeRestoredState(
  state: DatasetWorkflowState,
  routeDatasetId: string
): DatasetWorkflowState {
  const isTransient =
    state.status === "uploading" || state.status === "processing";

  return {
    ...state,
    datasetId: routeDatasetId,
    status: isTransient ? "idle" : state.status,
    progress: isTransient ? 0 : state.progress,
  };
}

export function serializeWorkflowState(state: DatasetWorkflowState): string {
  const payload: StoredWorkflowState = {
    version: WORKFLOW_STORAGE_VERSION,
    state,
  };

  return JSON.stringify(payload);
}

export function readStoredWorkflowState(
  routeDatasetId: string
): DatasetWorkflowState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(getWorkflowStorageKey(routeDatasetId));
    if (!stored) return null;

    const parsed = JSON.parse(stored) as StoredWorkflowState;

    if (parsed.version !== WORKFLOW_STORAGE_VERSION || !parsed.state) {
      return null;
    }

    return normalizeRestoredState(parsed.state, routeDatasetId);
  } catch {
    return null;
  }
}