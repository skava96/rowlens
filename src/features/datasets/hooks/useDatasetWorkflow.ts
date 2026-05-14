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
    progress: 0,
  });

  const startUpload = (fileName: string) => {
    const id = crypto.randomUUID();

    setState({
      datasetId: id,
      fileName,
      status: "uploading",
      rows: [],
      suggestions: [],
      activity: [
        {
          time: new Date().toLocaleTimeString(),
          label: `Uploading ${fileName}`,
        },
      ],
      progress: 10,
    });
  };

  const setProgress = (progress: number) => {
    setState((prev) => ({
      ...prev,
      progress,
    }));
  };

  const completeUpload = () => {
    setState((prev) => ({
      ...prev,
      status: "ready",
      rows: loadMockDataset(),
      progress: 100,
      suggestions: mockSuggestions,
      activity: [
        ...prev.activity,
        {
          time: new Date().toLocaleTimeString(),
          label: "Upload completed",
        },
      ],
    }));
  };

  return {
    state,
    startUpload,
    setProgress,
    completeUpload,
  };
}