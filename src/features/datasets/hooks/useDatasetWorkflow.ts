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

    // Simulate processing transition
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

  return {
    state,
    startUpload,
    setProgress,
    completeUpload,
  };
}