export const AI_ANALYSIS_ROW_CHUNK_SIZE = 5;
export const AI_ANALYSIS_MAX_ROWS = 50;

export const AI_AVAILABILITY_TIMEOUT_MS = 10_000;
export const AI_MODEL_LOAD_TIMEOUT_MS = 180_000;
export const AI_ROW_ANALYSIS_TIMEOUT_MS = 180_000;
export const AI_STUCK_ANALYSIS_TIMEOUT_MS = 180_000;

export const AI_MAX_FINDINGS_PER_CHUNK = 2;
export const AI_MAX_PREVIOUS_FINDINGS = 5;
export const AI_MAX_PROMPT_CHARACTERS = 1800;

export const AI_MODEL_STABLE = "Qwen3.5-0.8B-q4f32_1-MLC";
export const AI_MODEL_BETTER = "gemma-3-1b-it-q4f16_1-MLC";

export const AI_DEFAULT_MODEL = AI_MODEL_STABLE;

export function formatAIModelName(modelName: string) {
  if (modelName === AI_MODEL_STABLE) return "Qwen3.5 0.8B";
  if (modelName === AI_MODEL_BETTER) return "gemma-3-1b";

  return modelName;
}