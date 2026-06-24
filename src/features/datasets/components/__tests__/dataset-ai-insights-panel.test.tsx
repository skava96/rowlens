import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { runProgressiveDatasetAIAnalysis } from "@/features/ai/generateDatasetInsights";
import { browserAIProvider } from "@/features/ai/browserAIClient";
import { DatasetWorkflowState } from "@/features/datasets/types/workflow";
import { DatasetAIInsightsPanel } from "../dataset-ai-insights-panel";

vi.mock("@/features/ai/generateDatasetInsights", () => ({
  runProgressiveDatasetAIAnalysis: vi.fn(() => new Promise(() => {})),
}));

function createReadyState(): DatasetWorkflowState {
  return {
    datasetId: "customer-cleanup",
    fileName: "customer-cleanup-sample.csv",
    status: "ready",
    columns: [{ key: "email", label: "Email" }],
    rows: [
      {
        id: 1,
        values: { email: "valid@example.com" },
        validationState: "valid",
        reviewState: "unreviewed",
      },
    ],
    suggestions: [],
    selectedSuggestionId: null,
    progress: 100,
    error: undefined,
    activity: [],
    profile: null,
    transformations: [],
    auditEvents: [],
  };
}

describe("DatasetAIInsightsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts a new analysis when requested after remounting the same dataset", async () => {
    const props = {
      state: createReadyState(),
      onAddFindingToReviewQueue: vi.fn(),
      onViewSuggestionRows: vi.fn(),
    };

    const firstRender = render(<DatasetAIInsightsPanel {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Run local AI" }));

    await waitFor(() => {
      expect(runProgressiveDatasetAIAnalysis).toHaveBeenCalledTimes(1);
    });
    expect(runProgressiveDatasetAIAnalysis).toHaveBeenLastCalledWith(
      props.state,
      expect.objectContaining({ browserProvider: browserAIProvider })
    );

    firstRender.unmount();

    render(<DatasetAIInsightsPanel {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Run local AI" }));

    await waitFor(() => {
      expect(runProgressiveDatasetAIAnalysis).toHaveBeenCalledTimes(2);
    });
  });
});
