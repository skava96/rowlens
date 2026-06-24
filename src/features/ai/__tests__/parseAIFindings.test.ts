import { describe, expect, it } from "vitest";

import { parseAIFindingsFromText } from "../parseAIFindings";
import { DatasetInsightInput } from "../types";

function createInput(): DatasetInsightInput {
  return {
    rowCount: 4,
    columnCount: 2,
    columns: [
      { key: "email", label: "Email" },
      { key: "country", label: "Country" },
    ],
    validRowCount: 2,
    invalidRowCount: 2,
    missingRowCount: 0,
    pendingSuggestions: [],
    profile: null,
    analysisRows: [
      {
        id: 1,
        values: { email: "a@example.com", country: "United States" },
        validationState: "valid",
      },
      {
        id: 2,
        values: { email: "bad-email", country: "USA" },
        validationState: "invalid",
        validationField: "email",
      },
    ],
  };
}

describe("parseAIFindingsFromText", () => {
  it("rejects invalid row ids and unknown fields", () => {
    const result = parseAIFindingsFromText({
      source: "browser-ai",
      input: createInput(),
      rawText: JSON.stringify({
        summary: "Potential cleanup issues found.",
        findings: [
          {
            title: "Unknown row issue",
            description: "Invalid row id should be removed.",
            reasoning: "The row was not supplied.",
            confidence: 0.9,
            severity: "high",
            targetField: "unknown_field",
            affectedRows: [999],
            suggestedAction: "flag_invalid",
          },
          {
            title: "Known row issue",
            description: "Known row should remain.",
            reasoning: "The row was supplied.",
            confidence: 1.4,
            severity: "severe",
            targetField: "email",
            affectedRows: [2, 999],
            suggestedAction: "unsafe_action",
            suggestedValue: "x",
          },
        ],
      }),
    });

    expect(result?.findings).toHaveLength(1);
    expect(result?.findings[0]).toMatchObject({
      title: "Known row issue",
      confidence: 1,
      severity: "medium",
      targetField: "email",
      affectedRows: [2],
      suggestedAction: "flag_invalid",
      suggestedValue: undefined,
    });
  });

  it("limits findings to max 3", () => {
    const result = parseAIFindingsFromText({
      source: "browser-ai",
      input: createInput(),
      rawText: JSON.stringify({
        summary: "Many findings.",
        findings: [1, 2, 3, 4, 5].map((item) => ({
          title: `Finding ${item}`,
          description: "Issue",
          reasoning: "Evidence",
          confidence: 0.8,
          severity: "low",
          targetField: "email",
          affectedRows: [2],
          suggestedAction: "flag_invalid",
        })),
      }),
    });

    expect(result?.findings).toHaveLength(3);
  });

  it("tolerates fenced JSON and surrounding text", () => {
    const result = parseAIFindingsFromText({
      source: "browser-ai",
      input: createInput(),
      rawText: `Here is the result:\n\n\`\`\`json\n${JSON.stringify({
        summary: "Fenced summary.",
        findings: [
          {
            title: "Fenced finding",
            description: "Wrapped response should parse.",
            reasoning: "The JSON object is inside markdown fences.",
            confidence: 0.8,
            severity: "medium",
            targetField: "email",
            affectedRows: [2],
            suggestedAction: "flag_invalid",
          },
        ],
      })}\n\`\`\`\nDone.`,
    });

    expect(result.summary).toBe("Fenced summary.");
    expect(result.findings[0].title).toBe("Fenced finding");
  });

  it("keeps WebLLM findings when they use the requested schema", () => {
    const input = createInput();
    input.columns = [
      ...input.columns,
      { key: "customer_id", label: "Customer ID" },
    ];
    input.analysisRows = Array.from({ length: 30 }, (_, index) => ({
      id: index + 1,
      values: {
        customer_id: "C-001",
        email: `${index + 1}@example.com`,
        country: index % 2 === 0 ? "USA" : "United States",
      },
      validationState: "valid" as const,
    }));

    const result = parseAIFindingsFromText({
      source: "browser-ai",
      input,
      rawText: `\`\`\`json
{
  "summary": "The dataset contains duplicate records, inconsistent country names, and inconsistencies in status values.",
  "findings": [
    {
      "title": "Duplicate Records",
      "description": "Records 1-30 have the same customer_id, which is incorrect.",
      "reasoning": "This suggests a validation issue.",
      "confidence": 0.8,
      "severity": "high",
      "targetField": "customer_id",
      "affectedRows": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
      "suggestedAction": "flag_invalid"
    },
    {
      "title": "Inconsistent Country Names",
      "description": "Records 1-30 have inconsistent country names.",
      "reasoning": "This suggests inconsistent country validation.",
      "confidence": 0.95,
      "severity": "medium",
      "targetField": "country",
      "affectedRows": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
      "suggestedAction": "standardize_value",
      "suggestedValue": "United States"
    }
  ]
}
\`\`\``,
    });

    expect(result.findings).toHaveLength(2);
    expect(result.findings[0]).toMatchObject({
      title: "Duplicate Records",
      severity: "high",
      targetField: "customer_id",
      affectedRows: Array.from({ length: 30 }, (_, index) => index + 1),
      suggestedAction: "flag_invalid",
    });
    expect(result.findings[1]).toMatchObject({
      title: "Inconsistent Country Names",
      severity: "medium",
      targetField: "country",
      affectedRows: Array.from({ length: 30 }, (_, index) => index + 1),
      suggestedAction: "standardize_value",
      suggestedValue: "United States",
    });
  });

  it("returns empty findings for malformed model output", () => {
    const result = parseAIFindingsFromText({
      source: "browser-ai",
      input: createInput(),
      rawText: "not json",
    });

    expect(result.findings).toEqual([]);
    expect(result.summary).toContain("no trusted structured findings");
  });
});
