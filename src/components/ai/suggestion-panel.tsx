"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Rows3,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { AISuggestion } from "@/types/dataset";
import { cn } from "@/lib/utils";

type Props = {
  suggestions: AISuggestion[];
  hasDataset: boolean;
  onApproveSuggestion?: (id: string) => void;
  onRejectSuggestion?: (id: string) => void;
  onReviewSuggestion?: (id: string) => void;
  onClearReview?: () => void;
};

const formatRow = (row: number) => `#${row}`;

function formatAction(action: AISuggestion["action"]) {
  return action.replaceAll("_", " ");
}

function hasSuggestedValue(suggestion: AISuggestion) {
  const value = suggestion.suggestedValue;

  return (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== "" &&
    String(value).trim().toLowerCase() !== "unknown"
  );
}

function canApplyAutoFix(suggestion: AISuggestion) {
  return (
    suggestion.status === "pending" &&
    suggestion.action !== "flag_invalid" &&
    hasSuggestedValue(suggestion)
  );
}

function getSeverityVariant(severity: AISuggestion["severity"]) {
  if (severity === "high") return "destructive";
  if (severity === "medium") return "secondary";
  return "outline";
}

function getStatusTone(status: AISuggestion["status"]) {
  if (status === "approved") {
    return "border-emerald-100 bg-emerald-50/30";
  }

  if (status === "ignored") {
    return "border-rose-100 bg-rose-50/30";
  }

  return "border-border bg-background";
}

function SuggestionDetails({ suggestion }: { suggestion: AISuggestion }) {
  const hasAutoFix = canApplyAutoFix(suggestion);

  const details = [
    {
      label: "Affected rows",
      value: suggestion.affectedRows.map(formatRow).join(", "),
    },
    {
      label: "Action",
      value: formatAction(suggestion.action),
    },
    {
      label: "Auto-fix",
      value: hasSuggestedValue(suggestion)
        ? String(suggestion.suggestedValue)
        : "Not available",
    },
    {
      label: "Type",
      value: suggestion.type,
    },
    {
      label: "Severity",
      value: suggestion.severity,
    },
    {
      label: "Confidence",
      value: `${suggestion.confidence}%`,
    },
    {
      label: "Decision",
      value: suggestion.status,
    },
  ];

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/20 px-3 py-3">
      {suggestion.status === "pending" && (
        <div
          className={cn(
            "mb-3 rounded-lg border px-3 py-2 text-sm",
            hasAutoFix
              ? "border-emerald-100 bg-emerald-50/70 text-emerald-800"
              : "border-sky-100 bg-sky-50/70 text-sky-800"
          )}
        >
          {hasAutoFix ? (
            <p>
              Auto-fix available: approving this suggestion will apply{" "}
              <span className="font-semibold">
                {String(suggestion.suggestedValue)}
              </span>{" "}
              to the affected row(s).
            </p>
          ) : (
            <p>
              No auto-fix available. Review the affected row and edit it
              manually if needed.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {details.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {item.label}
            </p>

            <p className="mt-0.5 text-sm font-medium capitalize text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  isExpanded,
  isPriority = false,
  onApprove,
  onReject,
  onReview,
}: {
  suggestion: AISuggestion;
  isExpanded: boolean;
  isPriority?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onReview: (id: string) => void;
}) {
  const isResolved =
    suggestion.status === "approved" || suggestion.status === "ignored";

  const hasAutoFix = canApplyAutoFix(suggestion);

  return (
    <article
      className={cn(
        "rounded-xl border px-4 py-3 transition-colors",
        getStatusTone(suggestion.status),
        suggestion.status === "pending" &&
          isExpanded &&
          "border-sky-300 bg-sky-50/30",
        suggestion.status === "pending" &&
          isPriority &&
          !isExpanded &&
          "border-amber-200 bg-amber-50/20"
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold leading-5 text-foreground">
              {suggestion.title}
            </h3>

            <Badge
              variant={
                suggestion.status === "approved"
                  ? "secondary"
                  : suggestion.status === "ignored"
                    ? "destructive"
                    : "outline"
              }
              className="h-5 px-2 text-[11px]"
            >
              {suggestion.status === "approved" && (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              )}

              {suggestion.status === "ignored" && (
                <XCircle className="mr-1 h-3 w-3" />
              )}

              {suggestion.status}
            </Badge>
          </div>

          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {suggestion.description}
          </p>

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/20 px-2 py-1">
              <Rows3 className="h-3 w-3" />
              {suggestion.affectedRows.length} affected{" "}
              {suggestion.affectedRows.length === 1 ? "row" : "rows"}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/20 px-2 py-1 capitalize">
              <Sparkles className="h-3 w-3" />
              {formatAction(suggestion.action)}
            </span>

            {hasSuggestedValue(suggestion) && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-emerald-700">
                Suggested fix: {String(suggestion.suggestedValue)}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
          <Badge
            variant={getSeverityVariant(suggestion.severity)}
            className="h-6 px-2 text-[11px] capitalize"
          >
            <ShieldAlert className="mr-1 h-3 w-3" />
            {suggestion.severity}
          </Badge>

          <Badge variant="outline" className="h-6 px-2 text-[11px]">
            {suggestion.confidence}% confidence
          </Badge>
        </div>
      </div>

      {suggestion.status === "pending" && !hasAutoFix && (
        <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2 text-sm text-sky-800">
          No auto-fix available. Review the affected row and edit it manually if
          needed.
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => onReview(suggestion.id)}
          aria-expanded={isExpanded}
          aria-label={`Review suggestion details: ${suggestion.title}`}
        >
          {isResolved && <Eye className="mr-2 h-4 w-4" />}
          {isExpanded
            ? "Hide details"
            : isResolved
              ? "View decision"
              : "Review"}
        </Button>

        {!isResolved && (
          <>
            {hasAutoFix && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApprove?.(suggestion.id)}
                aria-label={`Apply suggested fix: ${suggestion.title}`}
              >
                Apply Fix
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onReject?.(suggestion.id)}
              aria-label={`Ignore suggestion: ${suggestion.title}`}
            >
              Ignore
            </Button>
          </>
        )}
      </div>

      {isExpanded && <SuggestionDetails suggestion={suggestion} />}
    </article>
  );
}

export default function SuggestionPanel({
  suggestions,
  hasDataset,
  onApproveSuggestion,
  onRejectSuggestion,
  onReviewSuggestion,
  onClearReview,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!hasDataset) {
    return (
      <Card className="p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />

        <CardTitle className="mt-3">No dataset uploaded yet</CardTitle>

        <CardDescription className="mt-1">
          Upload a file to see AI suggestions.
        </CardDescription>
      </Card>
    );
  }

  if (!suggestions.length) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          No suggestions available.
        </CardContent>
      </Card>
    );
  }

  const pendingSuggestions = suggestions.filter(
    (suggestion) => suggestion.status === "pending"
  );

  const resolvedSuggestions = suggestions.filter(
    (suggestion) => suggestion.status !== "pending"
  );

  const priority = pendingSuggestions[0];
  const remainingPendingSuggestions = pendingSuggestions.slice(1);

  const handleReview = (id: string) => {
    const nextExpandedId = expandedId === id ? null : id;

    setExpandedId(nextExpandedId);

    if (nextExpandedId === id) {
      onReviewSuggestion?.(id);
    } else {
      onClearReview?.();
    }
  };

  const handleApplyFix = (id: string) => {
    setExpandedId(null);
    onApproveSuggestion?.(id);
  };

  const handleIgnore = (id: string) => {
    setExpandedId(null);
    onRejectSuggestion?.(id);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />

          <CardTitle className="text-lg">Review Queue</CardTitle>
        </div>

        <CardDescription className="mt-1">
          Review AI-generated validation suggestions before applying decisions.
        </CardDescription>
      </div>

      <div className="space-y-3">
        {priority ? (
          <SuggestionCard
            suggestion={priority}
            isPriority
            isExpanded={expandedId === priority.id}
            onApprove={handleApplyFix}
            onReject={handleIgnore}
            onReview={handleReview}
          />
        ) : (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-900">
              All suggestions reviewed
            </p>

            <p className="mt-1 text-sm text-emerald-800">
              There are no pending AI recommendations for this dataset.
            </p>
          </div>
        )}

        {remainingPendingSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Open Review Items
            </p>

            {remainingPendingSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isExpanded={expandedId === suggestion.id}
                onApprove={handleApplyFix}
                onReject={handleIgnore}
                onReview={handleReview}
              />
            ))}
          </div>
        )}

        {resolvedSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">
              Resolved Decisions
            </p>

            {resolvedSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isExpanded={expandedId === suggestion.id}
                onReview={handleReview}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}