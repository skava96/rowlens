import { describe, expect, it, vi } from "vitest";

import { localWorkflowRepository } from "../local-workflow-repository";
import { WORKFLOW_STORAGE_CHANGED_EVENT } from "../workflow-storage";
import { initialState } from "../workflow-reducer";

describe("localWorkflowRepository", () => {
  it("notifies same-tab subscribers when a workflow draft is saved", () => {
    const listener = vi.fn();
    window.addEventListener(WORKFLOW_STORAGE_CHANGED_EVENT, listener);

    const result = localWorkflowRepository.saveDraft({
      ...initialState,
      datasetId: "customer-cleanup",
    });

    window.removeEventListener(WORKFLOW_STORAGE_CHANGED_EVENT, listener);

    expect(result.ok).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toMatchObject({
      detail: { datasetId: "customer-cleanup" },
    });
  });
});
