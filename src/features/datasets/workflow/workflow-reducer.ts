import { ParsedDataset } from "../utils/parseDatasetFile";
import { DatasetWorkflowState } from "../types/workflow";
import { analyzeDataset } from "../utils/analyzeDataset";
import { profileDataset } from "../utils/profileDataset";
import { applySuggestionToRows } from "../utils/applySuggestion";
import { getRowValidationState } from "../utils/getRowValidationState";
import { createRowSearchText } from "../utils/createRowSearchText";
type WorkflowMeta = {
    id: string;
    timestamp: string;
};

function createActivity(label: string, meta: WorkflowMeta) {
    return {
        id: meta.id,
        time: meta.timestamp,
        label,
    };
}

export type WorkflowAction =
    | {
        type: "UPLOAD_STARTED";
        datasetId: string;
        fileName: string;
        meta: WorkflowMeta;
    }
    | { type: "UPLOAD_PROCESSING"; datasetId: string; meta: WorkflowMeta }
    | {
        type: "UPLOAD_COMPLETED";
        datasetId: string;
        fileName: string;
        payload: ParsedDataset;
        analysis: ReturnType<typeof analyzeDataset>;
        profile: ReturnType<typeof profileDataset>;
        meta: {
            parsed: WorkflowMeta;
            ready: WorkflowMeta;
        };
    }
    | { type: "UPLOAD_FAILED"; error: string; meta: WorkflowMeta }
    | { type: "SUGGESTION_APPROVED"; suggestionId: string; meta: WorkflowMeta }
    | { type: "SUGGESTION_REJECTED"; suggestionId: string; meta: WorkflowMeta }
    | {
        type: "CELL_UPDATED";
        rowId: number;
        field: string;
        value: string;
        meta: WorkflowMeta;
    }
    | { type: "SELECT_SUGGESTION"; suggestionId: string | null; meta: WorkflowMeta }
    | { type: "TRANSFORMATION_UNDONE"; transformationId: string; meta: WorkflowMeta }
    | { type: "ROWS_BULK_MARKED_VALID"; rowIds: number[]; meta: WorkflowMeta }
    | { type: "WORKFLOW_RESTORED"; state: DatasetWorkflowState };

export const initialState: DatasetWorkflowState = {
    datasetId: null,
    fileName: null,
    status: "idle",
    columns: [],
    rows: [],
    suggestions: [],
    selectedSuggestionId: null,
    progress: 0,
    error: undefined,
    activity: [],
    profile: null,
    transformations: [],
};

export function workflowReducer(
    state: DatasetWorkflowState,
    action: WorkflowAction
): DatasetWorkflowState {
    switch (action.type) {
        case "UPLOAD_STARTED":
            return {
                ...initialState,
                datasetId: action.datasetId,
                fileName: action.fileName,
                status: "uploading",
                progress: 15,
                activity: [createActivity(`Uploading ${action.fileName}`, action.meta)],
            };

        case "UPLOAD_PROCESSING":
            if (
                state.datasetId !== action.datasetId ||
                state.status !== "uploading"
            ) {
                return state;
            }

            return {
                ...state,
                status: "processing",
                progress: 55,
                activity: [...state.activity, createActivity("Processing dataset", action.meta)],
            };

        case "UPLOAD_COMPLETED":
            return {
                ...state,
                datasetId: action.datasetId,
                fileName: action.fileName,
                status: "ready",
                columns: action.payload.columns,
                rows: action.analysis.rows,
                suggestions: action.analysis.suggestions,
                selectedSuggestionId: null,
                progress: 100,
                error: undefined,
                activity: [
                    ...state.activity,
                    createActivity(
                        `Parsed ${action.payload.rows.length} rows and ${action.payload.columns.length} columns`,
                        action.meta.parsed
                    ),
                    createActivity("Dataset ready for review", action.meta.ready),
                ],
                profile: action.profile,
            };

        case "UPLOAD_FAILED":
            return {
                ...state,
                status: "failed",
                columns: [],
                rows: [],
                suggestions: [],
                selectedSuggestionId: null,
                progress: 0,
                error: action.error,
                activity: [...state.activity, createActivity("Dataset upload failed", action.meta)],
                profile: null,
            };

        case "SELECT_SUGGESTION": {
            const suggestion = state.suggestions.find(
                (item) => item.id === action.suggestionId
            );

            const isSameSuggestion =
                state.selectedSuggestionId === action.suggestionId;

            return {
                ...state,
                status: isSameSuggestion ? state.status : "reviewing",
                selectedSuggestionId: isSameSuggestion ? null : action.suggestionId,
                activity:
                    suggestion && !isSameSuggestion
                        ? [...state.activity, createActivity(`Reviewing: ${suggestion.title}`, action.meta)]
                        : state.activity,
            };
        }

        case "SUGGESTION_APPROVED": {
            const suggestion = state.suggestions.find(
                (item) => item.id === action.suggestionId
            );

            if (!suggestion || suggestion.status !== "pending") {
                return state;
            }

            const result = applySuggestionToRows({
                rows: state.rows,
                suggestion,
            });

            const updatedSuggestions = state.suggestions.map((item) =>
                item.id === action.suggestionId
                    ? { ...item, status: "approved" as const }
                    : item
            );

            const allResolved = updatedSuggestions.every(
                (item) => item.status !== "pending"
            );

            return {
                ...state,
                rows: result.rows,
                status: allResolved ? "completed" : state.status,
                suggestions: updatedSuggestions,
                selectedSuggestionId:
                    state.selectedSuggestionId === action.suggestionId
                        ? null
                        : state.selectedSuggestionId,
                activity: [...state.activity, createActivity(`Applied: ${suggestion.title}`, action.meta)],
                transformations: [
                    ...state.transformations,
                    {
                        id: action.meta.id,
                        timestamp: action.meta.timestamp,
                        suggestionId: suggestion.id,
                        suggestionTitle: suggestion.title,
                        affectedRows: suggestion.affectedRows,
                        action: suggestion.action,
                        changes: result.changes,
                    },
                ],
            };
        }

        case "SUGGESTION_REJECTED": {
            const suggestion = state.suggestions.find(
                (item) => item.id === action.suggestionId
            );

            if (!suggestion || suggestion.status !== "pending") {
                return state;
            }

            return {
                ...state,
                suggestions: state.suggestions.map((item) =>
                    item.id === action.suggestionId
                        ? { ...item, status: "rejected" as const }
                        : item
                ),
                selectedSuggestionId:
                    state.selectedSuggestionId === action.suggestionId
                        ? null
                        : state.selectedSuggestionId,
                activity: [...state.activity, createActivity(`Rejected: ${suggestion.title}`, action.meta)],
            };
        }

        case "CELL_UPDATED": {
            const rowToUpdate = state.rows.find((row) => row.id === action.rowId);
            const beforeValue = rowToUpdate?.values[action.field] ?? null;

            return {
                ...state,
                rows: state.rows.map((row) => {
                    if (row.id !== action.rowId) return row;

                    const nextValues = {
                        ...row.values,
                        [action.field]: action.value,
                    };

                    return {
                        ...row,
                        values: nextValues,
                        searchText: createRowSearchText(nextValues),
                        ...getRowValidationState(nextValues),
                        transformedFields: Array.from(
                            new Set([...(row.transformedFields ?? []), action.field])
                        ),
                    };
                }),
                activity: [
                    ...state.activity,
                    createActivity(`Manually updated row #${action.rowId}`, action.meta),
                ],
                transformations: [
                    ...state.transformations,
                    {
                        id: action.meta.id,
                        timestamp: action.meta.timestamp,
                        suggestionId: "manual-edit",
                        suggestionTitle: `Manual edit on row #${action.rowId}`,
                        affectedRows: [action.rowId],
                        action: "manual_edit",
                        changes: [
                            {
                                rowId: action.rowId,
                                field: action.field,
                                beforeValue,
                                afterValue: action.value,
                            },
                        ],
                    },
                ],
            };
        }
        case "TRANSFORMATION_UNDONE": {
            const transformation = state.transformations.find(
                (item) => item.id === action.transformationId
            );

            if (!transformation || transformation.reverted) {
                return state;
            }

            const updatedRows = state.rows.map((row) => {
                const rowChanges = transformation.changes.filter(
                    (change) => change.rowId === row.id
                );

                if (!rowChanges.length) return row;

                const safeChanges = rowChanges.filter((change) => {
                    return row.values[change.field] === change.afterValue;
                });

                if (!safeChanges.length) return row;

                const revertedValues = safeChanges.reduce(
                    (acc, change) => ({
                        ...acc,
                        [change.field]: change.beforeValue,
                    }),
                    row.values
                );

                const revertedFields = new Set(
                    safeChanges.map((change) => change.field)
                );

                return {
                    ...row,
                    values: revertedValues,
                    searchText: createRowSearchText(revertedValues),
                    ...getRowValidationState(revertedValues),
                    transformedFields: row.transformedFields?.filter(
                        (field) => !revertedFields.has(field)
                    ),
                };
            });

            return {
                ...state,
                rows: updatedRows,
                status: "reviewing",
                suggestions: state.suggestions.map((suggestion) =>
                    suggestion.id === transformation.suggestionId
                        ? { ...suggestion, status: "pending" as const }
                        : suggestion
                ),
                transformations: state.transformations.map((item) =>
                    item.id === action.transformationId
                        ? { ...item, reverted: true }
                        : item
                ),
                activity: [
                    ...state.activity,
                    createActivity(`Reverted: ${transformation.suggestionTitle}`, action.meta),
                ],
            };
        }

        case "ROWS_BULK_MARKED_VALID": {
            return {
                ...state,
                rows: state.rows.map((row) => {
                    if (!action.rowIds.includes(row.id)) return row;

                    return {
                        ...row,
                        transformedFields: Array.from(
                            new Set([...(row.transformedFields ?? []), "__bulk_review__"])
                        ),
                    };
                }),
                activity: [
                    ...state.activity,
                    createActivity(`Bulk reviewed ${action.rowIds.length} dataset rows`, action.meta),
                ],
            };
        }

        case "WORKFLOW_RESTORED":
            return action.state;

        default:
            return state;
    }
}