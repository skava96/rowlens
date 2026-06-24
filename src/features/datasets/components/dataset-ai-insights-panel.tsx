"use client";

import {
  BrainCircuit,
  Cpu,
  Eye,
  Loader2,
  Plus,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AIAnalysisState,
  AIFinding,
  AIInsightProgress,
} from "@/features/ai/types";
import { browserAIProvider } from "@/features/ai/browserAIClient";
import { runProgressiveDatasetAIAnalysis } from "@/features/ai/generateDatasetInsights";
import { DatasetWorkflowState } from "@/features/datasets/types/workflow";
import {
  AI_STUCK_ANALYSIS_TIMEOUT_MS,
  formatAIModelName,
} from "@/features/ai/config";
import { getAIAnalysisDisplayState } from "@/features/ai/getAIAnalysisDisplayState";

type DatasetAIInsightsPanelProps = {
  state: DatasetWorkflowState;
  onAddFindingToReviewQueue: (finding: AIFinding) => void;
  onViewSuggestionRows: (suggestionId: string) => void;
};

const initialAnalysisState: AIAnalysisState = {
  status: "idle",
  rowsAnalyzed: 0,
  totalRows: 0,
  analysisTargetRows: 0,
  findings: [],
};

function getAIReviewSuggestionId(finding: AIFinding) {
  return `ai-review-${finding.id}`;
}

function getFindingStatusMeta(status: AIFinding["status"]) {
  if (status === "already_tracked") {
    return {
      label: "Already in Review Queue",
      className: "border-sky-200 bg-sky-50 text-sky-700",
    };
  }

  if (status === "added_to_review_queue") {
    return {
      label: "Added to Review Queue",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "dismissed") {
    return {
      label: "Dismissed",
      className: "border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  return {
    label: "New finding",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  };
}

export function DatasetAIInsightsPanel({
  state,
  onAddFindingToReviewQueue,
  onViewSuggestionRows,
}: DatasetAIInsightsPanelProps) {
  const [analysisState, setAnalysisState] =
    useState<AIAnalysisState>(initialAnalysisState);
  const [progress, setProgress] = useState<AIInsightProgress | null>(null);
  const [localFindingStatuses, setLocalFindingStatuses] = useState<
    Record<string, AIFinding["status"]>
  >({});
  const activeRunRef = useRef<number | null>(null);
  const runSequenceRef = useRef(0);
  const workflowStateRef = useRef(state);

  const browserProvider = browserAIProvider;

  const analysisTriggerKey = useMemo(() => {
    return [
      state.status,
      state.datasetId,
      state.fileName,
      state.rows.length,
    ].join(":");
  }, [state.datasetId, state.fileName, state.rows.length, state.status]);

  useEffect(() => {
    console.info("[AI] panel mounted");

    return () => {
      console.info("[AI] panel unmounted");
    };
  }, []);

  useEffect(() => {
    workflowStateRef.current = state;
  }, [state]);

  useEffect(() => {
    const workflowState = workflowStateRef.current;

    if (!workflowState.rows.length || !workflowState.datasetId) return;

    let cancelled = false;
    const runId = runSequenceRef.current + 1;
    runSequenceRef.current = runId;
    activeRunRef.current = runId;

    const startAnalysis = async () => {
      console.info("[AI] auto analysis start", {
        runId,
        analysisTriggerKey,
        datasetId: workflowState.datasetId,
        rows: workflowState.rows.length,
        columns: workflowState.columns.length,
      });

      setLocalFindingStatuses({});
      setProgress(null);
      setAnalysisState({
        ...initialAnalysisState,
        status: "checking",
        providerName: browserProvider.name,
        modelName: browserProvider.modelName,
        totalRows: workflowState.rows.length,
        analysisTargetRows: workflowState.rows.length,
      });

      await runProgressiveDatasetAIAnalysis(workflowState, {
        browserProvider,
        onProgress: (nextProgress) => {
          if (!cancelled && activeRunRef.current === runId) {
            setProgress(nextProgress);
          }
        },
        onUpdate: (nextState) => {
          if (!cancelled && activeRunRef.current === runId) {
            console.info("[AI] state update", {
              runId,
              status: nextState.status,
              rowsAnalyzed: nextState.rowsAnalyzed,
              totalRows: nextState.totalRows,
              analysisTargetRows: nextState.analysisTargetRows,
              findings: nextState.findings.length,
              summary: nextState.summary,
              error: nextState.error,
            });

            if (
              nextState.status === "completed" ||
              nextState.status === "failed" ||
              nextState.status === "unavailable"
            ) {
              setProgress(null);
            }

            setAnalysisState(nextState);
          }
        },
        isCancelled: () => cancelled || activeRunRef.current !== runId,
      });
    };

    startAnalysis().catch((error) => {
      console.error("[AI] failed", error);
      console.error("CleanFlow browser AI analysis failed", error);

      if (!cancelled && activeRunRef.current === runId) {
        setAnalysisState({
          status: "failed",
          providerName: browserProvider.name,
          modelName: browserProvider.modelName,
          rowsAnalyzed: 0,
          totalRows: workflowState.rows.length,
          analysisTargetRows: workflowState.rows.length,
          findings: [],
          summary:
            "Browser AI could not complete analysis. Deterministic insights are still available.",
          error: "Browser AI could not complete analysis.",
          lastUpdatedAt: new Date().toISOString(),
        });
        setProgress(null);
      }
    });

    return () => {
      cancelled = true;
      browserProvider.interrupt?.();
    };
  }, [browserProvider, analysisTriggerKey]);

  useEffect(() => {
    const isStuckAtStart =
      (analysisState.status === "loading_model" ||
        analysisState.status === "analyzing") &&
      analysisState.rowsAnalyzed === 0;

    if (!isStuckAtStart) return;

    const timeoutId = setTimeout(() => {
      console.error("[AI] failed", {
        reason: "Timed out before row progress",
        status: analysisState.status,
        rowsAnalyzed: analysisState.rowsAnalyzed,
      });
      console.error("CleanFlow browser AI analysis timed out before row progress", {
        status: analysisState.status,
        rowsAnalyzed: analysisState.rowsAnalyzed,
      });

      const nextRunId = runSequenceRef.current + 1;
      runSequenceRef.current = nextRunId;
      activeRunRef.current = nextRunId;
      setProgress(null);
      setAnalysisState((current) => ({
        ...current,
        status: "failed",
        rowsAnalyzed: 0,
        findings: [],
        summary:
          "Browser AI could not complete analysis. Deterministic insights are still available.",
        error: "Browser AI could not complete analysis.",
        lastUpdatedAt: new Date().toISOString(),
      }));
    }, AI_STUCK_ANALYSIS_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [analysisState.rowsAnalyzed, analysisState.status]);

  const displayFindings = useMemo(() => {
    return (
      analysisState.findings.map((finding) => {
        const localStatus = localFindingStatuses[finding.id];

        if (!localStatus) return finding;

        return {
          ...finding,
          status: localStatus,
          matchedSuggestionId:
            localStatus === "added_to_review_queue"
              ? getAIReviewSuggestionId(finding)
              : finding.matchedSuggestionId,
        };
      })
    );
  }, [analysisState.findings, localFindingStatuses]);

  const addFinding = (finding: AIFinding) => {
    onAddFindingToReviewQueue(finding);
    setLocalFindingStatuses((current) => ({
      ...current,
      [finding.id]: "added_to_review_queue",
    }));
  };

  const dismissFinding = (finding: AIFinding) => {
    setLocalFindingStatuses((current) => ({
      ...current,
      [finding.id]: "dismissed",
    }));
  };

  const displayState = getAIAnalysisDisplayState(analysisState);

  const isLoading =
    analysisState.status === "checking" ||
    analysisState.status === "loading_model" ||
    analysisState.status === "analyzing";

  const rowsToAnalyze = analysisState.analysisTargetRows || state.rows.length;
  const progressRatio =
    rowsToAnalyze === 0
      ? 0
      : Math.min(1, analysisState.rowsAnalyzed / rowsToAnalyze);

  const modelLabel = analysisState.modelName
    ? formatAIModelName(analysisState.modelName)
    : undefined;
  const progressTitle =
    analysisState.status === "checking"
      ? "Checking browser AI availability"
      : analysisState.status === "loading_model"
        ? "Loading browser AI model"
        : analysisState.status === "analyzing"
          ? "AI is analyzing rows in the background"
          : analysisState.status === "completed"
            ? "AI analysis complete"
            : "Deterministic insights are available";
  const rowCoverageText =
    analysisState.status === "completed"
      ? `AI analysis complete · ${analysisState.rowsAnalyzed} of ${analysisState.totalRows} rows analyzed`
      : `Rows analyzed: ${analysisState.rowsAnalyzed} of ${analysisState.totalRows}`;

  const displayRowCoverageText =
    analysisState.status === "loading_model"
      ? "Rows will be analyzed after the local model loads"
      : analysisState.status === "checking"
        ? "Preparing local analysis"
        : rowCoverageText;

  const modeLabel =
    analysisState.status === "completed"
      ? "AI complete"
      : analysisState.status === "unavailable" ||
        analysisState.status === "failed"
        ? "Fallback insights"
        : analysisState.status === "loading_model"
          ? "AI loading"
          : analysisState.status === "checking"
            ? "AI checking"
            : analysisState.status === "analyzing"
              ? "AI analyzing"
              : "Fallback insights";

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-2 text-sky-700">
            <BrainCircuit className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">AI Insights</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Browser-side AI generates review guidance. Deterministic
              validation remains the source of truth.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium",
              analysisState.status === "completed"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : isLoading
                  ? "border-sky-200 bg-sky-50 text-sky-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
            )}
          >
            <Cpu className="h-3.5 w-3.5" />
            {modeLabel}
          </span>
        </div>
      </div>

      {displayState.showFallbackCard ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Deterministic insights are available</p>
              <p className="mt-1">
                Browser AI could not complete analysis on this device.
              </p>
              <p className="mt-1">
                Review Queue and deterministic validation are still available.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {displayState.showCoverage ? (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-sky-600" />}
              <p className="text-sm font-medium text-foreground">
                {progressTitle}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              {displayRowCoverageText}
            </p>
          </div>

          {displayState.isActiveProgress ? (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width:
                    progressRatio === 0
                      ? "0%"
                      : `${Math.round(progressRatio * 100)}%`,
                }}
              />
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{displayFindings.length} findings discovered</span>
            {progress?.message && isLoading && <span>{progress.message}</span>}
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-xl border border-border bg-muted/10 p-4">
        {analysisState.summary ? (
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              AI Summary
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {analysisState.summary}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Preparing dataset insights...
          </p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-background p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {displayState.findingsTitle}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {displayState.showFallbackCard
                ? "Fallback findings come from deterministic Review Queue evidence."
                : "Findings are discovery-only until added to the Review Queue."}
            </p>
          </div>
        </div>

        {displayFindings.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            {displayState.emptyFindingsText}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {displayFindings.map((finding) => {
              const statusMeta = getFindingStatusMeta(finding.status);
              const canViewRows =
                finding.status === "already_tracked" ||
                finding.status === "added_to_review_queue";
              const suggestionId =
                finding.matchedSuggestionId ?? getAIReviewSuggestionId(finding);

              return (
                <article
                  key={finding.id}
                  className="rounded-xl border border-border bg-muted/10 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">
                          {finding.title}
                        </h4>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            statusMeta.className
                          )}
                        >
                          {statusMeta.label}
                        </span>
                        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {finding.severity} severity
                        </span>
                        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {Math.round(finding.confidence * 100)}% confidence
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {finding.description}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {finding.reasoning}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {finding.targetField && (
                          <span className="rounded-full border border-border bg-background px-2 py-1">
                            Field: {finding.targetField}
                          </span>
                        )}
                        <span className="rounded-full border border-border bg-background px-2 py-1">
                          {finding.affectedRows.length} affected{" "}
                          {finding.affectedRows.length === 1 ? "row" : "rows"}
                        </span>
                        {finding.kind === "validation" && finding.suggestedAction && (
                          <span className="rounded-full border border-border bg-background px-2 py-1">
                            Action: {finding.suggestedAction.replaceAll("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {canViewRows && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onViewSuggestionRows(suggestionId)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Review rows
                        </Button>
                      )}

                      {finding.status === "new" && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addFinding(finding)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add to Review Queue
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissFinding(finding)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Dismiss
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        Provider: {analysisState.providerName ?? "Preparing insights"}
        {modelLabel ? ` · Model: ${modelLabel}` : ""}. No API key or backend
        model server is used.
      </div>
    </section>
  );
}
