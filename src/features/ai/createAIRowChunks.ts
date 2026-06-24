import { DatasetInsightAnalysisRow } from "./types";
import {
  AI_ANALYSIS_MAX_ROWS,
  AI_ANALYSIS_ROW_CHUNK_SIZE,
} from "./config";

export type AIRowChunk = {
  rows: DatasetInsightAnalysisRow[];
  startRowNumber: number;
  endRowNumber: number;
};

export function createAIRowChunks({
  rows,
  chunkSize = AI_ANALYSIS_ROW_CHUNK_SIZE,
  maxRows = AI_ANALYSIS_MAX_ROWS,
}: {
  rows: DatasetInsightAnalysisRow[];
  chunkSize?: number;
  maxRows?: number;
}): AIRowChunk[] {
  const rowsToAnalyze = rows.slice(0, maxRows);
  const chunks: AIRowChunk[] = [];

  for (let index = 0; index < rowsToAnalyze.length; index += chunkSize) {
    const chunkRows = rowsToAnalyze.slice(index, index + chunkSize);

    chunks.push({
      rows: chunkRows,
      startRowNumber: index + 1,
      endRowNumber: index + chunkRows.length,
    });
  }

  return chunks;
}
