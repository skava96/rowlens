import { describe, expect, it } from "vitest";

import { matchAIFindingsToSuggestions } from "../matchAIFindingsToSuggestions";
import { AIFinding } from "../types";
import { AISuggestion } from "@/types/dataset";

function createFinding(): AIFinding {
  return {
    id: "ai-email-2",
    title: "Invalid email format",
    description: "AI noticed malformed emails.",
    reasoning: "Row sample contains malformed email text.",
    confidence: 0.82,
    severity: "high",
    targetField: "email",
    affectedRows: [2],
    suggestedAction: "flag_invalid",
    source: "browser-ai",
    status: "new",
  };
}

function createSuggestion(): AISuggestion {
  return {
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
  };
}

describe("matchAIFindingsToSuggestions", () => {
  it("marks existing Review Queue issue as already tracked", () => {
    const [matched] = matchAIFindingsToSuggestions(
      [createFinding()],
      [createSuggestion()]
    );

    expect(matched).toMatchObject({
      status: "already_tracked",
      matchedSuggestionId: "invalid-email-format",
    });
  });
});
