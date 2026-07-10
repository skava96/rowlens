import { AIAnalysisState } from "./types";

const activeProgressStatuses: AIAnalysisState["status"][] = [
  "checking",
  "loading_model",
  "analyzing",
];

export function getAIAnalysisDisplayState(state: AIAnalysisState) {
  const isFallbackMode =
    state.status === "failed" || state.status === "unavailable";
  const isActiveProgress = activeProgressStatuses.includes(state.status);
  const isCancelled = state.status === "cancelled";

  return {
    isActiveProgress,
    showCoverage: isActiveProgress || state.status === "completed",
    showFallbackCard: isFallbackMode,

    findingsTitle: isCancelled
      ? "Supplemental Observations"
      : isFallbackMode
        ? "Deterministic Findings"
        : "Supplemental Observations",

    emptyFindingsText: isCancelled
      ? "Pattern Discovery was stopped before supplemental observations were generated."
      : isFallbackMode
        ? "No deterministic fallback findings are available."
        : "No additional supplemental observations were found yet.",
  };
}
