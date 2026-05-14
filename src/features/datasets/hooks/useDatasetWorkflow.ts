"use client";

import { useState } from "react";

import { DatasetWorkflowState } from "../types/workflow";
import { loadMockDataset } from "../adapters/datasetAdapter";

import { mockSuggestions } from "@/mock/mockSuggestions";

export function useDatasetWorkflow() {
  const [state, setState] = useState<DatasetWorkflowState>({
    datasetId: null,
    fileName: null,
    status: "idle",
    rows: [],
    suggestions: [],
    selectedSuggestionId: null,
    activity: [],
  });

  const startUpload = (fileName: string) => {
    const datasetId = crypto.randomUUID();

    setState((prev) => ({
      ...prev,
      datasetId,
      fileName,
      status: "uploading",
      rows: [],
      suggestions: [],
      selectedSuggestionId: null,
      progress: 0,
      error: undefined,
      activity: [
        {
          id: crypto.randomUUID(),
          time: new Date().toLocaleTimeString(),
          label: `Uploading ${fileName}`,
        },
      ],
    }));
  };

  const setProgress = (progress: number) => {
    setState((prev) => ({
      ...prev,
      progress,
    }));

    if (progress >= 100) {
      setState((prev) => ({
        ...prev,
        status: "processing",
        activity: [
          ...prev.activity,
          {
            id: crypto.randomUUID(),
            time: new Date().toLocaleTimeString(),
            label: "Processing dataset",
          },
        ],
      }));
    }
  };

  const completeUpload = () => {
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        status: "ready",
        rows: loadMockDataset(),
        suggestions: mockSuggestions,
        selectedSuggestionId: null,
        progress: 100,
        activity: [
          ...prev.activity,
          {
            id: crypto.randomUUID(),
            time: new Date().toLocaleTimeString(),
            label: "Dataset ready for review",
          },
        ],
      }));
    }, 1200);
  };

  const reviewSuggestion = (id: string) => {
    const suggestion = state.suggestions.find((item) => item.id === id);

    setState((prev) => ({
      ...prev,
      status: "reviewing",
      selectedSuggestionId: prev.selectedSuggestionId === id ? null : id,
      activity: suggestion
        ? [
          ...prev.activity,
          {
            id: crypto.randomUUID(),
            time: new Date().toLocaleTimeString(),
            label: `Reviewing: ${suggestion.title}`,
          },
        ]
        : prev.activity,
    }));
  };

  const approveSuggestion = (id: string) => {
    setState((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map((suggestion) =>
        suggestion.id === id
          ? { ...suggestion, status: "approved" }
          : suggestion
      ),
      selectedSuggestionId:
        prev.selectedSuggestionId === id ? null : prev.selectedSuggestionId,
      activity: [
        ...prev.activity,
        {
          id: crypto.randomUUID(),
          time: new Date().toLocaleTimeString(),
          label: "Suggestion approved",
        },
      ],
    }));
  };

  const rejectSuggestion = (id: string) => {
    setState((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map((suggestion) =>
        suggestion.id === id
          ? { ...suggestion, status: "rejected" }
          : suggestion
      ),
      selectedSuggestionId:
        prev.selectedSuggestionId === id ? null : prev.selectedSuggestionId,
      activity: [
        ...prev.activity,
        {
          id: crypto.randomUUID(),
          time: new Date().toLocaleTimeString(),
          label: "Suggestion rejected",
        },
      ],
    }));
  };

  return {
    state,
    startUpload,
    setProgress,
    completeUpload,
    reviewSuggestion,
    approveSuggestion,
    rejectSuggestion
  };
}