import {
  AIFinding,
  AIAvailability,
  AIInsightProgress,
  AIProvider,
  DatasetInsightInput,
  DatasetInsightSuggestionInput,
} from "../types";

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getIssueKey(suggestion: DatasetInsightSuggestionInput) {
  if (suggestion.targetField?.includes("email")) return "email";
  if (suggestion.targetField?.includes("country")) return "country";
  if (suggestion.targetField?.includes("account_status")) {
    return "account_status";
  }
  if (suggestion.targetField?.includes("signup_date")) return "date";
  if (suggestion.title.toLowerCase().includes("missing")) {
    return `missing:${suggestion.targetField ?? "field"}`;
  }

  return suggestion.targetField ?? suggestion.action ?? suggestion.title;
}

function getIssueLabel(key: string, targetField?: string) {
  if (key === "email") return "Email validation issues";
  if (key === "country") return "Country normalization issues";
  if (key === "account_status") return "Account status normalization issues";
  if (key === "date") return "Date validation issues";
  if (key.startsWith("missing:")) {
    return `Missing values in ${targetField ?? key.replace("missing:", "")}`;
  }

  return targetField ? `Review issues in ${targetField}` : "Review issues";
}

function formatSuggestionSummary(input: DatasetInsightInput) {
  if (input.pendingSuggestions.length === 0) {
    return "No pending cleanup suggestions remain. The dataset is ready for final review and export.";
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };

  const grouped = new Map<
    string,
    {
      label: string;
      severity: "low" | "medium" | "high";
      affectedRows: Set<number>;
      targetField?: string;
    }
  >();

  for (const suggestion of input.pendingSuggestions) {
    const key = getIssueKey(suggestion);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        label: getIssueLabel(key, suggestion.targetField),
        severity: suggestion.severity,
        affectedRows: new Set(suggestion.affectedRows),
        targetField: suggestion.targetField,
      });
      continue;
    }

    for (const rowId of suggestion.affectedRows) {
      existing.affectedRows.add(rowId);
    }

    if (severityOrder[suggestion.severity] < severityOrder[existing.severity]) {
      existing.severity = suggestion.severity;
    }
  }

  return [...grouped.values()]
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 4)
    .map((issue, index) => {
      return `${index + 1}. ${issue.label}: ${pluralize(
        issue.affectedRows.size,
        "row"
      )}, ${issue.severity} severity.`;
    })
    .join("\n");
}

function getCompletenessSummary(input: DatasetInsightInput) {
  if (!input.profile || input.profile.columns.length === 0) {
    return "Column profile is not available yet.";
  }

  const lowestCompleteness = [...input.profile.columns].sort(
    (a, b) => a.completeness - b.completeness
  )[0];

  return `${lowestCompleteness.column} has the lowest completeness at ${lowestCompleteness.completeness}%.`;
}

export class RuleBasedAIProvider implements AIProvider {
  id = "rule-based";
  name = "Deterministic fallback insights";

  async getAvailability(): Promise<AIAvailability> {
    return { status: "available" };
  }

  async generateInsights(
    input: DatasetInsightInput,
    onProgress?: (progress: AIInsightProgress) => void
  ) {
    onProgress?.({
      stage: "fallback",
      message: "Generating deterministic dataset insights.",
      progress: 1,
    });

    const issueCount = input.invalidRowCount + input.missingRowCount;
    const validRate =
      input.rowCount === 0
        ? 100
        : Math.round((input.validRowCount / input.rowCount) * 100);

    const summary = [
      `Dataset health: ${pluralize(input.rowCount, "row")} across ${pluralize(
        input.columnCount,
        "column"
      )}, with ${validRate}% currently passing validation.`,
      `Review focus: ${pluralize(issueCount, "row")} still need deterministic validation attention.`,
      `Priority cleanup order:\n${formatSuggestionSummary(input)}`,
      `Profile signal: ${getCompletenessSummary(input)}`,
      "Guardrail: these insights summarize the workflow only. Validation status, suggestion resolution, and export readiness remain deterministic.",
    ].join("\n\n");

    const findings: AIFinding[] = input.pendingSuggestions.slice(0, 3).map((suggestion) => {
      const suggestedAction: AIFinding["suggestedAction"] =
        suggestion.action === "standardize_value" ||
        suggestion.action === "fill_missing"
          ? suggestion.action
          : "flag_invalid";

      return {
        id: `rule-${suggestion.id}`,
        kind: "validation",
        title: suggestion.title,
        description: `Deterministic review queue already tracks this issue for ${pluralize(
          suggestion.affectedRows.length,
          "row"
        )}.`,
        reasoning:
          "Generated from existing deterministic Review Queue evidence.",
        confidence: 0.9,
        severity: suggestion.severity,
        targetField: suggestion.targetField,
        affectedRows: [...suggestion.affectedRows],
        suggestedAction,
        source: "rule-based",
        status: "new",
      };
    });

    return {
      summary,
      findings,
    };
  }
}
