"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

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

  const handleApprove = (id: string) => onApproveSuggestion?.(id);
  const handleReject = (id: string) => onRejectSuggestion?.(id);

  const handleReview = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    onReviewSuggestion?.(id);
  };

  const renderSuggestionDetails = (suggestion: AISuggestion) => (
    <div className="mt-3 space-y-2 rounded-xl bg-muted/40 p-4 text-sm">
      <div>
        <p className="font-medium">Affected Rows</p>
        <p className="text-muted-foreground">
          {suggestion.affectedRows.map(formatRow).join(", ")}
        </p>
      </div>

      <div>
        <p className="font-medium">Type</p>
        <p className="capitalize text-muted-foreground">{suggestion.type}</p>
      </div>

      <div>
        <p className="font-medium">Severity</p>
        <p className="capitalize text-muted-foreground">
          {suggestion.severity}
        </p>
      </div>

      <div>
        <p className="font-medium">Confidence</p>
        <p className="text-muted-foreground">{suggestion.confidence}%</p>
      </div>
    </div>
  );

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
        <div className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{priority.title}</p>
              <p className="text-sm text-muted-foreground">
                {priority.description}
              </p>
            </div>

            <Badge variant="outline">{priority.confidence}%</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleApprove(priority.id)}>
              Approve
            </Button>

            <Button
              variant="destructive"
              onClick={() => handleReject(priority.id)}
            >
              Reject
            </Button>

            <Button
              variant="outline"
              aria-expanded={expandedId === priority.id}
              onClick={() => handleReview(priority.id)}
            >
              Review
            </Button>
          </div>

          {expandedId === priority.id && renderSuggestionDetails(priority)}
        </div>

        {remainingSuggestions.length > 0 && (
          <div className="space-y-3">
            <p className="font-semibold">All Suggestions</p>

            {remainingSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="space-y-2 rounded-xl border border-border p-4"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-medium">{suggestion.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.description}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <Badge variant={getSeverityVariant(suggestion.severity)}>
                      {suggestion.severity}
                    </Badge>
                    <Badge variant="outline">{suggestion.confidence}%</Badge>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  aria-expanded={expandedId === suggestion.id}
                  onClick={() => handleReview(suggestion.id)}
                >
                  Review
                </Button>

                {expandedId === suggestion.id &&
                  renderSuggestionDetails(suggestion)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}