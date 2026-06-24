import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMLCEngine, createWebGPUEngine } = vi.hoisted(() => ({
  createMLCEngine: vi.fn(),
  createWebGPUEngine: vi.fn(),
}));

vi.mock("@mlc-ai/web-llm", () => ({
  CreateMLCEngine: createMLCEngine,
  CreateWebGPUEngine: createWebGPUEngine,
}));

import { BrowserAIProvider } from "../providers/browser-ai-provider";

describe("BrowserAIProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "gpu", {
      configurable: true,
      value: { requestAdapter: vi.fn().mockResolvedValue({}) },
    });
  });

  it("creates one WebLLM engine when concurrent callers load the model", async () => {
    const engine = { chat: { completions: { create: vi.fn() } } };
    createWebGPUEngine.mockResolvedValue(engine);
    const provider = new BrowserAIProvider();

    const [first, second] = await Promise.all([
      provider.loadModel(),
      provider.loadModel(),
    ]);

    expect(createWebGPUEngine).toHaveBeenCalledTimes(1);
    expect(createMLCEngine).not.toHaveBeenCalled();
    expect(first).toBe(engine);
    expect(second).toBe(engine);
  });
});
