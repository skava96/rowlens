"use client";

import {
  CheckCircle2,
  Clock3,
  FileClock,
  ShieldCheck,
  UserCheck,
  UserPen,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  WORKFLOW_STORAGE_CHANGED_EVENT,
  readStoredWorkflowState,
} from "../workflow/workflow-storage";

type DatasetAuditPanelProps = {
  datasetId: string;
};

type StoredWorkflowState = ReturnType<typeof readStoredWorkflowState>;
type AuditEvent = NonNullable<StoredWorkflowState>["auditEvents"][number];

const workflowSnapshotCache = new Map<string, StoredWorkflowState>();
const workflowRawCache = new Map<string, string | null>();

function getWorkflowStorageKey(datasetId: string) {
  return `rowlens-workflow:${datasetId}`;
}

function getCachedWorkflowSnapshot(datasetId: string): StoredWorkflowState {
  const key = getWorkflowStorageKey(datasetId);
  const raw = window.localStorage.getItem(key);

  if (
    workflowRawCache.get(datasetId) === raw &&
    workflowSnapshotCache.has(datasetId)
  ) {
    return workflowSnapshotCache.get(datasetId) ?? null;
  }

  const snapshot = readStoredWorkflowState(datasetId);

  workflowRawCache.set(datasetId, raw);
  workflowSnapshotCache.set(datasetId, snapshot);

  return snapshot;
}

function getDecisionCounts(workflowState: StoredWorkflowState) {
  const suggestions = workflowState?.suggestions ?? [];

  return {
    completed: suggestions.filter((item) => item.status !== "pending").length,
    approved: suggestions.filter((item) => item.status === "approved").length,
    ignored: suggestions.filter((item) => item.status === "ignored").length,
    pending: suggestions.filter((item) => item.status === "pending").length,
  };
}

function getEventMeta(event: AuditEvent) {
  const operation = event.operation.toLowerCase();

  if (event.source === "undo" && operation.includes("manual edit")) {
    return {
      icon: UserPen,
      label: "Undo Manual Edit",
      className: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (event.source === "undo") {
    return {
      icon: Clock3,
      label: "Undo Applied Fix",
      className: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (operation.includes("ignored")) {
    return {
      icon: XCircle,
      label: "Ignored",
      className: "border-rose-100 bg-rose-50 text-rose-700",
    };
  }

  if (operation.includes("manual edit")) {
    return {
      icon: UserPen,
      label: "Manual edit",
      className: "border-blue-100 bg-blue-50 text-blue-700",
    };
  }

  if (operation.includes("applied") || operation.includes("approved")) {
    return {
      icon: CheckCircle2,
      label: "Applied",
      className: "border-emerald-100 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    icon: Clock3,
    label: "Recorded",
    className: "border-slate-100 bg-slate-50 text-slate-700",
  };
}

function formatEventSummary(event: AuditEvent) {
  const rowCount = event.rowIds.length;
  const fieldChangeCount = event.fieldChanges?.length ?? 0;

  if (fieldChangeCount > 0) {
    return `${rowCount} affected ${
      rowCount === 1 ? "row" : "rows"
    } - ${fieldChangeCount} field ${
      fieldChangeCount === 1 ? "change" : "changes"
    }`;
  }

  return `${rowCount} affected ${rowCount === 1 ? "row" : "rows"}`;
}

function formatActorStatus(event: AuditEvent) {
  const actor = event.actor === "local-user" ? "Current user" : event.actor;
  const status = event.status.replaceAll("_", " ");

  return `${actor} - ${status}`;
}

function getServerSnapshot(): StoredWorkflowState {
  return null;
}

export function DatasetAuditPanel({ datasetId }: DatasetAuditPanelProps) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(WORKFLOW_STORAGE_CHANGED_EVENT, onStoreChange);

    return () => {
      window.removeEventListener("storage", onStoreChange);
      window.removeEventListener(WORKFLOW_STORAGE_CHANGED_EVENT, onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(
    () => getCachedWorkflowSnapshot(datasetId),
    [datasetId]
  );

  const workflowState = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const auditEvents = useMemo(
    () => workflowState?.auditEvents ?? [],
    [workflowState]
  );

  const reversedAuditEvents = useMemo(
    () => auditEvents.slice().reverse(),
    [auditEvents]
  );

  const decisionCounts = useMemo(
    () => getDecisionCounts(workflowState),
    [workflowState]
  );

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold">Completed Reviews</p>
          </div>

          <p className="mt-3 text-3xl font-bold">
            {decisionCounts.completed}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold">Applied Fixes</p>
          </div>

          <p className="mt-3 text-3xl font-bold">{decisionCounts.approved}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold">Ignored Items</p>
          </div>

          <p className="mt-3 text-3xl font-bold">{decisionCounts.ignored}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <FileClock className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-semibold">Pending Reviews</p>
          </div>

          <p className="mt-3 text-3xl font-bold">{decisionCounts.pending}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Activity Timeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A chronological record of review decisions and dataset changes.
            </p>
          </div>

          <div className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
            {auditEvents.length} recorded{" "}
            {auditEvents.length === 1 ? "activity" : "activities"}
          </div>
        </div>

        {auditEvents.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/20 p-4">
            <p className="text-sm font-semibold text-foreground">
              No audit activity recorded yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Review suggestions, edit records, or apply fixes. Actions will
              appear here as part of the dataset audit trail.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {reversedAuditEvents.map((event) => {
              const meta = getEventMeta(event);
              const EventIcon = meta.icon;

              return (
                <article
                  key={event.id}
                  className="rounded-xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${meta.className}`}
                      >
                        <EventIcon className="h-4 w-4" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {event.operation}
                          </p>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}
                          >
                            {meta.label}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatEventSummary(event)}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatActorStatus(event)}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {event.timestamp}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
