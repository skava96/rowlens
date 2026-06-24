export const AI_ANALYSIS_ROW_CHUNK_SIZE = 5;
export const AI_ANALYSIS_MAX_ROWS = 30;

export const AI_AVAILABILITY_TIMEOUT_MS = 10_000;
export const AI_MODEL_LOAD_TIMEOUT_MS = 300_000;
export const AI_ROW_ANALYSIS_TIMEOUT_MS = 300_000;
export const AI_STUCK_ANALYSIS_TIMEOUT_MS = 300_000;

export const AI_MAX_FINDINGS_PER_CHUNK = 2;
export const AI_MAX_PREVIOUS_FINDINGS = 0;
export const AI_MAX_PROMPT_CHARACTERS = 1600;

export const AI_MODEL_STABLE = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
export const AI_MODEL_BETTER = "Qwen3.5-0.8B-q4f32_1-MLC";

export const AI_DEFAULT_MODEL = AI_MODEL_BETTER;

export function formatAIModelName(modelName: string) {
  if (modelName === AI_MODEL_STABLE) return "Qwen2.5 0.5B";
  if (modelName === AI_MODEL_BETTER) return "Qwen3.5 0.8B";

  return modelName;
}