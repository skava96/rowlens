import { ParsedDataset } from "../utils/parseDatasetFile";
import { DatasetWorkflowState } from "../types/workflow";
import { analyzeDataset } from "../utils/analyzeDataset";
import { profileDataset } from "../utils/profileDataset";
import { applySuggestionToRows } from "../utils/applySuggestion";
import { getRowValidationState } from "../utils/getRowValidationState";
import { createRowSearchText } from "../utils/createRowSearchText";
import { rowHasSuggestionIssue } from "../utils/validateDatasetRow";
import { AISuggestion, DatasetRow } from "@/types/dataset";
import { AIFinding } from "@/features/ai/types";
type WorkflowMeta = {
    id: string;
    timestamp: string;
};

type ReviewQueueEligibleAIFinding = AIFinding & {
    kind: "validation";
    suggestedAction: NonNullable<AIFinding["suggestedAction"]>;
    affectedRows: number[];
};

function createActivity(label: string, meta: WorkflowMeta) {
    return {
        id: meta.id,
        time: meta.timestamp,
        label,
    };
}

function rowStillNeedsSuggestion(row: DatasetRow, suggestion: AISuggestion) {
    return rowHasSuggestionIssue(row.values, suggestion);
}

function reconcilePendingSuggestions(
    rows: DatasetRow[],
    suggestions: AISuggestion[]
) {
    return suggestions.map((suggestion) => {
        if (
            suggestion.status !== "pending" &&
            suggestion.status !== "resolved"
        ) {
            return suggestion;
        }

        const affectedRows = rows.filter((row) =>
            suggestion.affectedRows.includes(row.id)
        );

        const resolvedRows = affectedRows
            .filter((row) => !rowStillNeedsSuggestion(row, suggestion))
            .map((row) => row.id);

        const allResolved =
            suggestion.affectedRows.length > 0 &&
            resolvedRows.length === suggestion.affectedRows.length;

        return {
            ...suggestion,
            status: allResolved ? "resolved" as const : "pending" as const,
            resolvedRows,
        };
    });
}

function getWorkflowStatus(
    currentStatus: DatasetWorkflowState["status"],
    suggestions: AISuggestion[]
) {
    if (suggestions.every((item) => item.status !== "pending")) {
        return "completed";
    }

    return currentStatus === "completed" ? "reviewing" : currentStatus;
}

function getAIReviewSuggestionId(finding: AIFinding) {
    return `ai-review-${finding.id}`;
}

function isReviewQueueEligibleAIFinding(
    finding: AIFinding
): finding is ReviewQueueEligibleAIFinding {
    return (
        finding.kind === "validation" &&
        finding.suggestedAction !== undefined &&
        finding.affectedRows.length > 0
    );
}

function isSafeSuggestedAction(finding: AIFinding) {
    return (
        (finding.suggestedAction === "standardize_value" ||
            finding.suggestedAction === "fill_missing") &&
        finding.suggestedValue !== undefined
    );
}

function createSuggestionFromAIFinding(finding: AIFinding): AISuggestion {
    if (!isReviewQueueEligibleAIFinding(finding)) {
        throw new Error("Only validation AI findings can be added to the review queue.");
    }

    const action: AISuggestion["action"] = isSafeSuggestedAction(finding)
        ? finding.suggestedAction
        : "flag_invalid";

    return {
        id: getAIReviewSuggestionId(finding),
        type: action === "fill_missing" ? "missing" : "validation",
        title: finding.title,
        description: `${finding.description} AI reasoning: ${finding.reasoning}`,
        confidence: Math.round(finding.confidence * 100),
        affectedRows: [...finding.affectedRows],
        severity: finding.severity,
        status: "pending",
        action,
        targetField: finding.targetField,
        suggestedValue: isSafeSuggestedAction(finding)
            ? finding.suggestedValue
            : undefined,
        source: "ai-finding",
        aiFindingId: finding.id,
        reasoning: finding.reasoning,
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
    | { type: "SUGGESTION_IGNORED"; suggestionId: string; meta: WorkflowMeta }
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
    | { type: "AI_FINDING_ADDED_TO_REVIEW_QUEUE"; finding: AIFinding; meta: WorkflowMeta }
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
    auditEvents: [],
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
                profile: profileDataset(state.columns, result.rows),
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
                auditEvents: [
                    ...state.auditEvents,
                    {
                        id: action.meta.id,
                        timestamp: action.meta.timestamp,
                        source: "ai-suggestion",
                        actor: "local-user",
                        operation: `Applied suggestion: ${suggestion.title}`,
                        rowIds: suggestion.affectedRows,
                        fieldChanges: result.changes,
                        status: "applied",
                    },
                ],
            };
        }

        case "SUGGESTION_IGNORED": {
            const suggestion = state.suggestions.find(
                (item) => item.id === action.suggestionId
            );

            if (!suggestion || suggestion.status !== "pending") {
                return state;
            }

            const updatedSuggestions = state.suggestions.map((item) =>
                item.id === action.suggestionId
                    ? { ...item, status: "ignored" as const }
                    : item
            );

            const allResolved = updatedSuggestions.every(
                (item) => item.status !== "pending"
            );

            return {
                ...state,
                status: allResolved ? "completed" : state.status,
                suggestions: updatedSuggestions,
                selectedSuggestionId:
                    state.selectedSuggestionId === action.suggestionId
                        ? null
                        : state.selectedSuggestionId,
                activity: [
                    ...state.activity,
                    createActivity(`Ignored: ${suggestion.title}`, action.meta),
                ],
                auditEvents: [
                    ...state.auditEvents,
                    {
                        id: action.meta.id,
                        timestamp: action.meta.timestamp,
                        source: "ai-suggestion",
                        actor: "local-user",
                        operation: `Ignored suggestion: ${suggestion.title}`,
                        rowIds: suggestion.affectedRows,
                        status: "ignored",
                    },
                ],
            };
        }

        case "CELL_UPDATED": {
            const rowToUpdate = state.rows.find((row) => row.id === action.rowId);
            const beforeValue = rowToUpdate?.values[action.field] ?? null;
            const updatedRows = state.rows.map((row) => {
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
            });

            const updatedSuggestions = reconcilePendingSuggestions(
                updatedRows,
                state.suggestions
            );

            return {
                ...state,
                rows: updatedRows,
                suggestions: updatedSuggestions,
                status: getWorkflowStatus(state.status, updatedSuggestions),
                profile: profileDataset(state.columns, updatedRows),
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
                auditEvents: [
                    ...state.auditEvents,
                    {
                        id: action.meta.id,
                        timestamp: action.meta.timestamp,
                        source: "manual-edit",
                        actor: "local-user",
                        operation: `Manual edit on row #${action.rowId}`,
                        rowIds: [action.rowId],
                        fieldChanges: [
                            {
                                rowId: action.rowId,
                                field: action.field,
                                beforeValue,
                                afterValue: action.value,
                            },
                        ],
                        status: "applied",
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

            const totalChangeCount = transformation.changes.length;

            const revertedChangeCount = state.rows.reduce((count, row) => {
                const rowChanges = transformation.changes.filter(
                    (change) => change.rowId === row.id
                );

                const safeChanges = rowChanges.filter((change) => {
                    return row.values[change.field] === change.afterValue;
                });

                return count + safeChanges.length;
            }, 0);

            const revertStatus =
                revertedChangeCount === totalChangeCount
                    ? "reverted"
                    : "partial_conflict";

            const updatedSuggestions = reconcilePendingSuggestions(
                updatedRows,
                state.suggestions.map((suggestion) =>
                    suggestion.id === transformation.suggestionId &&
                        revertStatus === "reverted"
                        ? { ...suggestion, status: "pending" as const }
                        : suggestion
                )
            );

            return {
                ...state,
                rows: updatedRows,
                profile: profileDataset(state.columns, updatedRows),
                status: "reviewing",
                suggestions: updatedSuggestions,
                transformations: state.transformations.map((item) =>
                    item.id === action.transformationId
                        ? { ...item, reverted: revertStatus === "reverted", revertStatus, }
                        : item
                ),
                activity: [
                    ...state.activity,
                    createActivity(
                        revertStatus === "reverted"
                            ? `Reverted: ${transformation.suggestionTitle}`
                            : `Partial revert conflict: ${transformation.suggestionTitle}`,
                        action.meta
                    )
                ],
                auditEvents: [
                    ...state.auditEvents,
                    {
                        id: action.meta.id,
                        timestamp: action.meta.timestamp,
                        source: "undo",
                        actor: "local-user",
                        operation:
                            revertStatus === "reverted"
                                ? `Reverted transformation: ${transformation.suggestionTitle}`
                                : `Partial revert conflict: ${transformation.suggestionTitle}`,
                        rowIds: transformation.affectedRows,
                        fieldChanges: transformation.changes,
                        status: revertStatus,
                    },
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
                        reviewState: "reviewed" as const,
                    };
                }),
                activity: [
                    ...state.activity,
                    createActivity(`Bulk reviewed ${action.rowIds.length} dataset rows`, action.meta),
                ],
                auditEvents: [
                    ...state.auditEvents,
                    {
                        id: action.meta.id,
                        timestamp: action.meta.timestamp,
                        source: "bulk-review",
                        actor: "local-user",
                        operation: `Bulk reviewed ${action.rowIds.length} rows`,
                        rowIds: action.rowIds,
                        status: "applied",
                    },
                ],
            };
        }

        case "AI_FINDING_ADDED_TO_REVIEW_QUEUE": {
            const finding = action.finding;
            if (!isReviewQueueEligibleAIFinding(finding)) {
                return state;
            }
            const suggestionId = getAIReviewSuggestionId(finding);

            const alreadyExists = state.suggestions.some((suggestion) => {
                return (
                    suggestion.id === suggestionId ||
                    suggestion.aiFindingId === finding.id ||
                    (suggestion.targetField === finding.targetField &&
                        suggestion.action === finding.suggestedAction &&
                        suggestion.affectedRows.some((rowId) =>
                            finding.affectedRows.includes(rowId)
                        ))
                );
            });

            if (alreadyExists) {
                return state;
            }

            const suggestion = createSuggestionFromAIFinding(finding);

            return {
                ...state,
                status: state.status === "completed" ? "reviewing" : state.status,
                suggestions: [...state.suggestions, suggestion],
                activity: [
                    ...state.activity,
                    createActivity(`AI finding added to review queue: ${finding.title}`, action.meta),
                ],
                auditEvents: [
                    ...state.auditEvents,
                    {
                        id: action.meta.id,
                        timestamp: action.meta.timestamp,
                        source: "ai-suggestion",
                        actor: "local-user",
                        operation: `AI finding added to review queue: ${finding.title}`,
                        rowIds: finding.affectedRows,
                        status: "applied",
                    },
                ],
            };
        }

        case "WORKFLOW_RESTORED":
            return action.state;

        default:
            return state;
    }
}
