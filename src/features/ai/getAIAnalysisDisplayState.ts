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

  return {
    isActiveProgress,
    showCoverage: isActiveProgress || state.status === "completed",
    showFallbackCard: isFallbackMode,
    findingsTitle: isFallbackMode
      ? "Deterministic Findings"
      : "AI-Detected Findings",
    emptyFindingsText: isFallbackMode
      ? "No deterministic fallback findings are available."
      : "No separate AI findings are available yet.",
  };
}
