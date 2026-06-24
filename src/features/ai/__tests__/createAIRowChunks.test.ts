import { describe, expect, it } from "vitest";

import { createAIRowChunks } from "../createAIRowChunks";
import { DatasetInsightAnalysisRow } from "../types";

function createRows(count: number): DatasetInsightAnalysisRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    values: { value: index + 1 },
    validationState: "valid",
  }));
}

describe("createAIRowChunks", () => {
  it("creates row chunks with human-readable analyzed ranges", () => {
    const chunks = createAIRowChunks({
      rows: createRows(7),
      chunkSize: 3,
      maxRows: 10,
    });

    expect(chunks.map((chunk) => [chunk.startRowNumber, chunk.endRowNumber])).toEqual([
      [1, 3],
      [4, 6],
      [7, 7],
    ]);
  });

  it("limits rows to the configured max", () => {
    const chunks = createAIRowChunks({
      rows: createRows(10),
      chunkSize: 4,
      maxRows: 6,
    });

    expect(chunks.at(-1)?.endRowNumber).toBe(6);
  });

  it("limits default row ranges to the configured analysis cap", () => {
    const chunks = createAIRowChunks({
      rows: createRows(5000),
    });

    expect(chunks).toHaveLength(6);
    expect(chunks[0]).toMatchObject({
      startRowNumber: 1,
      endRowNumber: 5,
    });
    expect(chunks.at(-1)).toMatchObject({
      startRowNumber: 26,
      endRowNumber: 30,
    });
  });
});
