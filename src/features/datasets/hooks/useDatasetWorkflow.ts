"use client";

import { useEffect, useRef, useState } from "react";

import { DatasetWorkflowState } from "../types/workflow";
import { parseDatasetFile } from "../utils/parseDatasetFile";
import { analyzeDataset } from "../utils/analyzeDataset";
import { profileDataset } from "../utils/profileDataset";
import { applySuggestionToRows } from "../utils/applySuggestion";


function createActivity(label: string) {
  return {
    id: crypto.randomUUID(),
    time: new Date().toLocaleTimeString(),
    label,
  };
}

export function useDatasetWorkflow() {
  const [state, setState] = useState<DatasetWorkflowState>({
    datasetId: null,
    fileName: null,
    status: "idle",
    columns: [],
    rows: [],
    suggestions: [],
    selectedSuggestionId: null,
    activity: [],
    profile: null,
    transformations: [],
  });

  const activeUploadIdRef = useRef<string | null>(null);
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const startUpload = async (file: File) => {
    const datasetId = crypto.randomUUID();

    activeUploadIdRef.current = datasetId;
    clearProcessingTimer();

    setState({
      datasetId,
      fileName: file.name,
      status: "uploading",
      columns: [],
      rows: [],
      suggestions: [],
      selectedSuggestionId: null,
      progress: 15,
      error: undefined,
      activity: [createActivity(`Uploading ${file.name}`)],
      profile: null,
      transformations: [],
    });

    try {
      processingTimerRef.current = setTimeout(() => {
        setState((prev) => {
          if (prev.datasetId !== datasetId || prev.status !== "uploading") {
            return prev;
          }

          return {
            ...prev,
            status: "processing",
            progress: 55,
            activity: [
              ...prev.activity,
              createActivity("Processing dataset"),
            ],
          };
        });
      }, 300);

      const parsedDataset = await parseDatasetFile(file);

      await new Promise((resolve) => setTimeout(resolve, 700));

      const analysis = analyzeDataset(parsedDataset.rows);
      const profile = profileDataset(parsedDataset.columns, analysis.rows);

      if (activeUploadIdRef.current !== datasetId) return;

      clearProcessingTimer();

      setState((prev) => ({
        ...prev,
        datasetId,
        fileName: file.name,
        status: "ready",
        columns: parsedDataset.columns,
        rows: analysis.rows,
        suggestions: analysis.suggestions,
        selectedSuggestionId: null,
        progress: 100,
        error: undefined,
        activity: [
          ...prev.activity,
          createActivity(
            `Parsed ${parsedDataset.rows.length} rows and ${parsedDataset.columns.length} columns`
          ),
          createActivity("Dataset ready for review"),
        ],
        profile,
      }));
    } catch (error) {
      if (activeUploadIdRef.current !== datasetId) return;

      clearProcessingTimer();

      setState((prev) => ({
        ...prev,
        status: "failed",
        columns: [],
        rows: [],
        suggestions: [],
        selectedSuggestionId: null,
        progress: 0,
        error:
          error instanceof Error
            ? error.message
            : "Dataset upload failed. Please try again.",
        activity: [...prev.activity, createActivity("Dataset upload failed")],
        profile: null,
      }));
    }
  };

  const reviewSuggestion = (id: string) => {
    setState((prev) => {
      const suggestion = prev.suggestions.find((item) => item.id === id);
      const isSameSuggestion = prev.selectedSuggestionId === id;

      return {
        ...prev,
        status: isSameSuggestion ? prev.status : "reviewing",
        selectedSuggestionId: isSameSuggestion ? null : id,
        activity:
          suggestion && !isSameSuggestion
            ? [
              ...prev.activity,
              createActivity(`Reviewing: ${suggestion.title}`),
            ]
            : prev.activity,
      };
    });
  };

  const approveSuggestion = (id: string) => {
    setState((prev) => {
      const suggestion = prev.suggestions.find((item) => item.id === id);

      if (!suggestion) {
        return prev;
      }

      const result = applySuggestionToRows({
        rows: prev.rows,
        suggestion,
      });

      const updatedSuggestions = prev.suggestions.map((item) =>
        item.id === id ? { ...item, status: "approved" as const } : item
      );

      const allResolved = updatedSuggestions.every(
        (item) => item.status !== "pending"
      );

      return {
        ...prev,
        rows: result.rows,
        status: allResolved ? "completed" : prev.status,
        suggestions: updatedSuggestions,
        selectedSuggestionId:
          prev.selectedSuggestionId === id ? null : prev.selectedSuggestionId,
        activity: [
          ...prev.activity,
          createActivity(`Applied: ${suggestion.title}`),
        ],
        transformations: [
          ...prev.transformations,
          {
            id: crypto.randomUUID(),
            timestamp: new Date().toLocaleTimeString(),
            suggestionId: suggestion.id,
            suggestionTitle: suggestion.title,
            affectedRows: suggestion.affectedRows,
            action: suggestion.action,
            changes: result.changes,
          },
        ],
      };
    });
  };

  const rejectSuggestion = (id: string) => {
    setState((prev) => {
      const suggestion = prev.suggestions.find((item) => item.id === id);

      return {
        ...prev,
        suggestions: prev.suggestions.map((item) =>
          item.id === id ? { ...item, status: "rejected" } : item
        ),
        selectedSuggestionId:
          prev.selectedSuggestionId === id ? null : prev.selectedSuggestionId,
        activity: [
          ...prev.activity,
          createActivity(
            suggestion ? `Rejected: ${suggestion.title}` : "Suggestion rejected"
          ),
        ],
      };
    });
  };

  const clearSelectedSuggestion = () => {
    setState((prev) => ({
      ...prev,
      selectedSuggestionId: null,
    }));
  };

  const updateCellValue = (
    rowId: number,
    field: string,
    value: string
  ) => {
    setState((prev) => {
      const rowToUpdate = prev.rows.find((row) => row.id === rowId);
      const beforeValue = rowToUpdate?.values[field] ?? null;

      const updatedRows = prev.rows.map((row) => {
        if (row.id !== rowId) return row;

        return {
          ...row,
          values: {
            ...row.values,
            [field]: value,
          },
          validationState: "valid" as const,
          validationField: undefined,
          transformedFields: [
            ...(row.transformedFields ?? []),
            field,

          ],
        };
      });

      return {
        ...prev,
        rows: updatedRows,
        activity: [
          ...prev.activity,
          createActivity(`Manually updated row #${rowId}`),
        ],
        transformations: [
          ...prev.transformations,
          {
            id: crypto.randomUUID(),
            timestamp: new Date().toLocaleTimeString(),
            suggestionId: "manual-edit",
            suggestionTitle: `Manual edit on row #${rowId}`,
            affectedRows: [rowId],
            action: "manual_edit",
            changes: [
              {
                rowId,
                field,
                beforeValue,
                afterValue: value,
              },
            ],
          },
        ],
      };
    });
  };

  const undoTransformation = (id: string) => {
    setState((prev) => {
      const transformation = prev.transformations.find(
        (item) => item.id === id
      );

      if (!transformation || transformation.reverted) {
        return prev;
      }

      const updatedRows = prev.rows.map((row) => {
        const rowChanges = transformation.changes.filter(
          (change) => change.rowId === row.id
        );

        if (!rowChanges.length) return row;

        const revertedValues = rowChanges.reduce(
          (acc, change) => ({
            ...acc,
            [change.field]: change.beforeValue,
          }),
          row.values
        );

        const revertedFields = new Set(
          rowChanges.map((change) => change.field)
        );

        return {
          ...row,
          values: revertedValues,
          transformedFields: row.transformedFields?.filter(
            (field) => !revertedFields.has(field)
          ),
        };
      });

      return {
        ...prev,
        rows: updatedRows,
        status: "reviewing",
        suggestions: prev.suggestions.map((suggestion) =>
          suggestion.id === transformation.suggestionId
            ? { ...suggestion, status: "pending" as const }
            : suggestion
        ),
        transformations: prev.transformations.map((item) =>
          item.id === id ? { ...item, reverted: true } : item
        ),
        activity: [
          ...prev.activity,
          createActivity(`Reverted: ${transformation.suggestionTitle}`),
        ],
      };
    });
  };

  const bulkMarkRowsValid = (rowIds: number[]) => {
    setState((prev) => {
      const updatedRows = prev.rows.map((row) => {
        if (!rowIds.includes(row.id)) {
          return row;
        }

        return {
          ...row,
          validationState: "valid" as const,
          validationField: undefined,
          transformedFields: [
            ...(row.transformedFields ?? []),
            "__bulk_review__",
          ],
        };
      });

      return {
        ...prev,
        rows: updatedRows,
        activity: [
          ...prev.activity,
          createActivity(
            `Bulk reviewed ${rowIds.length} dataset rows`
          ),
        ],
      };
    });
  };

  return {
    state,
    startUpload,
    reviewSuggestion,
    approveSuggestion,
    rejectSuggestion,
    clearSelectedSuggestion,
    updateCellValue,
    undoTransformation,
    bulkMarkRowsValid,
  };
}