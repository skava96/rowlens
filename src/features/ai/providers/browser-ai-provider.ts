import {
  AIFinding,
  AIAvailability,
  AIInsightProgress,
  AIProvider,
  DatasetInsightAnalysisRow,
  DatasetInsightInput,
} from "../types";
import { parseAIFindingsFromText } from "../parseAIFindings";
import {
  AI_DEFAULT_MODEL,
  AI_MAX_FINDINGS_PER_CHUNK,
  AI_MAX_PROMPT_CHARACTERS,
} from "../config";
import { ResponseFormat } from "@mlc-ai/web-llm";


type WebLLMEngine = {
  interruptGenerate?: () => void;
  unload?: () => Promise<void>;
  chat: {
    completions: {
      create: (request: {
        messages: { role: "system" | "user"; content: string }[];
        temperature?: number;
        max_tokens?: number;
        response_format?: ResponseFormat;
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
  CreateMLCEngine?: (
    model: string,
    config?: {
      initProgressCallback?: (progress: {
        progress?: number;
        text?: string;
      }) => void;
    }
  ) => Promise<WebLLMEngine>;
  CreateWebGPUEngine?: (
    model: string,
    config?: {
      initProgressCallback?: (progress: {
        progress?: number;
        text?: string;
      }) => void;
    }
  ) => Promise<WebLLMEngine>;
};

type NavigatorWithWebGPU = Navigator & {
  gpu?: {
    requestAdapter: () => Promise<unknown>;
  };
};

async function importWebLLM(): Promise<WebLLMModule> {
  return import("@mlc-ai/web-llm");
}

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

  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
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
  const columns = input.columns.map((column) => column.key);

  return {
    columns,/* 
    deterministicIssues: createKnownIssueRows({ input, rows }),
    rowStates: createRowStateRows(rows), */
    rows: rows.map((row) =>
      createCompactRowObject({
        columns,
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
  const trimmed = text.trim();
  return trimmed.startsWith("{") && trimmed.endsWith("}");
}

export class BrowserAIProvider implements AIProvider {
  id = "browser-webllm";
  name = "Browser WebLLM";
  modelName = AI_DEFAULT_MODEL;

  private engine: WebLLMEngine | null = null;
  private enginePromise: Promise<WebLLMEngine> | null = null;

  interrupt() {
    this.engine?.interruptGenerate?.();
  }

  async getAvailability(): Promise<AIAvailability> {
    return getWebGPUAvailability();
  }

  async loadModel(onProgress?: (progress: AIInsightProgress) => void) {
    return this.getEngine(onProgress);
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

    const webllm = await importWebLLM();
    const createEngine = webllm.CreateWebGPUEngine ?? webllm.CreateMLCEngine;

    if (!createEngine) {
      throw new Error("No WebLLM engine factory available.");
    }

    const engine = await createEngine(this.modelName, {
      initProgressCallback: (progress) => {
        onProgress?.({
          stage: "loading",
          message: progress.text ?? "Loading browser AI model.",
          progress: progress.progress,
        });
      },
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

    const responseFormatSchema = {
      type: "object",
      properties: {
        findings: {
          type: "array",
          maxItems: AI_MAX_FINDINGS_PER_CHUNK,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              reasoning: { type: "string" },
              confidence: { type: "number", decimalDigits: 2 },
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
      required: ["findings"],
      additionalProperties: false,
    };

    const response = await engine.chat.completions.create({
      temperature: 0,
      max_tokens: 4094,
      response_format: {
        type: "json_object",
        schema: JSON.stringify(responseFormatSchema),
      },
      messages: [
        {
          role: "system",
          content: [
            "You are CleanFlow AI.",
            "",
            "Deterministic validation has already been completed.",
            "Do NOT report missing values.",
            "Do NOT report invalid emails.",
            "Do NOT report invalid dates.",
            "Do NOT report duplicates.",
            "Do NOT repeat review queue items.",
            "",
            "Look only for higher-level patterns that span multiple rows.",
            "",
            "Examples:",
            "- inconsistent naming conventions",
            "- inconsistent casing",
            "- placeholder values used across many rows",
            "- unusual category distributions",
            "- unexpected combinations of fields",
            "- rows that appear different from the majority",
            "",
            "Ignore single-row validation issues.",
            "",
            "Return at most 1 finding.",
            "",
            "If no useful pattern exists return:",
            '{"summary":"No additional AI findings.","findings":[]}',
            "",
            "Return JSON only."
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            "Dataset JSON:",
            prompt,
          ].join("\n"),
        },
      ]
    });

    const finishReason = response.choices[0]?.finish_reason;
    const text = response.choices[0]?.message?.content?.trim();

    if (finishReason === "length") {
      console.warn("[AI] response was truncated by token limit.");
    }

    if (!text || !isTrustedJsonObject(text)) {
      return {
        summary: "No additional AI observations.",
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

    onProgress?.({
      stage: "complete",
      message: "Browser AI observations generated.",
      progress: 1,
    });

    return {
      summary: parsed.summary || "No additional AI observations.",
      findings: parsed.findings.slice(0, AI_MAX_FINDINGS_PER_CHUNK),
    };
  }
}