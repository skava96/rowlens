import { DatasetWorkflowState } from "@/features/datasets/types/workflow";
import { AISuggestion } from "@/types/dataset";

import {
  AIAnalysisState,
  AIProvider,
  AIInsightProgress,
  AIModelInsightOutput,
  DatasetInsightInput,
  DatasetInsightResult,
  GenerateDatasetInsightsOptions,
} from "./types";
import { browserAIProvider } from "./browserAIClient";
import { RuleBasedAIProvider } from "./providers/rule-based-ai-provider";
import { matchAIFindingsToSuggestions } from "./matchAIFindingsToSuggestions";
import { createAIRowChunks } from "./createAIRowChunks";
import { mergeAIFindings } from "./mergeAIFindings";
import {
  AI_ANALYSIS_MAX_ROWS,
  AI_AVAILABILITY_TIMEOUT_MS,
  AI_MODEL_LOAD_TIMEOUT_MS,
  AI_ROW_ANALYSIS_TIMEOUT_MS,
} from "./config";

function createAnalysisRows(state: DatasetWorkflowState) {
  return state.rows.slice(0, AI_ANALYSIS_MAX_ROWS).map((row) => ({
    id: row.id,
    values: { ...row.values },
    validationState: row.validationState,
    validationField: row.validationField,
  }));
}

export function createDatasetInsightInput(
  state: DatasetWorkflowState
): DatasetInsightInput {
  return {
    rowCount: state.rows.length,
    columnCount: state.columns.length,
    columns: state.columns.map((column) => ({ ...column })),
    validRowCount: state.rows.filter((row) => row.validationState === "valid")
      .length,
    invalidRowCount: state.rows.filter(
      (row) => row.validationState === "invalid"
    ).length,
    missingRowCount: state.rows.filter(
      (row) => row.validationState === "missing"
    ).length,
    pendingSuggestions: state.suggestions
      .filter((suggestion) => suggestion.status === "pending")
      .map((suggestion) => ({
        id: suggestion.id,
        title: suggestion.title,
        severity: suggestion.severity,
        affectedRows: [...suggestion.affectedRows],
        action: suggestion.action,
        targetField: suggestion.targetField,
      })),
    profile: state.profile,
    analysisRows: createAnalysisRows(state),
  };
}

async function runFallbackProvider(
  input: DatasetInsightInput,
  provider: AIProvider,
  suggestions: AISuggestion[],
  fallbackReason?: string
): Promise<DatasetInsightResult> {
  const output = await provider.generateInsights(input);
  const findings = matchAIFindingsToSuggestions(
    output.findings,
    suggestions
  );

  return {
    providerId: provider.id,
    providerName: provider.name,
    mode: "fallback",
    text: output.summary,
    summary: output.summary,
    findings,
    fallbackReason,
  };
}

export async function generateDatasetInsights(
  state: DatasetWorkflowState,
  options: GenerateDatasetInsightsOptions = {}
): Promise<DatasetInsightResult> {
  const input = createDatasetInsightInput(state);
  const fallbackProvider = options.fallbackProvider ?? new RuleBasedAIProvider();

  if (!options.preferBrowserAI) {
    return runFallbackProvider(input, fallbackProvider, state.suggestions);
  }

  const browserProvider = options.browserProvider ?? browserAIProvider;

  try {
    options.onProgress?.({
      stage: "checking",
      message: "Checking browser AI availability.",
    });

    const availability = await browserProvider.getAvailability();

    if (availability.status !== "available") {
      return runFallbackProvider(
        input,
        fallbackProvider,
        state.suggestions,
        availability.reason ?? "Browser AI is unavailable on this device."
      );
    }

    const output = await browserProvider.generateInsights(
      input,
      options.onProgress
    );
    const findings = matchAIFindingsToSuggestions(
      output.findings,
      state.suggestions
    );

    return {
      providerId: browserProvider.id,
      providerName: browserProvider.name,
      mode: "browser-ai",
      text: output.summary,
      summary: output.summary,
      findings,
    };
  } catch (error) {
    return runFallbackProvider(
      input,
      fallbackProvider,
      state.suggestions,
      error instanceof Error
        ? error.message
        : "Browser AI failed and fallback insights were generated."
    );
  }
}

type ProgressiveBrowserProvider = {
  id: string;
  name: string;
  modelName?: string;
  getAvailability: () => Promise<{ status: "available" | "unavailable"; reason?: string }>;
  loadModel?: (onProgress?: (progress: AIInsightProgress) => void) => Promise<unknown>;
  interrupt?: () => void;
  generateFindingsForRows: (args: {
    input: DatasetInsightInput;
    rows: DatasetInsightInput["analysisRows"];
    rowsAnalyzedStart: number;
    rowsAnalyzedEnd: number;
    previousFindings?: AIModelInsightOutput["findings"];
    onProgress?: (progress: AIInsightProgress) => void;
  }) => Promise<AIModelInsightOutput>;
};

export type ProgressiveAIAnalysisOptions = {
  browserProvider?: ProgressiveBrowserProvider;
  fallbackProvider?: AIProvider;
  onUpdate?: (state: AIAnalysisState) => void;
  onProgress?: (progress: AIInsightProgress) => void;
  isCancelled?: () => boolean;
  availabilityTimeoutMs?: number;
  modelLoadTimeoutMs?: number;
  rowAnalysisTimeoutMs?: number;
};

function createTimeoutError(label: string, timeoutMs: number) {
  return new Error(`${label} timed out after ${timeoutMs}ms.`);
}

function withTimeout<T>({
  promise,
  label,
  timeoutMs,
  onTimeout,
}: {
  promise: Promise<T>;
  label: string;
  timeoutMs: number;
  onTimeout?: () => void;
}): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      onTimeout?.();
      reject(createTimeoutError(label, timeoutMs));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function createBaseAnalysisState(
  input: DatasetInsightInput,
  status: AIAnalysisState["status"]
): AIAnalysisState {
  return {
    status,
    rowsAnalyzed: 0,
    totalRows: input.rowCount,
    analysisTargetRows: input.analysisRows.length,
    findings: [],
    lastUpdatedAt: new Date().toISOString(),
  };
}

function createMergedAnalysisSummary({
  rowsAnalyzed,
  totalRows,
  findings,
}: {
  rowsAnalyzed: number;
  totalRows: number;
  findings: AIModelInsightOutput["findings"];
}) {
  if (findings.length === 0) {
    return `AI analysis complete. ${rowsAnalyzed} of ${totalRows} rows were analyzed, and no separate AI-discovered findings were added beyond deterministic validation.`;
  }

  const severityCounts = findings.reduce(
    (counts, finding) => ({
      ...counts,
      [finding.severity]: counts[finding.severity] + 1,
    }),
    { high: 0, medium: 0, low: 0 }
  );
  const targetFields = Array.from(
    new Set(
      findings
        .map((finding) => finding.targetField)
        .filter((field): field is string => Boolean(field))
    )
  ).slice(0, 3);
  const newFindings = findings.filter(
    (finding) => finding.status === "new"
  ).length;
  const trackedFindings = findings.filter(
    (finding) => finding.status === "already_tracked"
  ).length;

  return [
    `AI analysis complete. ${rowsAnalyzed} of ${totalRows} rows were analyzed.`,
    `${findings.length} findings were discovered (${severityCounts.high} high, ${severityCounts.medium} medium, ${severityCounts.low} low).`,
    targetFields.length
      ? `Top fields: ${targetFields.join(", ")}.`
      : "Findings span row-level patterns.",
    `${trackedFindings} already tracked in Review Queue, ${newFindings} new for review.`,
  ].join(" ");
}

async function createFallbackAnalysisState({
  input,
  state,
  fallbackProvider,
  status,
  error,
}: {
  input: DatasetInsightInput;
  state: DatasetWorkflowState;
  fallbackProvider: AIProvider;
  status: "unavailable" | "failed";
  error?: string;
}): Promise<AIAnalysisState> {
  const output = await fallbackProvider.generateInsights(input);

  return {
    status,
    providerName: fallbackProvider.name,
    rowsAnalyzed: 0,
    totalRows: input.rowCount,
    analysisTargetRows: input.analysisRows.length,
    findings: matchAIFindingsToSuggestions(output.findings, state.suggestions),
    summary: output.summary,
    error: error ? "Browser AI could not complete analysis." : undefined,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function runProgressiveDatasetAIAnalysis(
  state: DatasetWorkflowState,
  options: ProgressiveAIAnalysisOptions = {}
): Promise<AIAnalysisState> {
  const input = createDatasetInsightInput(state);
  const browserProvider = options.browserProvider ?? browserAIProvider;
  const fallbackProvider = options.fallbackProvider ?? new RuleBasedAIProvider();
  const availabilityTimeoutMs =
    options.availabilityTimeoutMs ?? AI_AVAILABILITY_TIMEOUT_MS;
  const modelLoadTimeoutMs =
    options.modelLoadTimeoutMs ?? AI_MODEL_LOAD_TIMEOUT_MS;
  const rowAnalysisTimeoutMs =
    options.rowAnalysisTimeoutMs ?? AI_ROW_ANALYSIS_TIMEOUT_MS;
  const initialState = createBaseAnalysisState(input, "checking");

  options.onUpdate?.({
    ...initialState,
    providerName: browserProvider.name,
    modelName: browserProvider.modelName,
  });

  try {
    const availability = await withTimeout({
      promise: browserProvider.getAvailability(),
      label: "Browser AI availability check",
      timeoutMs: availabilityTimeoutMs,
    });

    if (options.isCancelled?.()) return initialState;

    if (availability.status !== "available") {
      const fallbackState = await createFallbackAnalysisState({
        input,
        state,
        fallbackProvider,
        status: "unavailable",
        error: availability.reason,
      });

      if (!options.isCancelled?.()) options.onUpdate?.(fallbackState);
      return fallbackState;
    }

    const chunks = createAIRowChunks({ rows: input.analysisRows });
    let mergedFindings: AIModelInsightOutput["findings"] = [];
    const latestSummary =
      "Local AI is loading or analyzing sampled rows. Observations will appear if useful supplemental patterns are found.";
    let latestState: AIAnalysisState = {
      status: "loading_model",
      providerName: browserProvider.name,
      modelName: browserProvider.modelName,
      rowsAnalyzed: 0,
      totalRows: input.rowCount,
      analysisTargetRows: input.analysisRows.length,
      findings: [],
      summary: latestSummary,
      lastUpdatedAt: new Date().toISOString(),
    };

    options.onUpdate?.(latestState);

    if (browserProvider.loadModel) {
      await withTimeout({
        promise: browserProvider.loadModel(options.onProgress),
        label: "Browser AI model loading",
        timeoutMs: modelLoadTimeoutMs,
        onTimeout: () => browserProvider.interrupt?.(),
      });
    }

    let completedRowRange = false;
    let completedRowsAnalyzed = 0;

    for (const chunk of chunks) {
      if (options.isCancelled?.()) return latestState;

      let output: AIModelInsightOutput;

      try {
        output = await withTimeout({
          promise: browserProvider.generateFindingsForRows({
            input,
            rows: chunk.rows,
            rowsAnalyzedStart: chunk.startRowNumber,
            rowsAnalyzedEnd: chunk.endRowNumber,
            previousFindings: mergedFindings,
            onProgress: options.onProgress,
          }),
          label: `Browser AI row range ${chunk.startRowNumber}-${chunk.endRowNumber}`,
          timeoutMs: rowAnalysisTimeoutMs,
          onTimeout: () => browserProvider.interrupt?.(),
        });

      } catch (error) {
        console.error("CleanFlow AI row range failed", {
          start: chunk.startRowNumber,
          end: chunk.endRowNumber,
          error,
        });

        if (!completedRowRange) {
          throw error;
        }

        latestState = {
          ...latestState,
          status: "analyzing",
          rowsAnalyzed: completedRowsAnalyzed,
          summary: latestSummary,
          lastUpdatedAt: new Date().toISOString(),
        };
        options.onUpdate?.(latestState);
        continue;
      }

      if (options.isCancelled?.()) return latestState;

      completedRowRange = true;
      completedRowsAnalyzed += chunk.rows.length;
      mergedFindings = mergeAIFindings([
        ...mergedFindings,
        ...output.findings,
      ]);

      const matchedFindings = matchAIFindingsToSuggestions(
        mergedFindings,
        state.suggestions
      );

      latestState = {
        status: "analyzing",
        providerName: browserProvider.name,
        modelName: browserProvider.modelName,
        rowsAnalyzed: completedRowsAnalyzed,
        totalRows: input.rowCount,
        analysisTargetRows: input.analysisRows.length,
        findings: matchedFindings,
        summary: latestSummary,
        lastUpdatedAt: new Date().toISOString(),
      };

      options.onUpdate?.(latestState);
    }

    latestState = {
      ...latestState,
      status: "completed",
      summary: createMergedAnalysisSummary({
        rowsAnalyzed: latestState.rowsAnalyzed,
        totalRows: input.rowCount,
        findings: latestState.findings,
      }),
      lastUpdatedAt: new Date().toISOString(),
    };
    options.onUpdate?.(latestState);

    return latestState;
  } catch (error) {
    console.error("[AI] fallback entered", error);
    console.error("CleanFlow AI fallback entered", error);

    const fallbackState = await createFallbackAnalysisState({
      input,
      state,
      fallbackProvider,
      status: "failed",
      error:
        error instanceof Error
          ? error.message
          : "Browser AI analysis failed.",
    });

    console.error("[AI] failed");

    console.error(
      error instanceof Error
        ? error
        : new Error("Browser AI analysis failed.")
    );

    if (!options.isCancelled?.()) options.onUpdate?.(fallbackState);
    return fallbackState;
  }
}
