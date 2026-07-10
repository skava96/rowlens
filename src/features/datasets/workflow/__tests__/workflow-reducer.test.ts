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

function getDecisionCounts(state: DatasetWorkflowState) {
  return {
    completed: state.suggestions.filter((item) => item.status !== "pending")
      .length,
    approved: state.suggestions.filter((item) => item.status === "approved")
      .length,
    ignored: state.suggestions.filter((item) => item.status === "ignored")
      .length,
    pending: state.suggestions.filter((item) => item.status === "pending")
      .length,
  };
}

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
        values: { email: "johnatsign.example.com" },
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
        suggestedValue: "john@example.com",
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

function createCountryAliasState(): DatasetWorkflowState {
  return {
    ...createCountryState(),
    rows: [
      {
        id: 1,
        values: { country: "USA" },
        validationState: "invalid",
        validationField: "country",
      },
    ],
  };
}

function createMultiCountryState(): DatasetWorkflowState {
  return {
    ...initialState,
    datasetId: "customer-cleanup",
    fileName: "customers.csv",
    status: "ready",
    columns: [{ key: "country", label: "Country" }],
    rows: [
      {
        id: 1,
        values: { country: "USA" },
        validationState: "invalid",
        validationField: "country",
      },
      {
        id: 2,
        values: { country: "USA" },
        validationState: "invalid",
        validationField: "country",
      },
      {
        id: 3,
        values: { country: "USA" },
        validationState: "invalid",
        validationField: "country",
      },
    ],
    suggestions: [
      {
        id: "standardize-country-values",
        type: "validation",
        title: "Standardize country value",
        description: "Normalize country values.",
        confidence: 94,
        affectedRows: [1, 2, 3],
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

  it("clears a failed upload without affecting non-failed workflow states", () => {
    const failedState = workflowReducer(initialState, {
      type: "UPLOAD_FAILED",
      error: "The uploaded dataset is empty.",
      meta,
    });

    const clearedState = workflowReducer(failedState, {
      type: "UPLOAD_FAILURE_CLEARED",
      datasetId: "customer-cleanup",
    });

    expect(clearedState).toMatchObject({
      datasetId: "customer-cleanup",
      status: "idle",
      fileName: null,
      progress: 0,
      error: undefined,
      rows: [],
      suggestions: [],
    });

    const readyState = createReadyState();
    const unchangedState = workflowReducer(readyState, {
      type: "UPLOAD_FAILURE_CLEARED",
      datasetId: "customer-cleanup",
    });

    expect(unchangedState).toBe(readyState);
  });

  it("applies a pending suggestion once and creates an audit transformation", () => {
    const state = createReadyState();

    const next = workflowReducer(state, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "suggestion-1",
      meta,
    });

    expect(next.suggestions[0].status).toBe("resolved");
    expect(next.rows[0].values.email).toBe("john@example.com");
    expect(next.transformations).toHaveLength(1);
    expect(next.transformations[0]).toMatchObject({
      id: "event-1",
      timestamp: "10:00 AM",
      suggestionId: "suggestion-1",
    });
  });

  it("does not apply an already resolved suggestion again", () => {
    const resolvedState = workflowReducer(createReadyState(), {
      type: "SUGGESTION_APPROVED",
      suggestionId: "suggestion-1",
      meta,
    });

    const next = workflowReducer(resolvedState, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "suggestion-1",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(next).toBe(resolvedState);
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
    expect(next.rows[0].manualEditedFields).toEqual(["email"]);
    expect(next.rows[0].correctedFields).toBeUndefined();
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
          action: "flag_invalid",
          suggestedValue: undefined,
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
      status: "resolved",
      affectedRows: [1, 2],
      resolvedRows: [1, 2],
    });
  });

  it("manual edit resolves only the fixed target-field suggestion on a row with multiple issues", () => {
    const state: DatasetWorkflowState = {
      ...initialState,
      datasetId: "customer-cleanup",
      fileName: "customers.csv",
      status: "ready",
      columns: [
        { key: "email", label: "Email" },
        { key: "country", label: "Country" },
      ],
      rows: [
        {
          id: 4,
          values: {
            email: "nina.patel@acme",
            country: "Narnia",
          },
          validationState: "invalid",
          validationField: "email",
        },
      ],
      suggestions: [
        {
          id: "invalid-email",
          type: "validation",
          title: "Invalid email format",
          description: "Review invalid emails.",
          confidence: 98,
          affectedRows: [4],
          severity: "high",
          status: "pending",
          action: "flag_invalid",
          targetField: "email",
        },
        {
          id: "invalid-country",
          type: "validation",
          title: "Review country value",
          description: "Review invalid countries.",
          confidence: 86,
          affectedRows: [4],
          severity: "low",
          status: "pending",
          action: "flag_invalid",
          targetField: "country",
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

    const next = workflowReducer(state, {
      type: "CELL_UPDATED",
      rowId: 4,
      field: "email",
      value: "nina.patel@acme.com",
      meta,
    });

    expect(next.rows[0]).toMatchObject({
      values: {
        email: "nina.patel@acme.com",
        country: "Narnia",
      },
      validationState: "invalid",
      validationField: "country",
      transformedFields: ["email"],
      manualEditedFields: ["email"],
    });
    expect(next.suggestions.find((item) => item.id === "invalid-email"))
      .toMatchObject({
        status: "resolved",
        resolvedRows: [4],
      });
    expect(next.suggestions.find((item) => item.id === "invalid-country"))
      .toMatchObject({
        status: "pending",
        resolvedRows: [],
      });
  });

  it("merges repeated manual edits on the same cell into one active transformation", () => {
    const firstEdit = workflowReducer(createReadyState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "john@example.com",
      meta,
    });

    const secondEdit = workflowReducer(firstEdit, {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "john@.com",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(secondEdit.rows[0]).toMatchObject({
      values: { email: "john@.com" },
      validationState: "invalid",
      validationField: "email",
      transformedFields: ["email"],
      manualEditedFields: ["email"],
      correctedFields: undefined,
    });
    expect(secondEdit.transformations).toHaveLength(1);
    expect(secondEdit.transformations[0]).toMatchObject({
      id: "event-1",
      timestamp: "10:01 AM",
      suggestionId: "manual-edit",
      changes: [
        {
          rowId: 1,
          field: "email",
          beforeValue: "johnatsign.example.com",
          afterValue: "john@.com",
        },
      ],
    });
    expect(secondEdit.auditEvents).toHaveLength(2);
    expect(secondEdit.auditEvents.map((event) => event.id)).toEqual([
      "event-1",
      "event-2",
    ]);
  });

  it("undoing repeated manual edits restores the original cell value", () => {
    const firstEdit = workflowReducer(createReadyState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "john@example.com",
      meta,
    });

    const secondEdit = workflowReducer(firstEdit, {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "john@.com",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    const next = workflowReducer(secondEdit, {
      type: "TRANSFORMATION_UNDONE",
      transformationId: "event-1",
      meta: {
        id: "event-3",
        timestamp: "10:02 AM",
      },
    });

    expect(next.rows[0]).toMatchObject({
      values: { email: "johnatsign.example.com" },
      validationState: "invalid",
      validationField: "email",
      transformedFields: [],
      manualEditedFields: [],
      correctedFields: undefined,
    });
    expect(next.suggestions[0]).toMatchObject({
      status: "pending",
      resolvedRows: [],
    });
    expect(next.transformations[0]).toMatchObject({
      reverted: true,
      revertStatus: "reverted",
    });
    expect(next.auditEvents.map((event) => event.id)).toEqual([
      "event-1",
      "event-2",
      "event-3",
    ]);
  });

  it("reuses a reverted same-cell manual transformation when edited again", () => {
    const firstEdit = workflowReducer(createReadyState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "john@example.com",
      meta,
    });

    const undone = workflowReducer(firstEdit, {
      type: "TRANSFORMATION_UNDONE",
      transformationId: "event-1",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    const secondEdit = workflowReducer(undone, {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "john.second@example.com",
      meta: {
        id: "event-3",
        timestamp: "10:02 AM",
      },
    });

    expect(secondEdit.rows[0]).toMatchObject({
      values: { email: "john.second@example.com" },
      validationState: "valid",
      validationField: undefined,
      manualEditedFields: ["email"],
    });
    expect(secondEdit.transformations).toHaveLength(1);
    expect(secondEdit.transformations[0]).toMatchObject({
      id: "event-1",
      reverted: false,
      revertStatus: "active",
      changes: [
        {
          rowId: 1,
          field: "email",
          beforeValue: "johnatsign.example.com",
          afterValue: "john.second@example.com",
        },
      ],
    });
    expect(secondEdit.auditEvents.map((event) => event.id)).toEqual([
      "event-1",
      "event-2",
      "event-3",
    ]);
  });

  it("re-edit after undo still undoes back to the original value", () => {
    const firstEdit = workflowReducer(createReadyState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "john@example.com",
      meta,
    });

    const firstUndo = workflowReducer(firstEdit, {
      type: "TRANSFORMATION_UNDONE",
      transformationId: "event-1",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    const secondEdit = workflowReducer(firstUndo, {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "john.second@example.com",
      meta: {
        id: "event-3",
        timestamp: "10:02 AM",
      },
    });

    const secondUndo = workflowReducer(secondEdit, {
      type: "TRANSFORMATION_UNDONE",
      transformationId: "event-1",
      meta: {
        id: "event-4",
        timestamp: "10:03 AM",
      },
    });

    expect(secondUndo.rows[0]).toMatchObject({
      values: { email: "johnatsign.example.com" },
      validationState: "invalid",
      validationField: "email",
      manualEditedFields: [],
    });
    expect(secondUndo.transformations).toHaveLength(1);
    expect(secondUndo.transformations[0]).toMatchObject({
      reverted: true,
      revertStatus: "reverted",
      changes: [
        {
          beforeValue: "johnatsign.example.com",
          afterValue: "john.second@example.com",
        },
      ],
    });
    expect(secondUndo.auditEvents.map((event) => event.id)).toEqual([
      "event-1",
      "event-2",
      "event-3",
      "event-4",
    ]);
  });

  it("orders pending review suggestions by severity, affected rows, and confidence", () => {
    const state: DatasetWorkflowState = {
      ...createReadyState(),
      suggestions: [
        {
          id: "low-many",
          type: "validation",
          title: "Low many",
          description: "Low severity.",
          confidence: 99,
          affectedRows: [1, 2, 3],
          severity: "low",
          status: "pending",
          action: "flag_invalid",
          targetField: "email",
        },
        {
          id: "high-one",
          type: "validation",
          title: "High one",
          description: "High severity.",
          confidence: 80,
          affectedRows: [1],
          severity: "high",
          status: "pending",
          action: "flag_invalid",
          targetField: "email",
        },
        {
          id: "high-two-low-confidence",
          type: "validation",
          title: "High two lower confidence",
          description: "High severity.",
          confidence: 80,
          affectedRows: [1, 2],
          severity: "high",
          status: "pending",
          action: "flag_invalid",
          targetField: "email",
        },
        {
          id: "high-two-high-confidence",
          type: "validation",
          title: "High two higher confidence",
          description: "High severity.",
          confidence: 90,
          affectedRows: [1, 2],
          severity: "high",
          status: "pending",
          action: "flag_invalid",
          targetField: "email",
        },
        {
          id: "approved-high",
          type: "validation",
          title: "Approved high",
          description: "Approved.",
          confidence: 99,
          affectedRows: [1, 2, 3, 4],
          severity: "high",
          status: "approved",
          action: "flag_invalid",
          targetField: "email",
        },
      ],
    };

    const next = workflowReducer(initialState, {
      type: "WORKFLOW_RESTORED",
      state,
    });

    expect(next.suggestions.map((suggestion) => suggestion.id)).toEqual([
      "high-two-high-confidence",
      "high-two-low-confidence",
      "high-one",
      "low-many",
      "approved-high",
    ]);
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
      status: "resolved",
      resolvedRows: [1],
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
      status: "resolved",
      resolvedRows: [1],
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
    expect(next.suggestions[0].status).toBe("resolved");
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
      correctedFields: [],
    });
    expect(next.suggestions[0]).toMatchObject({
      status: "pending",
      resolvedRows: [],
    });
    expect(next.status).toBe("reviewing");
  });

  it("undoing a manual edit reopens the review and updates current-state counts", () => {
    const resolvedState = workflowReducer(createReadyState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "edited@example.com",
      meta,
    });

    expect(getDecisionCounts(resolvedState)).toEqual({
      completed: 1,
      approved: 0,
      ignored: 0,
      pending: 0,
    });

    const next = workflowReducer(resolvedState, {
      type: "TRANSFORMATION_UNDONE",
      transformationId: "event-1",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(next.rows[0]).toMatchObject({
      values: { email: "johnatsign.example.com" },
      validationState: "invalid",
      validationField: "email",
    });
    expect(next.suggestions[0]).toMatchObject({
      status: "pending",
      resolvedRows: [],
    });
    expect(getDecisionCounts(next)).toEqual({
      completed: 0,
      approved: 0,
      ignored: 0,
      pending: 1,
    });
    expect(next.transformations[0]).toMatchObject({
      reverted: true,
      revertStatus: "reverted",
    });
    expect(next.auditEvents.at(-1)).toMatchObject({
      operation: "Undo Manual Edit: Manual edit on row #1",
      status: "reverted",
    });
  });

  it("undoing an applied fix reopens the review and updates current-state counts", () => {
    const approvedState = workflowReducer(createCountryState(), {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-value",
      meta,
    });

    expect(getDecisionCounts(approvedState)).toEqual({
      completed: 1,
      approved: 0,
      ignored: 0,
      pending: 0,
    });

    const undoneState = workflowReducer(approvedState, {
      type: "TRANSFORMATION_UNDONE",
      transformationId: "event-1",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(getDecisionCounts(undoneState)).toEqual({
      completed: 0,
      approved: 0,
      ignored: 0,
      pending: 1,
    });
    expect(undoneState.auditEvents.at(-1)).toMatchObject({
      operation: "Undo Applied Fix: Standardize country value",
      status: "reverted",
    });

    const reappliedState = workflowReducer(undoneState, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-value",
      meta: {
        id: "event-3",
        timestamp: "10:02 AM",
      },
    });

    expect(getDecisionCounts(reappliedState)).toEqual({
      completed: 1,
      approved: 0,
      ignored: 0,
      pending: 0,
    });
    expect(reappliedState.auditEvents.map((event) => event.id)).toEqual([
      "event-1",
      "event-2",
      "event-3",
    ]);
  });

  it("apply fix updates a manually edited country value that still needs standardization", () => {
    const manuallyEdited = workflowReducer(createCountryAliasState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "US",
      meta,
    });

    expect(manuallyEdited.rows[0]).toMatchObject({
      values: { country: "US" },
      validationState: "invalid",
      validationField: "country",
      manualEditedFields: ["country"],
    });
    expect(manuallyEdited.suggestions[0]).toMatchObject({
      status: "pending",
    });

    const fixed = workflowReducer(manuallyEdited, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-value",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(fixed.rows[0]).toMatchObject({
      values: { country: "United States" },
      validationState: "valid",
      validationField: undefined,
      correctedFields: ["country"],
      manualEditedFields: [],
    });
    expect(fixed.suggestions[0]).toMatchObject({
      status: "resolved",
    });
    expect(fixed.auditEvents.map((event) => event.id)).toEqual([
      "event-1",
      "event-2",
    ]);
  });

  it.each([
    ["US"],
    ["U.S.A."],
  ])(
    "apply fix corrects a manually edited invalid country value %s",
    (manualValue) => {
      const manuallyEdited = workflowReducer(createCountryAliasState(), {
        type: "CELL_UPDATED",
        rowId: 1,
        field: "country",
        value: manualValue,
        meta,
      });

      expect(manuallyEdited.rows[0]).toMatchObject({
        values: { country: manualValue },
        validationState: "invalid",
        validationField: "country",
        manualEditedFields: ["country"],
      });
      expect(manuallyEdited.suggestions[0]).toMatchObject({
        status: "pending",
      });

      const fixed = workflowReducer(manuallyEdited, {
        type: "SUGGESTION_APPROVED",
        suggestionId: "standardize-country-value",
        meta: {
          id: "event-2",
          timestamp: "10:01 AM",
        },
      });

      expect(fixed.rows[0]).toMatchObject({
        values: { country: "United States" },
        validationState: "valid",
        validationField: undefined,
        correctedFields: ["country"],
        manualEditedFields: [],
      });
      expect(fixed.suggestions[0]).toMatchObject({
        status: "resolved",
        resolvedRows: [1],
      });
      expect(fixed.transformations.at(-1)?.changes).toEqual([
        {
          rowId: 1,
          field: "country",
          beforeValue: manualValue,
          afterValue: "United States",
        },
      ]);
    }
  );

  it("apply fix does not overwrite an unrelated invalid country issue", () => {
    const manuallyEdited = workflowReducer(createCountryAliasState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "UnitedState",
      meta,
    });

    expect(manuallyEdited.rows[0]).toMatchObject({
      values: { country: "UnitedState" },
      validationState: "invalid",
      validationField: "country",
      manualEditedFields: ["country"],
    });
    expect(manuallyEdited.suggestions[0]).toMatchObject({
      status: "resolved",
      resolvedRows: [1],
    });

    const next = workflowReducer(manuallyEdited, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-value",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(next).toBe(manuallyEdited);
    expect(next.rows[0].values.country).toBe("UnitedState");
  });

  it("apply fix is skipped after a valid manual country correction resolves the issue", () => {
    const manuallyResolved = workflowReducer(createCountryAliasState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "United States",
      meta,
    });

    expect(manuallyResolved.rows[0]).toMatchObject({
      values: { country: "United States" },
      validationState: "valid",
      validationField: undefined,
      manualEditedFields: ["country"],
    });
    expect(manuallyResolved.suggestions[0]).toMatchObject({
      status: "resolved",
    });

    const next = workflowReducer(manuallyResolved, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-value",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(next).toBe(manuallyResolved);
    expect(next.rows[0].values.country).toBe("United States");
  });

  it("apply fix is skipped after an intentional valid different manual country value", () => {
    const manuallyResolved = workflowReducer(createCountryAliasState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "Canada",
      meta,
    });

    expect(manuallyResolved.rows[0]).toMatchObject({
      values: { country: "Canada" },
      validationState: "valid",
      validationField: undefined,
      manualEditedFields: ["country"],
    });
    expect(manuallyResolved.suggestions[0]).toMatchObject({
      status: "resolved",
    });

    const next = workflowReducer(manuallyResolved, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-value",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(next).toBe(manuallyResolved);
    expect(next.rows[0].values.country).toBe("Canada");
  });

  it("recomputes a partially applied suggestion when a manually resolved row is undone", () => {
    const manuallyResolvedRow = workflowReducer(createMultiCountryState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "United States",
      meta,
    });

    expect(manuallyResolvedRow.suggestions[0]).toMatchObject({
      status: "pending",
      resolvedRows: [1],
    });

    const appliedRemainingRows = workflowReducer(manuallyResolvedRow, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-values",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(appliedRemainingRows.rows.map((row) => row.values.country)).toEqual([
      "United States",
      "United States",
      "United States",
    ]);
    expect(appliedRemainingRows.transformations[1].changes.map((change) => change.rowId))
      .toEqual([2, 3]);
    expect(appliedRemainingRows.suggestions[0]).toMatchObject({
      status: "resolved",
      resolvedRows: [1, 2, 3],
    });

    const undoneManualRow = workflowReducer(appliedRemainingRows, {
      type: "TRANSFORMATION_UNDONE",
      transformationId: "event-1",
      meta: {
        id: "event-3",
        timestamp: "10:02 AM",
      },
    });

    expect(undoneManualRow.rows.map((row) => row.values.country)).toEqual([
      "USA",
      "United States",
      "United States",
    ]);
    expect(undoneManualRow.suggestions[0]).toMatchObject({
      status: "pending",
      resolvedRows: [2, 3],
    });
  });

  it("reopens an applied suggestion when the corrected value is manually changed back to an invalid alias", () => {
    const fixed = workflowReducer(createCountryAliasState(), {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-value",
      meta,
    });

    expect(fixed.suggestions[0]).toMatchObject({
      status: "resolved",
      resolvedRows: [1],
    });

    const invalidAgain = workflowReducer(fixed, {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "US",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(invalidAgain.rows[0]).toMatchObject({
      values: { country: "US" },
      validationState: "invalid",
      validationField: "country",
      correctedFields: [],
      manualEditedFields: ["country"],
    });
    expect(invalidAgain.suggestions[0]).toMatchObject({
      status: "pending",
      resolvedRows: [],
    });
  });

  it("keeps a valid different manual country resolved but reopens when the condition becomes true again", () => {
    const validDifferent = workflowReducer(createCountryAliasState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "Canada",
      meta,
    });

    expect(validDifferent.suggestions[0]).toMatchObject({
      status: "resolved",
      resolvedRows: [1],
    });

    const invalidAlias = workflowReducer(validDifferent, {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "US",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(invalidAlias.suggestions[0]).toMatchObject({
      status: "pending",
      resolvedRows: [],
    });
  });

  it("recomputes review queue after multiple edits and undo restores the original invalid value", () => {
    const firstEdit = workflowReducer(createCountryAliasState(), {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "US",
      meta,
    });

    const secondEdit = workflowReducer(firstEdit, {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "United States",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    expect(secondEdit.suggestions[0]).toMatchObject({
      status: "resolved",
      resolvedRows: [1],
    });

    const undone = workflowReducer(secondEdit, {
      type: "TRANSFORMATION_UNDONE",
      transformationId: "event-1",
      meta: {
        id: "event-3",
        timestamp: "10:02 AM",
      },
    });

    expect(undone.rows[0].values.country).toBe("USA");
    expect(undone.suggestions[0]).toMatchObject({
      status: "pending",
      resolvedRows: [],
    });
  });

  it("keeps ignored suggestions ignored when an unrelated edit is undone", () => {
    const ignored = workflowReducer(
      {
        ...createCountryAliasState(),
        columns: [
          { key: "country", label: "Country" },
          { key: "email", label: "Email" },
        ],
        rows: [
          {
            id: 1,
            values: {
              country: "USA",
              email: "bad-email",
            },
            validationState: "invalid",
            validationField: "country",
          },
        ],
      },
      {
        type: "SUGGESTION_IGNORED",
        suggestionId: "standardize-country-value",
        meta,
      }
    );

    const editedEmail = workflowReducer(ignored, {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "email",
      value: "valid@example.com",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });

    const undoneEmail = workflowReducer(editedEmail, {
      type: "TRANSFORMATION_UNDONE",
      transformationId: "event-2",
      meta: {
        id: "event-3",
        timestamp: "10:02 AM",
      },
    });

    expect(undoneEmail.suggestions[0]).toMatchObject({
      status: "ignored",
    });
  });

  it("reopens only the undone row's suggestion after multiple row-level apply fixes", () => {
    const state: DatasetWorkflowState = {
      ...createMultiCountryState(),
      suggestions: [1, 2, 3].map((rowId) => ({
        ...createMultiCountryState().suggestions[0],
        id: `standardize-country-row-${rowId}`,
        affectedRows: [rowId],
      })),
    };

    const fixedRow1 = workflowReducer(state, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-row-1",
      meta,
    });
    const fixedRow2 = workflowReducer(fixedRow1, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-row-2",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });
    const fixedRow3 = workflowReducer(fixedRow2, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-row-3",
      meta: {
        id: "event-3",
        timestamp: "10:02 AM",
      },
    });

    const undoneRow2 = workflowReducer(fixedRow3, {
      type: "TRANSFORMATION_UNDONE",
      transformationId: "event-2",
      meta: {
        id: "event-4",
        timestamp: "10:03 AM",
      },
    });

    expect(
      undoneRow2.suggestions.map((suggestion) => ({
        id: suggestion.id,
        status: suggestion.status,
        resolvedRows: suggestion.resolvedRows,
      }))
    ).toEqual([
      {
        id: "standardize-country-row-2",
        status: "pending",
        resolvedRows: [],
      },
      {
        id: "standardize-country-row-1",
        status: "resolved",
        resolvedRows: [1],
      },
      {
        id: "standardize-country-row-3",
        status: "resolved",
        resolvedRows: [3],
      },
    ]);
  });

  it("recomputes only the affected suggestion in a mixed manual and corrected dataset", () => {
    const state: DatasetWorkflowState = {
      ...createMultiCountryState(),
      rows: [
        ...createMultiCountryState().rows,
        {
          id: 4,
          values: { country: "USA" },
          validationState: "invalid",
          validationField: "country",
        },
      ],
      suggestions: [1, 2, 3, 4].map((rowId) => ({
        ...createMultiCountryState().suggestions[0],
        id: `standardize-country-row-${rowId}`,
        affectedRows: [rowId],
      })),
    };

    const editedRow1 = workflowReducer(state, {
      type: "CELL_UPDATED",
      rowId: 1,
      field: "country",
      value: "United States",
      meta,
    });
    const fixedRow2 = workflowReducer(editedRow1, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-row-2",
      meta: {
        id: "event-2",
        timestamp: "10:01 AM",
      },
    });
    const editedRow3 = workflowReducer(fixedRow2, {
      type: "CELL_UPDATED",
      rowId: 3,
      field: "country",
      value: "United States",
      meta: {
        id: "event-3",
        timestamp: "10:02 AM",
      },
    });
    const fixedRow4 = workflowReducer(editedRow3, {
      type: "SUGGESTION_APPROVED",
      suggestionId: "standardize-country-row-4",
      meta: {
        id: "event-4",
        timestamp: "10:03 AM",
      },
    });

    const undoneEditedRow3 = workflowReducer(fixedRow4, {
      type: "TRANSFORMATION_UNDONE",
      transformationId: "event-3",
      meta: {
        id: "event-5",
        timestamp: "10:04 AM",
      },
    });

    expect(
      undoneEditedRow3.suggestions.map((suggestion) => ({
        id: suggestion.id,
        status: suggestion.status,
        resolvedRows: suggestion.resolvedRows,
      }))
    ).toEqual([
      {
        id: "standardize-country-row-3",
        status: "pending",
        resolvedRows: [],
      },
      {
        id: "standardize-country-row-1",
        status: "resolved",
        resolvedRows: [1],
      },
      {
        id: "standardize-country-row-2",
        status: "resolved",
        resolvedRows: [2],
      },
      {
        id: "standardize-country-row-4",
        status: "resolved",
        resolvedRows: [4],
      },
    ]);
  });

  it("ignoring a suggestion updates current-state counts", () => {
    const ignoredState = workflowReducer(createReadyState(), {
      type: "SUGGESTION_IGNORED",
      suggestionId: "suggestion-1",
      meta,
    });

    expect(getDecisionCounts(ignoredState)).toEqual({
      completed: 1,
      approved: 0,
      ignored: 1,
      pending: 0,
    });
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

  it("preserves safe single-row suggested values for AI findings", () => {
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

  it("downgrades multi-row AI suggested values to review-only flags", () => {
    const next = workflowReducer(createAIQueueState(), {
      type: "AI_FINDING_ADDED_TO_REVIEW_QUEUE",
      finding: createAIFinding({
        id: "ai-country-standardize-many",
        title: "Standardize country casing",
        targetField: "country",
        affectedRows: [1, 2],
        suggestedAction: "standardize_value",
        suggestedValue: "United States",
      }),
      meta,
    });

    expect(next.suggestions[0]).toMatchObject({
      action: "flag_invalid",
      suggestedValue: undefined,
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

    expect(workflowReducer(initialState, action)).toEqual(restored);
  });
});
