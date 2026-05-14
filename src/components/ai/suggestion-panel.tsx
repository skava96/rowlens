"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
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

const formatRow = (row: number) => `#${row}`;

function getSeverityVariant(severity: AISuggestion["severity"]) {
  if (severity === "high") return "destructive";
  if (severity === "medium") return "secondary";
  return "outline";
}

function SuggestionDetails({ suggestion }: { suggestion: AISuggestion }) {
  const details = [
    {
      label: "Affected Rows",
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
  ];

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {details.map((item) => (
          <div key={item.label}>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-medium capitalize text-foreground">
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
  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border border-border bg-background p-4 transition-colors",
        isExpanded && "border-sky-300 bg-sky-50/40",
        isPriority && "border-amber-200 bg-amber-50/20"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {suggestion.title}
            </p>

            {isExpanded && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Reviewing
              </Badge>
            )}
          </div>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {suggestion.description}
          </p>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          <Badge variant={getSeverityVariant(suggestion.severity)}>
            {suggestion.severity}
          </Badge>
          <Badge variant="outline">{suggestion.confidence}%</Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {isPriority && (
          <>
            <Button size="sm" onClick={() => onApprove?.(suggestion.id)}>
              Approve
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject?.(suggestion.id)}
            >
              Reject
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          aria-expanded={isExpanded}
          onClick={() => onReview(suggestion.id)}
        >
          {isExpanded ? "Hide details" : "Review"}
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
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!hasDataset) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground" />
        <CardTitle className="mt-4">No dataset uploaded yet</CardTitle>
        <CardDescription className="mt-2">
          Upload a file to see AI suggestions.
        </CardDescription>
      </Card>
    );
  }

  if (!suggestions.length) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No suggestions available.
        </CardContent>
      </Card>
    );
  }

  const priority = suggestions[0];
  const remainingSuggestions = suggestions.slice(1);

  const handleReview = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    onReviewSuggestion?.(id);
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <CardTitle>Review Queue</CardTitle>
        </div>

        <CardDescription>
          AI-generated validation suggestions for your dataset.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        <SuggestionCard
          suggestion={priority}
          isPriority
          isExpanded={expandedId === priority.id}
          onApprove={onApproveSuggestion}
          onReject={onRejectSuggestion}
          onReview={handleReview}
        />

        {remainingSuggestions.length > 0 && (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-foreground">
              All Suggestions
            </p>

            {remainingSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isExpanded={expandedId === suggestion.id}
                onReview={handleReview}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}