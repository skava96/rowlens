"use client"

import { UploadCard } from "../components/upload/upload-card";
import { DatasetTable } from "../components/dataset/dataset-table";
import SuggestionPanel from "../components/ai/suggestion-panel";
import DatasetSummary from "@/components/dataset/dataset-summary";

const activityItems = [
  {
    time: "10:42 AM",
    label: "Uploaded customers.csv",
  },
  {
    time: "10:43 AM",
    label: "3 invalid emails detected",
  },
  {
    time: "10:45 AM",
    label: "Country names standardized",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <UploadCard />
      <DatasetSummary/>

      <section id="activity" className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Activity Timeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Recent dataset events and cleaning actions.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Live
          </span>
        </div>

        <ol className="mt-6 space-y-4">
          {activityItems.map((item, index) => (
            <li key={`${item.time}-${item.label}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="mt-1 h-3 w-3 rounded-full bg-slate-900 dark:bg-slate-100" />
                {index < activityItems.length - 1 ? (
                  <span className="mt-2 h-full w-px bg-border" />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-2xl border border-border/70 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 dark:bg-slate-950">
                <time className="shrink-0 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.time}
                </time>
                <span className="hidden text-sm text-muted-foreground sm:inline">—</span>
                <p className="text-sm text-slate-700 dark:text-slate-300">{item.label}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Dataset preview</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review your dataset columns and row samples before processing.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Preview
          </span>
        </div>
        <div className="mt-6">
          <DatasetTable />
        </div>
      </section>

      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">AI suggestions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore AI recommendations for cleaning, enrichment, and next steps.
            </p>
          </div>
          <button className="inline-flex items-center rounded-full border border-border/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-slate-100 dark:hover:bg-slate-900">
            Refresh
          </button>
        </div>
        <div className="mt-6">
          <SuggestionPanel onApprove={() => { }} onReject={() => { }} onReview={() => { }} />
        </div>
      </section>
    </div>
  );
}
