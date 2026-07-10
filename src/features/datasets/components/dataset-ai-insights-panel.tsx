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
import { formatAIModelName } from "@/features/ai/config";
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
  summary:
    "Pattern Discovery starts when you run it. Browser AI loads locally on demand, and deterministic validation remains available if local AI is unavailable.",
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
    label: "New observation",
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

  useEffect(() => {
    return () => {
      runSequenceRef.current += 1;
      activeRunRef.current = runSequenceRef.current;
      browserProvider.interrupt?.();
    };
  }, [browserProvider]);

  useEffect(() => {
    workflowStateRef.current = state;
  }, [state]);

  const displayState = getAIAnalysisDisplayState(analysisState);

  const showProgressPanel = displayState.showCoverage;
  const activeProgress = progress;

  const isLoading =
    analysisState.status === "checking" ||
    analysisState.status === "loading_model" ||
    analysisState.status === "analyzing";

  const canRunPatternDiscovery = state.rows.length > 0 && !isLoading;

  const runAnalysis = async () => {
    const workflowState = workflowStateRef.current;

    if (
      !workflowState.rows.length ||
      !workflowState.datasetId ||
      isLoading
    ) {
      return;
    }

    const runId = runSequenceRef.current + 1;
    runSequenceRef.current = runId;
    activeRunRef.current = runId;

    setLocalFindingStatuses({});
    setProgress(null);
    setAnalysisState({
      ...initialAnalysisState,
      status: "checking",
      providerName: browserProvider.name,
      modelName: browserProvider.modelName,
      totalRows: workflowState.rows.length,
      analysisTargetRows: Math.min(workflowState.rows.length, 15),
      summary:
        "Preparing local AI analysis. If Browser AI is unavailable, CleanFlow will continue using deterministic validation only.",
    });

    try {
      await runProgressiveDatasetAIAnalysis(workflowState, {
        browserProvider,
        onProgress: (nextProgress) => {
          if (activeRunRef.current !== runId) return;

          setProgress(nextProgress);
        },
        onUpdate: (nextState) => {
          if (activeRunRef.current !== runId) return;

          if (
            nextState.status === "completed" ||
            nextState.status === "failed" ||
            nextState.status === "unavailable"
          ) {
            setProgress(null);
          }

          setAnalysisState(nextState);
        },
        isCancelled: () => activeRunRef.current !== runId,
      });
    } catch {
      if (activeRunRef.current === runId) {
        setProgress(null);
        setAnalysisState({
          status: "failed",
          providerName: browserProvider.name,
          modelName: browserProvider.modelName,
          rowsAnalyzed: 0,
          totalRows: workflowState.rows.length,
          analysisTargetRows: Math.min(workflowState.rows.length, 15),
          findings: [],
          summary:
            "Pattern Discovery could not complete. Deterministic validation and Review Queue results remain available.",
          error: "Pattern Discovery could not complete.",
          lastUpdatedAt: new Date().toISOString(),
        });
      }
    }
  };

  const stopAnalysis = () => {
    const nextRunId = runSequenceRef.current + 1;
    runSequenceRef.current = nextRunId;
    activeRunRef.current = nextRunId;

    browserProvider.interrupt?.();

    setProgress(null);
    setAnalysisState((current) => ({
      ...current,
      status: "cancelled",
      summary:
        "Pattern Discovery was stopped before completion. You can restart it at any time. Deterministic validation and Review Queue remain available.",
      error: "Pattern Discovery was stopped.",
      lastUpdatedAt: new Date().toISOString(),
    }));
  };

  const displayFindings = useMemo(() => {
    return analysisState.findings.map((finding) => {
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
    });
  }, [analysisState.findings, localFindingStatuses]);

  const addFinding = (finding: AIFinding) => {
    if (finding.status !== "new") return;

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
      ? "Checking local AI availability"
      : analysisState.status === "loading_model"
        ? "Preparing Pattern Discovery"
        : analysisState.status === "analyzing"
          ? "Discovering supplemental review patterns"
          : analysisState.status === "completed"
            ? "Pattern Discovery complete"
            : "Deterministic summary available";

  const rowCoverageText =
    analysisState.status === "completed"
      ? `Pattern Discovery complete - ${analysisState.rowsAnalyzed} / ${analysisState.totalRows} rows analyzed`
      : `Rows analyzed: ${analysisState.rowsAnalyzed} / ${analysisState.totalRows}`;

  const displayRowCoverageText =
    analysisState.status === "loading_model"
      ? "Rows will be analyzed after the local model loads"
      : analysisState.status === "checking"
        ? "Preparing local analysis"
        : rowCoverageText;

  const summaryText = analysisState.summary;

  const modeLabel =
    analysisState.status === "completed"
      ? "Discovery complete"
      : analysisState.status === "unavailable"
        ? "Deterministic Summary"
        : analysisState.status === "failed"
          ? "Discovery unavailable"
          : analysisState.status === "cancelled"
            ? "Analysis stopped"
            : analysisState.status === "loading_model"
              ? "Starting Analysis"
              : analysisState.status === "checking"
                ? "Checking support"
                : analysisState.status === "analyzing"
                  ? "Analyzing locally"
                  : "Optional discovery";

  const modelLoadPercent =
    activeProgress?.stage === "loading" &&
      typeof activeProgress.progress === "number"
      ? Math.round(activeProgress.progress * 100)
      : null;

  const loadingDetailText = [
    activeProgress?.message,
    modelLoadPercent !== null
      ? `${modelLoadPercent}% downloaded`
      : undefined,
  ]
    .filter(Boolean)
    .join(" - ");

  const activeProgressRatio =
    modelLoadPercent !== null
      ? modelLoadPercent / 100
      : progressRatio;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-2 text-sky-700">
            <BrainCircuit className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Pattern Discovery</h2>
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
                : analysisState.status === "cancelled"
                  ? "border-slate-200 bg-slate-50 text-slate-700"
                  : isLoading
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
            )}
          >
            <Cpu className="h-3.5 w-3.5" />
            {modeLabel}
          </span>

          <Button
            type="button"
            size="sm"
            onClick={runAnalysis}
            disabled={!canRunPatternDiscovery}
          >
            Run Pattern Discovery
          </Button>

          {isLoading ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={stopAnalysis}
            >
              Stop Analysis
            </Button>
          ) : null}
        </div>
      </div>

      {displayState.showFallbackCard ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Deterministic summary is available</p>
              <p className="mt-1">
                Local AI is unavailable on this device or could not complete analysis.
              </p>
              <p className="mt-1">
                Deterministic validation, Review Queue, Records, Audit, and Export remain fully available.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {showProgressPanel ? (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
              )}
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
                  width: `${Math.max(
                    8,
                    Math.round(activeProgressRatio * 100)
                  )}%`
                }}
              />
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>
              {analysisState.status === "analyzing"
                ? `${analysisState.rowsAnalyzed} / ${analysisState.totalRows} rows analyzed`
                : `${displayFindings.length} observations found`}
            </span>

            {loadingDetailText ? <span>{loadingDetailText}</span> : null}
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-xl border border-border bg-muted/10 p-4">
        {summaryText ? (
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Review Guidance Summary
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {summaryText}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Deterministic validation is ready. Run Pattern Discovery for supplemental review guidance.
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
                ? "Deterministic findings come from existing Review Queue evidence."
                : "Supplemental observations never replace deterministic validation."}
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
                finding.kind === "validation" &&
                (finding.status === "already_tracked" ||
                  finding.status === "added_to_review_queue");
              const canAddToReviewQueue = finding.status === "new";
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

                        {finding.kind === "observation" ? (
                          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {finding.category?.replaceAll("_", " ") ??
                              "observation"}
                          </span>
                        ) : (
                          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {finding.severity} severity
                          </span>
                        )}

                        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {Math.round(finding.confidence * 100)}% Review confidence
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {finding.description}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {finding.reasoning}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {finding.targetField ? (
                          <span className="rounded-full border border-border bg-background px-2 py-1">
                            Field: {finding.targetField}
                          </span>
                        ) : null}

                        {finding.kind === "validation" ? (
                          <span className="rounded-full border border-border bg-background px-2 py-1">
                            {finding.affectedRows.length} affected{" "}
                            {finding.affectedRows.length === 1
                              ? "row"
                              : "rows"}
                          </span>
                        ) : null}

                        {finding.kind === "validation" &&
                          finding.suggestedAction ? (
                          <span className="rounded-full border border-border bg-background px-2 py-1">
                            Action:{" "}
                            {finding.suggestedAction.replaceAll("_", " ")}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {canViewRows ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onViewSuggestionRows(suggestionId)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Review rows
                        </Button>
                      ) : null}

                      {canAddToReviewQueue ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addFinding(finding)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add to Review Queue
                        </Button>
                      ) : null}

                      {finding.status === "new" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => dismissFinding(finding)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Dismiss
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        Browser AI loads on demand and runs locally in your browser.
        {modelLabel ? ` - Model: ${modelLabel}` : ""}
      </div>
    </section>
  );
}
