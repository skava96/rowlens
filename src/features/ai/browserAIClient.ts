import { BrowserAIProvider } from "./providers/browser-ai-provider";

// One browser-local engine is reused across on-demand dataset analysis runs.
export const browserAIProvider = new BrowserAIProvider();
