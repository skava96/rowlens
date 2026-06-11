"use client";

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
};

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
    return "border-emerald-200 bg-emerald-50/40";
  }

  if (status === "ignored") {
    return "border-rose-200 bg-rose-50/40";
  }

  return "border-border bg-background";
}

function SuggestionCard({
  suggestion,
  isPriority = false,
  onApprove,
  onReject,
  onReview,
}: {
  suggestion: AISuggestion;
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
        "relative overflow-hidden rounded-xl border px-5 py-4 shadow-sm transition-colors",
        getStatusTone(suggestion.status),
        suggestion.status === "pending" &&
          isPriority &&
          "border-sky-300 bg-sky-50/30"
      )}
    >
      {suggestion.status === "pending" && isPriority && (
        <div className="absolute inset-y-0 left-0 w-1 bg-sky-500" />
      )}

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
              className="h-5 px-2 text-[11px] capitalize"
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
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1">
              <Rows3 className="h-3 w-3" />
              {suggestion.affectedRows.length} affected{" "}
              {suggestion.affectedRows.length === 1 ? "row" : "rows"}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 capitalize">
              <Sparkles className="h-3 w-3" />
              {formatAction(suggestion.action)}
            </span>

            {hasSuggestedValue(suggestion) && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
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

          <Badge variant="outline" className="h-6 bg-background px-2 text-[11px]">
            {suggestion.confidence}% confidence
          </Badge>
        </div>
      </div>

      {suggestion.status === "pending" && !hasAutoFix && (
        <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50/70 px-3 py-2 text-sm text-sky-800">
          No auto-fix available. Review the affected row and edit it manually if
          needed.
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => onReview(suggestion.id)}
          aria-label={
            isResolved
              ? `View affected rows for: ${suggestion.title}`
              : `Review affected rows for: ${suggestion.title}`
          }
        >
          {isResolved && <Eye className="mr-2 h-4 w-4" />}
          {isResolved ? "View affected rows" : "Review rows"}
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
              className="text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
              onClick={() => onReject?.(suggestion.id)}
              aria-label={`Ignore suggestion: ${suggestion.title}`}
            >
              Ignore
            </Button>
          </>
        )}
      </div>
    </article>
  );
}

export default function SuggestionPanel({
  suggestions,
  hasDataset,
  onApproveSuggestion,
  onRejectSuggestion,
  onReviewSuggestion,
}: Props) {
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

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-lg">Review Queue</CardTitle>
        </div>

        <CardDescription className="mt-1">
          Review AI-detected data quality issues before fixing or ignoring them.
        </CardDescription>
      </div>

      <div className="space-y-3">
        {priority ? (
          <SuggestionCard
            suggestion={priority}
            isPriority
            onApprove={onApproveSuggestion}
            onReject={onRejectSuggestion}
            onReview={(id) => onReviewSuggestion?.(id)}
          />
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
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
                onApprove={onApproveSuggestion}
                onReject={onRejectSuggestion}
                onReview={(id) => onReviewSuggestion?.(id)}
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
                onReview={(id) => onReviewSuggestion?.(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}