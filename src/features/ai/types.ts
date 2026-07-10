import { DatasetWorkflowState } from "@/features/datasets/types/workflow";
import { DatasetCellValue } from "@/types/dataset";

export type AIAvailabilityStatus = "available" | "unavailable";

export type AIAvailability = {
  status: AIAvailabilityStatus;
  reason?: string;
};

export type BrowserAIPreloadStatus =
  | "idle"
  | "checking"
  | "loading"
  | "ready"
  | "unavailable"
  | "failed";

export type BrowserAIPreloadResult = {
  status: BrowserAIPreloadStatus;
  reason?: string;
};

export type AIInsightProgressStage =
  | "idle"
  | "checking"
  | "loading"
  | "generating"
  | "analyzing"
  | "fallback"
  | "complete"
  | "error";

export type AIInsightProgress = {
  stage: AIInsightProgressStage;
  message: string;
  progress?: number;
};

export type DatasetInsightSuggestionInput = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  affectedRows: number[];
  action: string;
  targetField?: string;
};

export type DatasetInsightAnalysisRow = {
  id: number;
  values: Record<string, DatasetCellValue>;
  validationState: "valid" | "missing" | "invalid";
  validationField?: string;
};

export type DatasetProfileSummary = {
  rowCount: number;
  columnCount: number;
  validationScore?: number;
};

export type ValidationSummary = {
  validRows: number;
  missingRows: number;
  invalidRows: number;
};

export type ReviewQueueSummary = {
  pending: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  topIssueFields: string[];
};

export type ColumnSignal = {
  field: string;
  completeness?: number;
  uniqueValues?: number;
};

export type AICandidatePattern = {
  id: string;
  type:
    | "format_inconsistency"
    | "categorical_alias"
    | "placeholder_value"
    | "numeric_outlier";

  title: string;
  description: string;

  targetField: string;

  affectedRows: number[];

  evidence: Array<{
    rowId: number;
    value: string;
  }>;

  suggestedAction: "flag_invalid" | "standardize_value";

  severity: "low" | "medium" | "high";
};

export type AIColumnEvidence = {
  field: string;
  label: string;
  completeness: number;
  distinctCount: number;
  topValues: {
    value: string;
    count: number;
  }[];
  textExamples: string[];
  numericSummary?: {
    min: number;
    median: number;
    max: number;
  };
};

export type DatasetInsightInput = {
  rowCount: number;
  columnCount: number;
  columns: { key: string; label: string }[];
  validRowCount: number;
  invalidRowCount: number;
  missingRowCount: number;
  pendingSuggestions: DatasetInsightSuggestionInput[];
  profile: DatasetWorkflowState["profile"];
  analysisRows: DatasetInsightAnalysisRow[];
  datasetProfile: DatasetProfileSummary;
  validationSummary: ValidationSummary;
  reviewQueueSummary: ReviewQueueSummary;
  columnSignals: ColumnSignal[];
  candidatePatterns: AICandidatePattern[];
  aiColumnEvidence: AIColumnEvidence[];
};

export type DatasetInsightMode = "fallback" | "browser-ai";

export type AIFindingSource = "browser-ai" | "rule-based";

export type AIFindingStatus =
  | "new"
  | "already_tracked"
  | "added_to_review_queue"
  | "dismissed";

export type AIFindingKind = "validation" | "observation";

export type AIObservationCategory =
  | "pattern"
  | "business_context"
  | "review_priority"
  | "data_quality_summary";

export type AIFinding = {
  id: string;
  kind: AIFindingKind;
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  severity: "low" | "medium" | "high";
  targetField?: string;
  affectedRows: number[];
  suggestedAction?: "flag_invalid" | "standardize_value" | "fill_missing";
  suggestedValue?: DatasetCellValue;
  source: AIFindingSource;
  status: AIFindingStatus;
  matchedSuggestionId?: string;
  category?: AIObservationCategory;
};

export type AIModelInsightOutput = {
  summary: string;
  findings: AIFinding[];
};

export type AIAnalysisStatus =
  | "idle"
  | "checking"
  | "loading_model"
  | "analyzing"
  | "completed"
  | "cancelled"
  | "failed"
  | "unavailable";

export type AIAnalysisState = {
  status: AIAnalysisStatus;
  providerName?: string;
  modelName?: string;
  rowsAnalyzed: number;
  totalRows: number;
  analysisTargetRows: number;
  findings: AIFinding[];
  summary?: string;
  error?: string;
  lastUpdatedAt?: string;
};

export type DatasetInsightResult = {
  providerId: string;
  providerName: string;
  mode: DatasetInsightMode;
  text: string;
  summary: string;
  findings: AIFinding[];
  fallbackReason?: string;
};

export interface AIProvider {
  id: string;
  name: string;
  getAvailability(): Promise<AIAvailability>;
  generateInsights(
    input: DatasetInsightInput,
    onProgress?: (progress: AIInsightProgress) => void
  ): Promise<AIModelInsightOutput>;
}

export type GenerateDatasetInsightsOptions = {
  preferBrowserAI?: boolean;
  browserProvider?: AIProvider;
  fallbackProvider?: AIProvider;
  onProgress?: (progress: AIInsightProgress) => void;
};
