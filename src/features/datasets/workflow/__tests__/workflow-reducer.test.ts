import { describe, expect, it } from "vitest";

import {
  initialState,
  workflowReducer,
  type WorkflowAction,
} from "../workflow-reducer";
import { DatasetWorkflowState } from "../../types/workflow";

const meta = {
  id: "event-1",
  timestamp: "10:00 AM",
};

function createReadyState(): DatasetWorkflowState {
  return {
    ...initialState,
    datasetId: "customer-cleanup",
    fileName: "customers.csv",
    status: "ready",
    columns: [{ key: "email", label: "Email" }],
    rows: [
      {
        id: 1,
        values: { email: "bad-email" },
        validationState: "invalid",
        validationField: "email",
      },
    ],
    suggestions: [
      {
        id: "suggestion-1",
        type: "validation",
        title: "Fix invalid email",
        description: "Correct malformed email values.",
        confidence: 0.95,
        affectedRows: [1],
        severity: "high",
        status: "pending",
        action: "standardize_value",
        targetField: "email",
        suggestedValue: "valid@example.com",
      },
    ],
    selectedSuggestionId: null,
    progress: 100,
    error: undefined,
    activity: [],
    profile: null,
    transformations: [],
  };
}

describe("workflowReducer", () => {
  it("ignores processing events for stale dataset ids", () => {
    const state = {
      ...initialState,
      datasetId: "customer-cleanup",
      status: "uploading" as const,
    };

    const next = workflowReducer(state, {
      type: "UPLOAD_PROCESSING",
      datasetId: "sales-audit",
      meta,
    });

    expect(next).toBe(state);
  });

  it("approves a pending suggestion once and creates an audit transformation", () => {
    const state = createReadyState();

    const next = workflowReducer(state, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "suggestion-1",
      meta,
    });

    expect(next.suggestions[0].status).toBe("approved");
    expect(next.rows[0].values.email).toBe("valid@example.com");
    expect(next.transformations).toHaveLength(1);
    expect(next.transformations[0]).toMatchObject({
      id: "event-1",
      timestamp: "10:00 AM",
      suggestionId: "suggestion-1",
    });
  });

  it("does not approve an already approved suggestion again", () => {
    const approvedState = workflowReducer(createReadyState(), {
      type: "SUGGESTION_APPROVED",
      suggestionId: "suggestion-1",
      meta,
    });

    const next = workflowReducer(approvedState, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "suggestion-1",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(next).toBe(approvedState);
    expect(next.transformations).toHaveLength(1);
  });

  it("does not approve a ignored suggestion", () => {
    const ignoredState = workflowReducer(createReadyState(), {
      type: "SUGGESTION_IGNORED",
      suggestionId: "suggestion-1",
      meta,
    });

    const next = workflowReducer(ignoredState, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "suggestion-1",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(next).toBe(ignoredState);
    expect(next.transformations).toHaveLength(0);
  });

  it("records manual edits as deterministic transformations", () => {
    const next = workflowReducer(createReadyState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "edited@example.com",
      meta,
    });

    expect(next.rows[0].values.email).toBe("edited@example.com");
    expect(next.transformations[0]).toMatchObject({
      id: "event-1",
      timestamp: "10:00 AM",
      suggestionId: "manual-edit",
      action: "manual_edit",
    });
  });

  it("restores workflow state directly", () => {
    const restored: DatasetWorkflowState = {
      ...createReadyState(),
      status: "completed",
    };

    const action: WorkflowAction = {
      type: "WORKFLOW_RESTORED",
      state: restored,
    };

    expect(workflowReducer(initialState, action)).toBe(restored);
  });
});