import { browserAIProvider } from "./browserAIClient";
import {
  AIInsightProgress,
  BrowserAIPreloadResult,
} from "./types";

export async function preloadBrowserAI(
  onProgress?: (progress: AIInsightProgress) => void
): Promise<BrowserAIPreloadResult> {
  try {
    onProgress?.({
      stage: "checking",
      message: "Checking local AI availability.",
    });

    const availability = await browserAIProvider.getAvailability();

    if (availability.status !== "available") {
      return {
        status: "unavailable",
        reason: availability.reason,
      };
    }

    onProgress?.({
      stage: "loading",
      message: "Preparing local AI.",
      progress: 0,
    });
    await browserAIProvider.loadModel(onProgress);

    return { status: "ready" };
  } catch (error) {
    // The main interface stays focused on deterministic review. Technical
    // diagnostics remain available to developers without surfacing to users.
    console.error("CleanFlow browser AI preload failed", error);
    return { status: "failed" };
  }
}
