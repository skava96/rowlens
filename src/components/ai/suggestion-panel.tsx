"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, XCircle } from "lucide-react";

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

function getSeverityVariant(severity: AISuggestion["severity"]) {
  if (severity === "high") return "destructive";
  if (severity === "medium") return "secondary";
  return "outline";
}

function SuggestionDetails({ suggestion }: { suggestion: AISuggestion }) {
  const details = [
    {
      label: "Affected rows",
      value: suggestion.affectedRows.map(formatRow).join(", "),
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
    <div className="mt-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
    suggestion.status === "approved" || suggestion.status === "rejected";

  return (
    <div
      className={cn(
        "rounded-xl border bg-background px-4 py-3 transition-colors",
        suggestion.status === "approved" &&
          "border-emerald-100 bg-emerald-50/10",
        suggestion.status === "rejected" && "border-rose-100 bg-rose-50/10",
        suggestion.status === "pending" &&
          isExpanded &&
          "border-sky-300 bg-sky-50/30",
        suggestion.status === "pending" &&
          isPriority &&
          !isExpanded &&
          "border-amber-200 bg-amber-50/20",
        suggestion.status === "pending" &&
          !isExpanded &&
          !isPriority &&
          "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold leading-5 text-foreground">
              {suggestion.title}
            </p>

            <Badge
              variant={
                suggestion.status === "approved"
                  ? "secondary"
                  : suggestion.status === "rejected"
                    ? "destructive"
                    : "outline"
              }
              className="h-5 px-2 text-[11px]"
            >
              {suggestion.status === "approved" && (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              )}
              {suggestion.status === "rejected" && (
                <XCircle className="mr-1 h-3 w-3" />
              )}
              {suggestion.status}
            </Badge>
          </div>

          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {suggestion.description}
          </p>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          <Badge
            variant={getSeverityVariant(suggestion.severity)}
            className="h-5 px-2 text-[11px]"
          >
            {suggestion.severity}
          </Badge>

          <Badge variant="outline" className="h-5 px-2 text-[11px]">
            {suggestion.confidence}%
          </Badge>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {!isResolved && (
          <>
            <Button
              size="sm"
              onClick={() => onApprove?.(suggestion.id)}
              aria-label={`Approve suggestion: ${suggestion.title}`}
            >
              Approve
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject?.(suggestion.id)}
              aria-label={`Reject suggestion: ${suggestion.title}`}
            >
              Reject
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          aria-expanded={isExpanded}
          aria-label={`Review suggestion details: ${suggestion.title}`}
          onClick={() => onReview(suggestion.id)}
        >
          {isResolved && <Eye className="mr-2 h-4 w-4" />}
          {isExpanded ? "Hide details" : isResolved ? "View decision" : "Review"}
        </Button>
      </div>

      {isExpanded && <SuggestionDetails suggestion={suggestion} />}
    </div>
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

  const handleApprove = (id: string) => {
    setExpandedId(null);
    onApproveSuggestion?.(id);
  };

  const handleReject = (id: string) => {
    setExpandedId(null);
    onRejectSuggestion?.(id);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-lg">Review Queue</CardTitle>
        </div>

        <CardDescription>
          AI-generated validation suggestions for your dataset.
        </CardDescription>
      </div>

      <div className="space-y-3">
        {priority ? (
          <SuggestionCard
            suggestion={priority}
            isPriority
            isExpanded={expandedId === priority.id}
            onApprove={handleApprove}
            onReject={handleReject}
            onReview={handleReview}
          />
        ) : (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 px-4 py-3">
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
                onApprove={handleApprove}
                onReject={handleReject}
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