import { BrowserAIProvider } from "./providers/browser-ai-provider";

// One browser-local engine is shared by background preload and dataset analysis.
export const browserAIProvider = new BrowserAIProvider();
