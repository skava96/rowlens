import { AIInsightProgress, BrowserAIPreloadStatus } from "./types";

type BrowserAIPreloadSnapshot = {
  status: BrowserAIPreloadStatus;
  progress: AIInsightProgress | null;
  reason?: string;
};

let snapshot: BrowserAIPreloadSnapshot = {
  status: "idle",
  progress: null,
};

const listeners = new Set<() => void>();

export function getBrowserAIPreloadSnapshot() {
  return snapshot;
}

export function setBrowserAIPreloadSnapshot(
  nextSnapshot: BrowserAIPreloadSnapshot
) {
  snapshot = nextSnapshot;
  listeners.forEach((listener) => listener());
}

export function subscribeToBrowserAIPreload(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}