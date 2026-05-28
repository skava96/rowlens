"use client";

import { useEffect, useReducer, useRef } from "react";

import { parseDatasetFile } from "../utils/parseDatasetFile";
import { analyzeDataset } from "../utils/analyzeDataset";
import { profileDataset } from "../utils/profileDataset";
import {
  getInitialWorkflowState,
  getWorkflowStorageKey,
  readStoredWorkflowState,
  serializeWorkflowState,
} from "../workflow/workflow-storage";
import { workflowReducer } from "../workflow/workflow-reducer";

function createWorkflowMeta() {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toLocaleTimeString(),
  };
}
export function useDatasetWorkflow(routeDatasetId: string) {
  const [state, dispatch] = useReducer(
    workflowReducer,
    routeDatasetId,
    getInitialWorkflowState
  );

  const activeUploadIdRef = useRef<string | null>(null);
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredStateRef = useRef(false);

  const clearProcessingTimer = () => {
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearProcessingTimer();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state.datasetId) return;
    if (!hasRestoredStateRef.current) return;

    localStorage.setItem(
      getWorkflowStorageKey(state.datasetId),
      serializeWorkflowState(state)
    );
  }, [state]);

  useEffect(() => {
    if (hasRestoredStateRef.current) return;

    const storedState = readStoredWorkflowState(routeDatasetId);
    hasRestoredStateRef.current = true;

    if (storedState) {
      dispatch({
        type: "WORKFLOW_RESTORED",
        state: storedState,
      });
    }
  }, [routeDatasetId]);

  const startUpload = async (file: File) => {
    const datasetId = routeDatasetId;
    const uploadRequestId = crypto.randomUUID();

    activeUploadIdRef.current = uploadRequestId;
    const isUploadActive = (uploadRequestId: string) =>
      activeUploadIdRef.current === uploadRequestId;
    clearProcessingTimer();

    dispatch({
      type: "UPLOAD_STARTED",
      datasetId,
      fileName: file.name,
      meta: createWorkflowMeta(),
    });
    try {
      processingTimerRef.current = setTimeout(() => {
        if (!isUploadActive(uploadRequestId)) return;

        dispatch({
          type: "UPLOAD_PROCESSING",
          datasetId,
          meta: createWorkflowMeta(),
        });
      }, 300);

      await new Promise((resolve) => {
        requestAnimationFrame(() => resolve(null));
      });

      const parsedDataset = await parseDatasetFile(file);

      if (!isUploadActive(uploadRequestId)) return;

      await new Promise((resolve) => setTimeout(resolve, 700));

      const analysis = analyzeDataset(parsedDataset.rows);

      if (!isUploadActive(uploadRequestId)) return;

      const profile = profileDataset(parsedDataset.columns, analysis.rows);

      if (!isUploadActive(uploadRequestId)) return;

      clearProcessingTimer();

      dispatch({
        type: "UPLOAD_COMPLETED",
        datasetId,
        fileName: file.name,
        payload: parsedDataset,
        analysis,
        profile,
        meta: {
          parsed: createWorkflowMeta(),
          ready: createWorkflowMeta(),
        },
      });
    } catch (error) {
      if (!isUploadActive(uploadRequestId)) return;

      clearProcessingTimer();

      dispatch({
        type: "UPLOAD_FAILED",
        error:
          error instanceof Error
            ? error.message
            : "Dataset upload failed. Please try again.",
        meta: createWorkflowMeta(),
      });
    }
  };

  return {
    state,
    startUpload,
    reviewSuggestion: (id: string) =>
      dispatch({ type: "SELECT_SUGGESTION", suggestionId: id, meta: createWorkflowMeta() }),
    approveSuggestion: (id: string) =>
      dispatch({ type: "SUGGESTION_APPROVED", suggestionId: id, meta: createWorkflowMeta() }),
    rejectSuggestion: (id: string) =>
      dispatch({ type: "SUGGESTION_REJECTED", suggestionId: id, meta: createWorkflowMeta() }),
    clearSelectedSuggestion: () =>
      dispatch({ type: "SELECT_SUGGESTION", suggestionId: null, meta: createWorkflowMeta() }),
    updateCellValue: (rowId: number, field: string, value: string) =>
      dispatch({ type: "CELL_UPDATED", rowId, field, value, meta: createWorkflowMeta() }),
    undoTransformation: (id: string) =>
      dispatch({ type: "TRANSFORMATION_UNDONE", transformationId: id, meta: createWorkflowMeta() }),
    bulkMarkRowsValid: (rowIds: number[]) =>
      dispatch({ type: "ROWS_BULK_MARKED_VALID", rowIds, meta: createWorkflowMeta() }),
  };
}