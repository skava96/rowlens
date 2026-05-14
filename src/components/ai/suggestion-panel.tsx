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
  hasDataset?: boolean;
  onApproveSuggestion?: (id: string) => void;
  onRejectSuggestion?: (id: string) => void;
  onReviewSuggestion?: (id: string) => void;
};

const formatRow = (row: number) => `#${row}`;

export default function SuggestionPanel({
  suggestions,
  hasDataset = true,
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
      <div className="p-6 text-sm text-muted-foreground">
        No suggestions available.
      </div>
    );
  }

  const priority = suggestions[0];

  const handleApprove = (id: string) => onApproveSuggestion?.(id);
  const handleReject = (id: string) => onRejectSuggestion?.(id);

  const handleReview = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    onReviewSuggestion?.(id);
  };

  const renderSuggestionDetails = (s: AISuggestion) => (
    <div className="mt-3 rounded-xl bg-muted/40 p-4 text-sm space-y-2">
      <div>
        <p className="font-medium">Affected Rows</p>
        <p className="text-muted-foreground">
          {s.affectedRows.map(formatRow).join(", ")}
        </p>
      </div>

      <div>
        <p className="font-medium">Type</p>
        <p className="text-muted-foreground">{s.type}</p>
      </div>

      <div>
        <p className="font-medium">Severity</p>
        <p className="text-muted-foreground">{s.severity}</p>
      </div>

      <div>
        <p className="font-medium">Confidence</p>
        <p className="text-muted-foreground">{s.confidence}%</p>
      </div>
    </div>
  );

  return (
    <Card className="p-6 space-y-6">

      {/* Header */}
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <CardTitle>Review Queue</CardTitle>
        </div>
        <CardDescription>
          AI-generated validation suggestions for your dataset
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Priority Suggestion */}
        <div className="rounded-xl border p-4 space-y-3">
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="font-semibold">{priority.title}</p>
              <p className="text-sm text-muted-foreground">
                {priority.description}
              </p>
            </div>

            <Badge>{priority.confidence}%</Badge>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => handleApprove(priority.id)}>
              Approve
            </Button>

            <Button variant="destructive" onClick={() => handleReject(priority.id)}>
              Reject
            </Button>

            <Button variant="outline" onClick={() => handleReview(priority.id)}>
              Review
            </Button>
          </div>

          {expandedId === priority.id && renderSuggestionDetails(priority)}
        </div>

        {/* List */}
        <div className="space-y-3">
          <p className="font-semibold">All Suggestions</p>

          {suggestions.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border p-4 space-y-2"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.description}
                  </p>
                </div>

                <div className="flex gap-2 items-start">
                  <Badge>{s.severity}</Badge>
                  <Badge variant="outline">{s.confidence}%</Badge>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReview(s.id)}
              >
                Review
              </Button>

              {expandedId === s.id && renderSuggestionDetails(s)}
            </div>
          ))}
        </div>

      </CardContent>
    </Card>
  );
}