import { beforeEach, describe, expect, it, vi } from "vitest";

const { provider } = vi.hoisted(() => ({
  provider: {
    getAvailability: vi.fn(),
    loadModel: vi.fn(),
  },
}));

vi.mock("../browserAIClient", () => ({
  browserAIProvider: provider,
}));

import { preloadBrowserAI } from "../preloadBrowserAI";

describe("preloadBrowserAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ready after availability and model loading succeed", async () => {
    provider.getAvailability.mockResolvedValue({ status: "available" });
    provider.loadModel.mockResolvedValue(undefined);

    await expect(preloadBrowserAI()).resolves.toEqual({ status: "ready" });
    expect(provider.loadModel).toHaveBeenCalledTimes(1);
  });

  it("returns unavailable without attempting to load a model", async () => {
    provider.getAvailability.mockResolvedValue({
      status: "unavailable",
      reason: "No compatible GPU.",
    });

    await expect(preloadBrowserAI()).resolves.toEqual({
      status: "unavailable",
      reason: "No compatible GPU.",
    });
    expect(provider.loadModel).not.toHaveBeenCalled();
  });

  it("returns failed safely when loading fails", async () => {
    provider.getAvailability.mockResolvedValue({ status: "available" });
    provider.loadModel.mockRejectedValue(new Error("device lost"));
    await expect(preloadBrowserAI()).resolves.toEqual({ status: "failed" });
  });
});
