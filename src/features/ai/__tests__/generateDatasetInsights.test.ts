import { describe, expect, it } from "vitest";

import {
  createDatasetInsightInput,
  generateDatasetInsights,
  runProgressiveDatasetAIAnalysis,
} from "../generateDatasetInsights";
import { RuleBasedAIProvider } from "../providers/rule-based-ai-provider";
import { createWebLLMPrompt } from "../providers/browser-ai-provider";
import { AIProvider, DatasetInsightInput } from "../types";
import { DatasetWorkflowState } from "@/features/datasets/types/workflow";
import { AI_MAX_PROMPT_CHARACTERS } from "../config";

function createWorkflowState(): DatasetWorkflowState {
  return {
    datasetId: "customer-cleanup",
    fileName: "customers.csv",
    status: "ready",
    columns: [
      { key: "email", label: "Email" },
      { key: "country", label: "Country" },
    ],
    rows: [
      {
        id: 1,
        values: { email: "valid@example.com", country: "United States" },
        validationState: "valid",
        reviewState: "unreviewed",
      },
      {
        id: 2,
        values: { email: "bad-email", country: "Narnia" },
        validationState: "invalid",
        validationField: "email",
        reviewState: "unreviewed",
      },
    ],
    suggestions: [
      {
        id: "invalid-email-format",
        type: "validation",
        title: "Invalid email format",
        description: "Review malformed email values.",
        confidence: 98,
        affectedRows: [2],
        severity: "high",
        status: "pending",
        action: "flag_invalid",
        targetField: "email",
      },
    ],
    transformations: [],
    selectedSuggestionId: null,
    activity: [],
    progress: 100,
    error: undefined,
    profile: {
      totalRows: 2,
      duplicateRows: 0,
      columns: [
        {
          column: "Email",
          completeness: 100,
          missingCount: 0,
          uniqueValues: 2,
          inferredType: "string",
        },
        {
          column: "Country",
          completeness: 100,
          missingCount: 0,
          uniqueValues: 2,
          inferredType: "string",
        },
      ],
    },
    auditEvents: [],
  };
}

function createUnavailableProvider(): AIProvider {
  return {
    id: "browser-webllm",
    name: "Unavailable browser AI",
    getAvailability: async () => ({
      status: "unavailable",
      reason: "WebGPU is not available in this browser.",
    }),
    generateInsights: async () => {
      throw new Error("Should not generate when unavailable.");
    },
  };
}

function createBrowserProvider(text: string): AIProvider {
  return {
    id: "browser-webllm",
    name: "Fake browser AI",
    getAvailability: async () => ({ status: "available" }),
    generateInsights: async () => ({
      summary: text,
      findings: [],
    }),
  };
}

function createLargeWorkflowState(rowCount = 51): DatasetWorkflowState {
  const rows = Array.from({ length: rowCount }, (_, index) => ({
    id: index + 1,
    values: {
      full_name: `User ${index + 1}`,
      email: `user${index + 1}@example.com`,
    },
    validationState: "valid" as const,
    reviewState: "unreviewed" as const,
  }));

  return {
    ...createWorkflowState(),
    rows,
    columns: [
      { key: "full_name", label: "Full Name" },
      { key: "email", label: "Email" },
    ],
    suggestions: [],
    profile: null,
  };
}

describe("AI dataset insights", () => {
  it("generates rule-based insight text from deterministic dataset state", async () => {
    const provider = new RuleBasedAIProvider();
    const input = createDatasetInsightInput(createWorkflowState());

    const output = await provider.generateInsights(input);

    expect(output.summary).toContain("Dataset health");
    expect(output.summary).toContain("Email validation issues");
    expect(output.summary).toContain("deterministic");
    expect(output.findings[0]).toMatchObject({
      status: "new",
      title: "Invalid email format",
    });
  });

  it("falls back when browser AI is unavailable", async () => {
    const result = await generateDatasetInsights(createWorkflowState(), {
      preferBrowserAI: true,
      browserProvider: createUnavailableProvider(),
    });

    expect(result.mode).toBe("fallback");
    expect(result.providerId).toBe("rule-based");
    expect(result.fallbackReason).toBe(
      "WebGPU is not available in this browser."
    );
    expect(result.text).toContain("Dataset health");
    expect(result.findings[0]).toMatchObject({
      status: "already_tracked",
      matchedSuggestionId: "invalid-email-format",
    });
  });

  it("does not mutate rows or suggestions while generating insights", async () => {
    const state = createWorkflowState();
    const beforeRows = JSON.stringify(state.rows);
    const beforeSuggestions = JSON.stringify(state.suggestions);

    await generateDatasetInsights(state, {
      preferBrowserAI: true,
      browserProvider: createBrowserProvider("Browser summary"),
    });

    expect(JSON.stringify(state.rows)).toBe(beforeRows);
    expect(JSON.stringify(state.suggestions)).toBe(beforeSuggestions);
  });

  it("passes copied affected-row arrays into insight input", () => {
    const state = createWorkflowState();
    const input: DatasetInsightInput = createDatasetInsightInput(state);

    input.pendingSuggestions[0].affectedRows.push(99);

    expect(state.suggestions[0].affectedRows).toEqual([2]);
  });

  it("builds compact WebLLM prompts with data columns and row objects", () => {
    const input = createDatasetInsightInput(createWorkflowState());
    const prompt = createWebLLMPrompt({
      input,
      rows: input.analysisRows,
    });

    const payload = JSON.parse(prompt) as {
      columns: string[];
      rows: Array<Record<string, unknown>>;
    };

    expect(payload.columns).toEqual(["email", "country"]);
    expect(payload.columns).not.toContain("rowId");
    expect(payload.rows).toEqual([
      { rowId: 1, email: "valid@example.com", country: "United States" },
      { rowId: 2, email: "bad-email", country: "Narnia" },
    ]);
    expect(payload.rows[0]).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("profile");
    expect(payload).not.toHaveProperty("pendingSuggestions");
  });

  it("keeps compact rowId objects when prompt rows are reduced", () => {
    const state = createLargeWorkflowState(500);
    const input = createDatasetInsightInput(state);
    const noteColumns = Array.from({ length: 20 }, (_, index) => ({
      key: `notes_${index + 1}`,
      label: `Notes ${index + 1}`,
    }));
    const rows = input.analysisRows.map((row) => ({
      ...row,
      values: {
        ...row.values,
        ...Object.fromEntries(
          noteColumns.map((column) => [
            column.key,
            "Repeated customer import metadata ".repeat(20),
          ])
        ),
      },
    }));
    const promptInput = {
      ...input,
      columns: [...input.columns, ...noteColumns],
    };
    const prompt = createWebLLMPrompt({
      input: promptInput,
      rows,
    });

    const payload = JSON.parse(prompt) as {
      columns: string[];
      rows: Array<{ rowId: number; full_name: string; email: string }>;
    };

    expect(payload.columns).toEqual([
      "full_name",
      "email",
      ...noteColumns.map((column) => column.key),
    ]);
    expect(payload.columns).not.toContain("rowId");
    expect(prompt.length).toBeLessThanOrEqual(AI_MAX_PROMPT_CHARACTERS);
    expect(payload.rows.length).toBeLessThan(rows.length);
    expect(payload.rows[0]).toMatchObject({ rowId: 1 });
    expect(payload.rows.at(-1)?.rowId).toBe(payload.rows.length);
    expect(payload.rows[0]).not.toHaveProperty("id");
  });

  it("progressive analysis appends findings without duplicates", async () => {
    const updates: number[] = [];

    const result = await runProgressiveDatasetAIAnalysis(
      createLargeWorkflowState(),
      {
        browserProvider: {
          id: "browser-webllm",
          name: "Fake browser AI",
          modelName: "fake-model",
          getAvailability: async () => ({ status: "available" }),
          generateFindingsForRows: async ({ rows }) => ({
            summary: `Analyzed ${rows.length} rows.`,
            findings: [
              {
                id: `placeholder-${rows[0].id}`,
                title: "Placeholder names detected",
                description: "Rows use placeholder-like generated names.",
                reasoning: "Names follow a repeated User N pattern.",
                confidence: 0.8,
                severity: "medium",
                targetField: "full_name",
                affectedRows: [rows[0].id],
                suggestedAction: "flag_invalid",
                source: "browser-ai",
                status: "new",
              },
            ],
          }),
        },
        onUpdate: (state) => {
          updates.push(state.rowsAnalyzed);
        },
      }
    );

    expect(result.status).toBe("completed");
    expect(result.rowsAnalyzed).toBe(30);
    expect(result.totalRows).toBe(51);
    expect(result.analysisTargetRows).toBe(30);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].affectedRows).toEqual([1, 6, 11, 16, 21, 26]);
    expect(updates).toContain(5);
    expect(updates).toContain(30);
    expect(result.summary).toContain("AI analysis complete");
    expect(result.summary).not.toBe("Analyzed 1 rows.");
  });

  it("progressive analysis caps large datasets at the configured row limit", async () => {
    const result = await runProgressiveDatasetAIAnalysis(
      createLargeWorkflowState(5000),
      {
        browserProvider: {
          id: "browser-webllm",
          name: "Fake browser AI",
          modelName: "fake-model",
          getAvailability: async () => ({ status: "available" }),
          generateFindingsForRows: async () => ({
            summary: "No new findings.",
            findings: [],
          }),
        },
      }
    );

    expect(result.status).toBe("completed");
    expect(result.rowsAnalyzed).toBe(30);
    expect(result.totalRows).toBe(5000);
    expect(result.analysisTargetRows).toBe(30);
  });

  it("continues after a row range fails once analysis has started", async () => {
    const updates: number[] = [];

    const result = await runProgressiveDatasetAIAnalysis(
      createLargeWorkflowState(151),
      {
        browserProvider: {
          id: "browser-webllm",
          name: "Fake browser AI",
          modelName: "fake-model",
          getAvailability: async () => ({ status: "available" }),
          generateFindingsForRows: async ({ rowsAnalyzedStart }) => {
            if (rowsAnalyzedStart === 16) {
              throw new Error("prompt tokens exceeded context window");
            }

            return {
              summary: "Range complete.",
              findings: [],
            };
          },
        },
        onUpdate: (state) => {
          updates.push(state.rowsAnalyzed);
        },
      }
    );

    expect(result.status).toBe("completed");
    expect(result.error).toBeUndefined();
    expect(result.summary).not.toContain("prompt tokens");
    expect(updates).toContain(5);
    expect(updates).toContain(15);
    expect(updates).toContain(25);
  });

  it("returns fallback analysis when model loading times out", async () => {
    const updates: string[] = [];

    const result = await runProgressiveDatasetAIAnalysis(createWorkflowState(), {
      modelLoadTimeoutMs: 1,
      browserProvider: {
        id: "browser-webllm",
        name: "Hanging browser AI",
        modelName: "fake-model",
        getAvailability: async () => ({ status: "available" }),
        loadModel: async () => new Promise(() => {}),
        generateFindingsForRows: async () => {
          throw new Error("Should not analyze before model load.");
        },
      },
      onUpdate: (state) => {
        updates.push(state.status);
      },
    });

    expect(result.status).toBe("failed");
    expect(result.rowsAnalyzed).toBe(0);
    expect(result.summary).toContain("Dataset health");
    expect(result.error).toBe("Browser AI could not complete analysis.");
    expect(updates.at(-1)).toBe("failed");
  });

  it("returns fallback analysis when the first row range times out", async () => {
    const updates: string[] = [];

    const result = await runProgressiveDatasetAIAnalysis(createWorkflowState(), {
      rowAnalysisTimeoutMs: 1,
      browserProvider: {
        id: "browser-webllm",
        name: "Hanging browser AI",
        modelName: "fake-model",
        getAvailability: async () => ({ status: "available" }),
        loadModel: async () => undefined,
        generateFindingsForRows: async () => new Promise(() => {}),
      },
      onUpdate: (state) => {
        updates.push(state.status);
      },
    });

    expect(result.status).toBe("failed");
    expect(result.rowsAnalyzed).toBe(0);
    expect(result.summary).toContain("Dataset health");
    expect(result.error).toBe("Browser AI could not complete analysis.");
    expect(updates.at(-1)).toBe("failed");
  });

  it("does not update stale state after cancellation", async () => {
    const updates: string[] = [];

    await runProgressiveDatasetAIAnalysis(createWorkflowState(), {
      browserProvider: {
        id: "browser-webllm",
        name: "Fake browser AI",
        modelName: "fake-model",
        getAvailability: async () => ({ status: "available" }),
        loadModel: async () => undefined,
        generateFindingsForRows: async () => ({
          summary: "Should not be reached.",
          findings: [],
        }),
      },
      isCancelled: () => updates.length > 0,
      onUpdate: (state) => {
        updates.push(state.status);
      },
    });

    expect(updates).toEqual(["checking"]);
  });

  it("returns fallback analysis state when browser AI is unavailable", async () => {
    const result = await runProgressiveDatasetAIAnalysis(createWorkflowState(), {
      browserProvider: {
        id: "browser-webllm",
        name: "Unavailable browser AI",
        modelName: "fake-model",
        getAvailability: async () => ({
          status: "unavailable",
          reason: "No WebGPU.",
        }),
        generateFindingsForRows: async () => {
          throw new Error("Should not run.");
        },
      },
    });

    expect(result.status).toBe("unavailable");
    expect(result.summary).toContain("Dataset health");
    expect(result.rowsAnalyzed).toBe(0);
    expect(result.analysisTargetRows).toBe(2);
    expect(result.error).toBe("Browser AI could not complete analysis.");
  });
});
