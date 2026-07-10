import { browserAIProvider } from "./browserAIClient";
import {
  AIInsightProgress,
  BrowserAIPreloadResult,
} from "./types";
import { setBrowserAIPreloadSnapshot } from "./browserAIPreloadStore";

export async function preloadBrowserAI(
  onProgress?: (progress: AIInsightProgress) => void
): Promise<BrowserAIPreloadResult> {
  try {
    onProgress?.({
      stage: "checking",
      message: "Checking local AI availability.",
    });
    setBrowserAIPreloadSnapshot({
      status: "checking",
      progress: {
        stage: "checking",
        message: "Checking local AI availability.",
      },
    });

    const availability = await browserAIProvider.getAvailability();

    if (availability.status !== "available") {
      setBrowserAIPreloadSnapshot({
        status: "unavailable",
        progress: null,
        reason: availability.reason,
      });
      return {
        status: "unavailable",
        reason: availability.reason,
      };
    }
    setBrowserAIPreloadSnapshot({
      status: "loading",
      progress: {
        stage: "loading",
        message: "Preparing local AI.",
        progress: 0,
      },
    });

    onProgress?.({
      stage: "loading",
      message: "Preparing local AI.",
      progress: 0,
    });
    await browserAIProvider.loadModel((progress) => {
      setBrowserAIPreloadSnapshot({
        status: "loading",
        progress,
      });

      onProgress?.(progress);
    });

    setBrowserAIPreloadSnapshot({
      status: "ready",
      progress: {
        stage: "complete",
        message: "Local AI model is ready.",
        progress: 1,
      },
    });

    return { status: "ready" };
  } catch (error) {
    void error;
    setBrowserAIPreloadSnapshot({
      status: "failed",
      progress: null,
    });
    return { status: "failed" };
  }
}
