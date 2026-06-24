import {
  AIFinding,
  AIAvailability,
  AIInsightProgress,
  AIProvider,
  DatasetInsightAnalysisRow,
  DatasetInsightInput,
} from "../types";
import { parseAIFindingsFromText } from "../parseAIFindings";
import { AI_DEFAULT_MODEL, AI_MAX_PROMPT_CHARACTERS } from "../config";
import { MLCEngineConfig } from "@mlc-ai/web-llm";

type WebLLMResponseFormat = {
  type: "json_object";
  schema?: string;
};

type WebLLMEngine = {
  interruptGenerate?: () => void;
  unload?: () => Promise<void>;
  chat: {
    completions: {
      create: (request: {
        messages: { role: "system" | "user"; content: string }[];
        temperature?: number;
        max_tokens?: number;
        response_format: WebLLMResponseFormat;
      }) => Promise<{
        choices: {
          finish_reason?: string;
          message?: { content?: string | null };
        }[];
      }>;
    };
  };
};
type WebLLMModule = {
  CreateWebWorkerMLCEngine?: (
    worker: Worker,
    model: string,
    config?: MLCEngineConfig
  ) => Promise<WebLLMEngine>;
};

async function importWebLLM(): Promise<WebLLMModule> {
  return import("@mlc-ai/web-llm");
}

type NavigatorWithWebGPU = Navigator & {
  gpu?: {
    requestAdapter: () => Promise<unknown>;
  };
};

async function getWebGPUAvailability(): Promise<AIAvailability> {
  if (typeof window === "undefined") {
    return {
      status: "unavailable",
      reason: "Browser AI is only available in the client runtime.",
    };
  }

  const browserNavigator = navigator as NavigatorWithWebGPU;

  if (!browserNavigator.gpu) {
    return {
      status: "unavailable",
      reason: "WebGPU is not available in this browser.",
    };
  }

  try {
    const adapter = await browserNavigator.gpu.requestAdapter();

    if (!adapter) {
      return {
        status: "unavailable",
        reason: "WebGPU is present, but no compatible GPU adapter was found.",
      };
    }

    return { status: "available" };
  } catch {
    return {
      status: "unavailable",
      reason: "Unable to initialize WebGPU on this device.",
    };
  }
}

function compactCellValue(value: unknown, columnKey: string) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  const text = String(value).trim();

  if (
    columnKey.toLowerCase().includes("date") ||
    columnKey.toLowerCase().includes("time")
  ) {
    const parsedDate = new Date(text);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().slice(0, 10);
    }
  }

  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

function createCompactRowObject({
  columns,
  row,
}: {
  columns: string[];
  row: DatasetInsightAnalysisRow;
}) {
  return Object.fromEntries([
    ["rowId", row.id],
    ...columns.map((column) => [
      column,
      compactCellValue(row.values[column], column),
    ]),
  ]);
}

function createPromptPayload({
  input,
  rows,
}: {
  input: DatasetInsightInput;
  rows: DatasetInsightAnalysisRow[];
}) {
  const dataColumns = input.columns.map((column) => column.key);
  const rowIds = new Set(rows.map((row) => row.id));

  return {
    datasetProfile: {
      rowCount: input.rowCount,
      columnCount: input.columnCount,
      validRowCount: input.validRowCount,
      invalidRowCount: input.invalidRowCount,
      missingRowCount: input.missingRowCount,
    },
    deterministicIssues: input.pendingSuggestions
      .map((suggestion) => ({
        id: suggestion.id,
        title: suggestion.title,
        severity: suggestion.severity,
        targetField: suggestion.targetField,
        action: suggestion.action,
        affectedRowsInCurrentChunk: suggestion.affectedRows.filter((rowId) =>
          rowIds.has(rowId)
        ),
      }))
      .filter((issue) => issue.affectedRowsInCurrentChunk.length > 0),
    columns: dataColumns,
    rowStates: rows.map((row) => ({
      rowId: row.id,
      validationState: row.validationState,
      validationField: row.validationField,
    })),
    sampleRows: rows.map((row) =>
      createCompactRowObject({
        columns: dataColumns,
        row,
      })
    ),
  };
}

export function createWebLLMPrompt({
  input,
  rows,
}: {
  input: DatasetInsightInput;
  rows: DatasetInsightAnalysisRow[];
  previousFindings?: AIFinding[];
}) {
  let rowsToSend = rows;

  while (rowsToSend.length > 0) {
    const prompt = JSON.stringify(
      createPromptPayload({
        input,
        rows: rowsToSend,
      })
    );

    if (prompt.length <= AI_MAX_PROMPT_CHARACTERS || rowsToSend.length === 1) {
      return prompt;
    }

    rowsToSend = rowsToSend.slice(
      0,
      Math.max(1, Math.floor(rowsToSend.length / 2))
    );
  }

  return JSON.stringify(
    createPromptPayload({
      input,
      rows: [],
    })
  );
}

function isTrustedJsonObject(text: string) {
  return text.trim().startsWith("{") && text.trim().endsWith("}");
}

export class BrowserAIProvider implements AIProvider {
  id = "browser-webllm";
  name = "Browser WebLLM";
  modelName = AI_DEFAULT_MODEL;

  private engine: WebLLMEngine | null = null;
  private enginePromise: Promise<WebLLMEngine> | null = null;
  private worker: Worker | null = null;

  interrupt() {
    console.info("[AI] interrupt requested", {
      modelName: this.modelName,
    });

    this.engine?.interruptGenerate?.();
  }

  async getAvailability(): Promise<AIAvailability> {
    return getWebGPUAvailability();
  }

  async loadModel(onProgress?: (progress: AIInsightProgress) => void) {
    return this.getEngine(onProgress);
  }

  private getWorker() {
    if (this.worker) return this.worker;

    this.worker = new Worker(new URL("./webllm.worker.ts", import.meta.url), {
      type: "module",
    });

    return this.worker;
  }

  private async getEngine(onProgress?: (progress: AIInsightProgress) => void) {
    if (this.engine) return this.engine;
    if (this.enginePromise) return this.enginePromise;

    const enginePromise = this.createEngine(onProgress);
    this.enginePromise = enginePromise;

    try {
      this.engine = await enginePromise;
      return this.engine;
    } finally {
      if (this.enginePromise === enginePromise) {
        this.enginePromise = null;
      }
    }
  }

  private async createEngine(onProgress?: (progress: AIInsightProgress) => void) {
    const availability = await this.getAvailability();

    if (availability.status !== "available") {
      throw new Error(availability.reason ?? "Browser AI is unavailable.");
    }

    onProgress?.({
      stage: "loading",
      message: "Loading browser AI model. First load can take a few minutes.",
      progress: 0,
    });

    console.info("CleanFlow browser AI model loading started", {
      modelName: this.modelName,
      time: new Date().toISOString(),
    });

    const webllm = await importWebLLM();
    const createEngine = webllm.CreateWebWorkerMLCEngine;

    if (!createEngine) {
      throw new Error("No WebLLM worker engine factory available.");
    }

    const engine = await createEngine(this.getWorker(), this.modelName, {
      initProgressCallback: (progress) => {
        console.info("CleanFlow browser AI model loading progress", {
          modelName: this.modelName,
          progress: progress.progress,
          text: progress.text,
        });

        onProgress?.({
          stage: "loading",
          message: progress.text ?? "Loading browser AI model.",
          progress: progress.progress,
        });
      },
    });

    console.info("CleanFlow browser AI model loaded", {
      modelName: this.modelName,
      time: new Date().toISOString(),
    });

    return engine;
  }

  async generateInsights(
    input: DatasetInsightInput,
    onProgress?: (progress: AIInsightProgress) => void
  ) {
    return this.generateFindingsForRows({
      input,
      rows: input.analysisRows,
      rowsAnalyzedStart: 1,
      rowsAnalyzedEnd: input.analysisRows.length,
      previousFindings: [],
      onProgress,
    });
  }

  async generateFindingsForRows({
    input,
    rows,
    rowsAnalyzedStart,
    rowsAnalyzedEnd,
    previousFindings = [],
    onProgress,
  }: {
    input: DatasetInsightInput;
    rows: DatasetInsightAnalysisRow[];
    rowsAnalyzedStart: number;
    rowsAnalyzedEnd: number;
    previousFindings?: AIFinding[];
    onProgress?: (progress: AIInsightProgress) => void;
  }) {
    const engine = await this.getEngine(onProgress);

    onProgress?.({
      stage: "analyzing",
      message: "AI is analyzing rows in the background.",
      progress: 1,
    });

    const prompt = createWebLLMPrompt({ input, rows, previousFindings });

    console.info("[AI] prompt", prompt);

    console.info("[AI] prompt size", {
      rowsAnalyzedStart,
      rowsAnalyzedEnd,
      rows: rows.length,
      characters: prompt.length,
    });

    const structuralSchema = {
      type: "object",
      properties: {
        summary: {
          type: "string",
          maxLength: 120,
        },
        findings: {
          type: "array",
          maxItems: 2,
          items: {
            type: "object",
            properties: {
              title: { type: "string", maxLength: 60 },
              description: { type: "string", maxLength: 160 },
              reasoning: { type: "string", maxLength: 240 },
              confidence: { type: "number" },
              category: {
                enum: [
                  "pattern",
                  "business_context",
                  "review_priority",
                  "data_quality_summary",
                ],
              },
            },
            required: [
              "title",
              "description",
              "reasoning",
              "confidence",
              "category",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["summary", "findings"],
      additionalProperties: false,
    };

    const response = await engine.chat.completions.create({
      temperature: 0,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: [
            "You are CleanFlow AI, a browser-based assistant for dataset review.",
            "",
            "You are not a data validator.",
            "Deterministic validation has already been completed and is the source of truth.",
            "Do not repeat deterministicIssues as findings. They are already handled by the review queue.",
            "",
            "Your job is only to provide high-level observations based on:",
            "- deterministic issue summaries",
            "- row validation states",
            "- visible dataset patterns",
            "",
            "You must not invent validation issues.",
            "You must not report missing values, invalid emails, duplicates, country issues, or status issues at all.",
            "Those are deterministic validation issues and must not appear in your findings.",
            "You must not return affectedRows, targetField, evidence, severity, or suggestedAction.",
            "",
            "Return only useful supplemental observations.",
            "",/* 
            "If there is no useful higher-level observation, return exactly:",
            JSON.stringify({
              summary: "No additional AI findings.",
              findings: [],
            }), */
          ].join("\n"),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_object",
        schema: JSON.stringify(structuralSchema),
      },
    });

    console.info("[AI] response", response);

    const finishReason = response.choices[0]?.finish_reason;
    const text = response.choices[0]?.message?.content?.trim();

    console.info("[AI] response received", {
      rowsAnalyzedStart,
      rowsAnalyzedEnd,
      finishReason,
      hasText: Boolean(text),
      characters: text?.length ?? 0,
      preview: text?.slice(0, 500),
    });

    if (finishReason === "length") {
      console.warn("[AI] response was truncated by token limit.");
    }

    if (!text || !isTrustedJsonObject(text)) {
      console.info("[AI] untrusted response fallback", {
        rowsAnalyzedStart,
        rowsAnalyzedEnd,
        hasText: Boolean(text),
      });

      return {
        summary: "No additional AI findings.",
        findings: [],
      };
    }

    const parsed = parseAIFindingsFromText({
      rawText: text,
      input: {
        ...input,
        analysisRows: rows,
      },
      source: "browser-ai",
    });

    console.info("[AI] parsed response", {
      rowsAnalyzedStart,
      rowsAnalyzedEnd,
      summary: parsed.summary,
      findings: parsed.findings.length,
    });

    onProgress?.({
      stage: "complete",
      message: "Browser AI insights generated.",
      progress: 1,
    });

    return {
      summary: parsed.summary || "No additional AI findings.",
      findings: parsed.findings.slice(0, 2),
    };
  }
}