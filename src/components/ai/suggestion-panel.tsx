"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

interface SuggestionItem {
  id: string
  title: string
  detail: string
  confidence?: number
  affectedRows?: Array<number | string>
  examples?: Array<{
    row: number | string
    field: string
    currentValue: string
    suggestedValue: string
  }>
  confidenceReason?: string
}

interface SuggestionPanelProps {
  onApprove: () => void
  onReject: () => void
  onReview: () => void
  suggestions?: SuggestionItem[]
  hasDataset?: boolean
}

const defaultSuggestions: SuggestionItem[] = [
  {
    id: "invalid-emails",
    title: "3 invalid email formats detected",
    detail: "Review addresses that do not match your verified email pattern.",
    confidence: 92,
    affectedRows: [1, 2, 5],
    confidenceReason: "Detected likely typos in email domains and malformed address patterns.",
    examples: [
      {
        row: 1,
        field: "Email",
        currentValue: "john@gmial.com",
        suggestedValue: "john@gmail.com",
      },
      {
        row: 2,
        field: "Email",
        currentValue: "ops.team@@example.com",
        suggestedValue: "ops.team@example.com",
      },
    ],
  },
  {
    id: "duplicate-records",
    title: "2 duplicate records identified",
    detail: "Potential duplicates were found based on name and email similarity.",
    confidence: 88,
    affectedRows: [4, 7],
    confidenceReason: "Names and email handles are highly similar across affected rows.",
    examples: [
      {
        row: 4,
        field: "Customer",
        currentValue: "Avery Stone",
        suggestedValue: "Merge with row #7",
      },
    ],
  },
  {
    id: "country-standardization",
    title: "Standardize country names?",
    detail: "Normalize country values to a single canonical format.",
    affectedRows: [3, 8, 9],
    confidenceReason: "Values match known country aliases that can be safely normalized.",
    examples: [
      {
        row: 3,
        field: "Country",
        currentValue: "USA",
        suggestedValue: "United States",
      },
    ],
  },
  {
    id: "missing-values",
    title: "5 missing values found",
    detail: "Some rows are missing required fields like signup date and country.",
    affectedRows: [6, 10, 11, 12, 13],
    confidenceReason: "Required fields are blank and need review before automated processing.",
    examples: [
      {
        row: 6,
        field: "Signup date",
        currentValue: "Blank",
        suggestedValue: "Needs manual review",
      },
    ],
  },
]

const formatAffectedRow = (row: number | string) => {
  const rowValue = String(row)

  return rowValue.startsWith("#") ? rowValue : `#${rowValue}`
}

const renderExamples = (suggestion: SuggestionItem, className = "") => (
  <div className={`grid gap-4 rounded-2xl border border-border/70 bg-slate-50 p-4 text-sm text-slate-700 ${className}`}>
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Problematic rows
      </p>
      <div className="mt-2 grid gap-2">
        {(suggestion.examples ?? []).map((example) => (
          <div
            key={`${suggestion.id}-${example.row}-${example.field}`}
            className="grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-[90px_1fr]"
          >
            <span className="font-semibold text-slate-900">
              {formatAffectedRow(example.row)}
            </span>
            <span>
              <span className="font-medium text-slate-900">{example.field}:</span>{" "}
              {example.currentValue}
            </span>
          </div>
        ))}
      </div>
    </div>

    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Suggested Fix
      </p>
      <div className="mt-2 grid gap-2">
        {(suggestion.examples ?? []).map((example) => (
          <p
            key={`${suggestion.id}-${example.row}-${example.field}-fix`}
            className="rounded-xl bg-white p-3 font-medium text-slate-900"
          >
            {example.currentValue} → {example.suggestedValue}
          </p>
        ))}
      </div>
    </div>

    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Reason
      </p>
      <p className="mt-2 rounded-xl bg-white p-3 text-slate-600">
        {suggestion.confidenceReason ?? "The suggested change matches common validation patterns in the affected rows."}
      </p>
      {suggestion.confidence ? (
        <p className="mt-2 text-xs font-medium text-slate-500">
          Confidence: {suggestion.confidence}%
        </p>
      ) : null}
    </div>
  </div>
)

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  onApprove,
  onReject,
  onReview,
  suggestions = defaultSuggestions,
  hasDataset = true,
}) => {
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null)
  const prioritySuggestion = suggestions[0] ?? defaultSuggestions[0]

  const handleReview = (suggestionId: string) => {
    setExpandedSuggestionId((currentSuggestionId) =>
      currentSuggestionId === suggestionId ? null : suggestionId
    )
    onReview()
  }

  if (!hasDataset) {
    return (
      <Card className="rounded-[28px] border border-border/80 bg-background p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <CardTitle className="mt-5 text-lg font-semibold text-foreground">
          No dataset uploaded yet
        </CardTitle>
        <CardDescription className="mx-auto mt-2 max-w-xs text-sm text-slate-600">
          Upload a CSV or Excel file to begin validation and surface recommendations.
        </CardDescription>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-[28px] border border-border/80 bg-background p-6 shadow-sm">
        <CardHeader className="grid gap-4 pb-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-3xl bg-amber-100 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">Review Queue</CardTitle>
              <CardDescription className="mt-1 max-w-xl text-sm text-slate-600">
                Prioritized validation issues that need your approval, rejection, or review.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700" variant="outline">
              92% confidence
            </Badge>
            <Badge className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700" variant="outline">
              88% confidence
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 border-t border-border/70 pt-4">
          <div className="grid gap-4 rounded-[24px] border border-border/70 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <span>3 invalid email formats detected</span>
              </div>
              <div className="text-sm text-slate-600">Confidence: 92%</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={onApprove} className="rounded-full px-3 text-sm" size="sm">
                Approve
              </Button>
              <Button variant="destructive" onClick={onReject} className="rounded-full px-3 text-sm" size="sm">
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => handleReview(prioritySuggestion.id)}
                className="rounded-full px-3 text-sm"
                size="sm"
                aria-expanded={expandedSuggestionId === prioritySuggestion.id}
              >
                Review
              </Button>
            </div>

            {expandedSuggestionId === prioritySuggestion.id ? renderExamples(prioritySuggestion, "bg-white") : null}
          </div>

          <div className="rounded-[24px] border border-border/70 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-900">
              <span>Recommended suggestions</span>
              <Badge className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700" variant="outline">
                88% confidence
              </Badge>
            </div>

            <ul className="mt-4 space-y-3 text-sm">
              {suggestions.map((suggestion) => {
                const isExpanded = expandedSuggestionId === suggestion.id

                return (
                <li key={suggestion.id} className="rounded-3xl border border-border/70 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{suggestion.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{suggestion.detail}</p>
                      {suggestion.affectedRows?.length ? (
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Affected rows: {suggestion.affectedRows.map(formatAffectedRow).join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      {suggestion.confidence ? (
                        <Badge className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700" variant="outline">
                          {suggestion.confidence}% confidence
                        </Badge>
                      ) : null}
                      <Button
                        variant="outline"
                        onClick={() => handleReview(suggestion.id)}
                        className="rounded-full px-3 text-xs"
                        size="sm"
                        aria-expanded={isExpanded}
                      >
                        Review
                      </Button>
                    </div>
                  </div>

                  {isExpanded ? renderExamples(suggestion, "mt-3") : null}
                </li>
                )
              })}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SuggestionPanel
