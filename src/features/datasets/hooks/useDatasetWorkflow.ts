"use client";

import { useEffect, useReducer, useRef } from "react";

import { workerDatasetParser } from "../parsing/worker-dataset-parser";
import { analyzeDataset } from "../utils/analyzeDataset";
import { profileDataset } from "../utils/profileDataset";
import { getInitialWorkflowState } from "../workflow/workflow-storage";
import { localWorkflowRepository } from "../workflow/local-workflow-repository";
import { workflowReducer } from "../workflow/workflow-reducer";
import { AIFinding } from "@/features/ai/types";

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
  const persistenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredStateRef = useRef(false);

  const clearProcessingTimer = () => {
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
  };

  const clearPersistenceTimer = () => {
    if (persistenceTimerRef.current) {
      clearTimeout(persistenceTimerRef.current);
      persistenceTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearProcessingTimer();
      clearPersistenceTimer();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state.datasetId) return;
    if (!hasRestoredStateRef.current) return;

    clearPersistenceTimer();

    persistenceTimerRef.current = setTimeout(() => {
      const result = localWorkflowRepository.saveDraft(state);

      if (!result.ok) {
        console.warn(
          "CleanFlow draft persistence failed",
          result
        );
      }
    }, 500);

    return () => {
      clearPersistenceTimer();
    };
  }, [state]);

  useEffect(() => {
    if (hasRestoredStateRef.current) return;

    const result = localWorkflowRepository.loadDraft(routeDatasetId);
    hasRestoredStateRef.current = true;

    if (result.data) {
      dispatch({
        type: "WORKFLOW_RESTORED",
        state: result.data,
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

      const parsedDataset = await workerDatasetParser.parse(file);

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
      dispatch({ type: "SUGGESTION_IGNORED", suggestionId: id, meta: createWorkflowMeta() }),
    clearSelectedSuggestion: () =>
      dispatch({ type: "SELECT_SUGGESTION", suggestionId: null, meta: createWorkflowMeta() }),
    updateCellValue: (rowId: number, field: string, value: string) =>
      dispatch({ type: "CELL_UPDATED", rowId, field, value, meta: createWorkflowMeta() }),
    undoTransformation: (id: string) =>
      dispatch({ type: "TRANSFORMATION_UNDONE", transformationId: id, meta: createWorkflowMeta() }),
    bulkMarkRowsValid: (rowIds: number[]) =>
      dispatch({ type: "ROWS_BULK_MARKED_VALID", rowIds, meta: createWorkflowMeta() }),
    addAIFindingToReviewQueue: (finding: AIFinding) =>
      dispatch({ type: "AI_FINDING_ADDED_TO_REVIEW_QUEUE", finding, meta: createWorkflowMeta() }),
  };
}
