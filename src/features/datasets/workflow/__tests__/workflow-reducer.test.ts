import { describe, expect, it } from "vitest";

import {
  initialState,
  workflowReducer,
  type WorkflowAction,
} from "../workflow-reducer";
import { DatasetWorkflowState } from "../../types/workflow";
import { AIFinding } from "@/features/ai/types";

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

function createCountryState(): DatasetWorkflowState {
  return {
    ...initialState,
    datasetId: "customer-cleanup",
    fileName: "customers.csv",
    status: "ready",
    columns: [{ key: "country", label: "Country" }],
    rows: [
      {
        id: 1,
        values: { country: "usa" },
        validationState: "invalid",
        validationField: "country",
      },
    ],
    suggestions: [
      {
        id: "standardize-country-value",
        type: "validation",
        title: "Standardize country value",
        description: "Normalize country values.",
        confidence: 94,
        affectedRows: [1],
        severity: "low",
        status: "pending",
        action: "standardize_value",
        targetField: "country",
        suggestedValue: "United States",
      },
    ],
    selectedSuggestionId: null,
    progress: 100,
    error: undefined,
    activity: [],
    profile: null,
    transformations: [],
    auditEvents: [],
  };
}

function createDateState(): DatasetWorkflowState {
  return {
    ...initialState,
    datasetId: "customer-cleanup",
    fileName: "customers.csv",
    status: "ready",
    columns: [{ key: "signup_date", label: "Signup Date" }],
    rows: [
      {
        id: 1,
        values: { signup_date: "not-a-date" },
        validationState: "invalid",
        validationField: "signup_date",
      },
    ],
    suggestions: [
      {
        id: "invalid-date-format",
        type: "validation",
        title: "Invalid date format",
        description: "Review invalid dates.",
        confidence: 92,
        affectedRows: [1],
        severity: "medium",
        status: "pending",
        action: "flag_invalid",
        targetField: "signup_date",
        suggestedValue: null,
      },
    ],
    selectedSuggestionId: null,
    progress: 100,
    error: undefined,
    activity: [],
    profile: null,
    transformations: [],
    auditEvents: [],
  };
}

function createAccountStatusState(): DatasetWorkflowState {
  return {
    ...initialState,
    datasetId: "customer-cleanup",
    fileName: "customers.csv",
    status: "ready",
    columns: [{ key: "account_status", label: "Account Status" }],
    rows: [
      {
        id: 1,
        values: { account_status: "active" },
        validationState: "invalid",
        validationField: "account_status",
      },
    ],
    suggestions: [
      {
        id: "standardize-account-status",
        type: "validation",
        title: "Standardize account status",
        description: "Normalize account statuses.",
        confidence: 93,
        affectedRows: [1],
        severity: "low",
        status: "pending",
        action: "standardize_value",
        targetField: "account_status",
        suggestedValue: "Active",
      },
    ],
    selectedSuggestionId: null,
    progress: 100,
    error: undefined,
    activity: [],
    profile: null,
    transformations: [],
    auditEvents: [],
  };
}

function createAIFinding(overrides: Partial<AIFinding> = {}): AIFinding {
  return {
    id: "ai-name-missing-1",
    title: "Review suspicious full name",
    description: "AI found a possible name quality issue.",
    reasoning: "The provided sample row has an empty-looking name field.",
    confidence: 0.82,
    severity: "medium",
    targetField: "full_name",
    affectedRows: [1],
    suggestedAction: "flag_invalid",
    kind: "validation",
    source: "browser-ai",
    status: "new",
    ...overrides,
  };
}

function createAIQueueState(): DatasetWorkflowState {
  return {
    ...initialState,
    datasetId: "customer-cleanup",
    fileName: "customers.csv",
    status: "ready",
    columns: [
      { key: "full_name", label: "Full Name" },
      { key: "email", label: "Email" },
    ],
    rows: [
      {
        id: 1,
        values: { full_name: "", email: "valid@example.com" },
        validationState: "missing",
        validationField: "full_name",
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

  it("marks a suggestion resolved when manual edits fix every affected row", () => {
    const next = workflowReducer(createReadyState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "edited@example.com",
      meta,
    });

    expect(next.suggestions[0]).toMatchObject({
      status: "resolved",
      resolvedRows: [1],
    });
    expect(next.status).toBe("completed");
    expect(next.profile?.columns[0].missingCount).toBe(0);
  });

  it("keeps original affected context while tracking partially resolved rows", () => {
    const state: DatasetWorkflowState = {
      ...createReadyState(),
      rows: [
        {
          id: 1,
          values: { email: "bad-email" },
          validationState: "invalid",
          validationField: "email",
        },
        {
          id: 2,
          values: { email: "also-bad" },
          validationState: "invalid",
          validationField: "email",
        },
      ],
      suggestions: [
        {
          ...createReadyState().suggestions[0],
          affectedRows: [1, 2],
        },
      ],
    };

    const next = workflowReducer(state, {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "edited@example.com",
      meta,
    });

    expect(next.suggestions[0]).toMatchObject({
      status: "pending",
      affectedRows: [1, 2],
      resolvedRows: [1],
    });
  });

  it("resolves a country suggestion when a manual edit uses the canonical value", () => {
    const next = workflowReducer(createCountryState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "United States",
      meta,
    });

    expect(next.rows[0]).toMatchObject({
      validationState: "valid",
      validationField: undefined,
    });
    expect(next.suggestions[0]).toMatchObject({
      status: "resolved",
      resolvedRows: [1],
    });
    expect(next.status).toBe("completed");
  });

  it("does not resolve a country suggestion with arbitrary non-empty text", () => {
    const next = workflowReducer(createCountryState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "Narnia",
      meta,
    });

    expect(next.rows[0]).toMatchObject({
      validationState: "invalid",
      validationField: "country",
    });
    expect(next.suggestions[0]).toMatchObject({
      status: "pending",
      resolvedRows: [],
    });
  });

  it("does not resolve an invalid date suggestion with arbitrary non-empty text", () => {
    const next = workflowReducer(createDateState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "signup_date",
      value: "still not a date",
      meta,
    });

    expect(next.rows[0]).toMatchObject({
      validationState: "invalid",
      validationField: "signup_date",
    });
    expect(next.suggestions[0]).toMatchObject({
      status: "pending",
      resolvedRows: [],
    });
  });

  it("normalizes account status suggestions through manual edits", () => {
    const next = workflowReducer(createAccountStatusState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "account_status",
      value: "Active",
      meta,
    });

    expect(next.rows[0]).toMatchObject({
      validationState: "valid",
      validationField: undefined,
    });
    expect(next.suggestions[0]).toMatchObject({
      status: "resolved",
      resolvedRows: [1],
    });
  });

  it("does not resolve account status suggestions with arbitrary non-empty text", () => {
    const next = workflowReducer(createAccountStatusState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "account_status",
      value: "maybe later",
      meta,
    });

    expect(next.rows[0]).toMatchObject({
      validationState: "invalid",
      validationField: "account_status",
    });
    expect(next.suggestions[0]).toMatchObject({
      status: "pending",
      resolvedRows: [],
    });
  });

  it("keeps apply fix resolving standardization suggestions correctly", () => {
    const next = workflowReducer(createCountryState(), {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-value",
      meta,
    });

    expect(next.rows[0]).toMatchObject({
      values: { country: "United States" },
      validationState: "valid",
      validationField: undefined,
    });
    expect(next.suggestions[0].status).toBe("approved");
    expect(next.status).toBe("completed");
  });

  it("undo restores validation and returns the suggestion to pending", () => {
    const approvedState = workflowReducer(createCountryState(), {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-value",
      meta,
    });

    const next = workflowReducer(approvedState, {
      type: "TRANSFORMATION_UNDONE",
      transformationId: "event-1",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(next.rows[0]).toMatchObject({
      values: { country: "usa" },
      validationState: "invalid",
      validationField: "country",
    });
    expect(next.suggestions[0]).toMatchObject({
      status: "pending",
      resolvedRows: [],
    });
    expect(next.status).toBe("reviewing");
  });

  it("converts a new AI finding into a pending Review Queue suggestion", () => {
    const state = createAIQueueState();
    const beforeRows = JSON.stringify(state.rows);

    const next = workflowReducer(state, {
      type: "AI_FINDING_ADDED_TO_REVIEW_QUEUE",
      finding: createAIFinding(),
      meta,
    });

    expect(next.suggestions).toHaveLength(1);
    expect(next.suggestions[0]).toMatchObject({
      id: "ai-review-ai-name-missing-1",
      status: "pending",
      action: "flag_invalid",
      source: "ai-finding",
      aiFindingId: "ai-name-missing-1",
      targetField: "full_name",
      affectedRows: [1],
    });
    expect(JSON.stringify(next.rows)).toBe(beforeRows);
    expect(next.auditEvents[0].operation).toBe(
      "AI finding added to review queue: Review suspicious full name"
    );
  });

  it("does not add the same AI finding twice", () => {
    const addedState = workflowReducer(createAIQueueState(), {
      type: "AI_FINDING_ADDED_TO_REVIEW_QUEUE",
      finding: createAIFinding(),
      meta,
    });

    const next = workflowReducer(addedState, {
      type: "AI_FINDING_ADDED_TO_REVIEW_QUEUE",
      finding: createAIFinding(),
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(next).toBe(addedState);
    expect(next.suggestions).toHaveLength(1);
  });

  it("preserves safe deterministic suggested values for AI findings", () => {
    const next = workflowReducer(createAIQueueState(), {
      type: "AI_FINDING_ADDED_TO_REVIEW_QUEUE",
      finding: createAIFinding({
        id: "ai-country-standardize-1",
        title: "Standardize country casing",
        targetField: "country",
        suggestedAction: "standardize_value",
        suggestedValue: "United States",
      }),
      meta,
    });

    expect(next.suggestions[0]).toMatchObject({
      action: "standardize_value",
      suggestedValue: "United States",
    });
  });

  it("allows AI-created suggestions to be ignored through the existing flow", () => {
    const addedState = workflowReducer(createAIQueueState(), {
      type: "AI_FINDING_ADDED_TO_REVIEW_QUEUE",
      finding: createAIFinding(),
      meta,
    });

    const next = workflowReducer(addedState, {
      type: "SUGGESTION_IGNORED",
      suggestionId: "ai-review-ai-name-missing-1",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(next.suggestions[0].status).toBe("ignored");
    expect(next.auditEvents.at(-1)).toMatchObject({
      operation: "Ignored suggestion: Review suspicious full name",
      status: "ignored",
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
